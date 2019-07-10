import { EditorState, Modifier } from "draft-js";
import { sanitizeChars, getEntity, insertAtomicBlocks } from "./utils";
import {
  createObjectBubbleEntity,
  createFunctionBubbleEntity,
  createObjSugestionBubbleEntity
} from "./bubbleUtils";

export default function onChange(chars: string, editorState?: EditorState) {
  editorState = editorState || EditorState.createEmpty();
  let content = editorState.getCurrentContent();
  let selection = editorState.getSelection();

  // prevent invalid chars
  chars = sanitizeChars(chars);

  // prevent typing inside an atomic block or across blocs
  if (selection.getAnchorKey() !== selection.getFocusKey()) {
    return editorState;
  }

  const focusedBlock = content.getBlockForKey(selection.getAnchorKey());

  if (focusedBlock.getType() === "atomic") {
    const entity = getEntity(content, focusedBlock);
    if (entity && entity.getMutability() === "IMMUTABLE") {
      return editorState;
    } else {
      content = Modifier.setBlockType(content, selection, "unstyled");
    }
  }

  // if selection is not collapsed, delete content first
  if (!selection.isCollapsed()) {
    content = Modifier.removeRange(content, selection, "backward");
    editorState = EditorState.push(editorState, content, "remove-range");
    selection = editorState.getSelection();
  }

  // insert text
  content = Modifier.insertText(content, selection, chars);
  editorState = EditorState.push(editorState, content, "insert-characters");

  // create object bubbles
  editorState = insertAtomicBlocks(
    editorState,
    /\[\d+:?\d*\]/,
    createObjectBubbleEntity
  );

  // create function bubbles
  editorState = insertAtomicBlocks(
    editorState,
    /[A-Z]+/,
    createFunctionBubbleEntity
  );

  // create suggestion bubbles
  editorState = insertAtomicBlocks(
    editorState,
    /(\[\d+:?\d*|\[\d*)([^\]])/,
    createObjSugestionBubbleEntity
  );
  return editorState;
}
