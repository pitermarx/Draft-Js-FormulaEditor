import {
  EditorState,
  Modifier,
  SelectionState,
  ContentBlock,
  AtomicBlockUtils
} from "draft-js";
import { Map } from "immutable";

export const stateToFormula = (editorState: EditorState): string =>
  sanitizeChars(editorState.getCurrentContent().getPlainText());

export const sanitizeChars = (chars: string): string =>
  chars.replace(/[^a-zA-Z0-9[()+-\\*:\s\]]/g, "");

export const selectBlock = (block: ContentBlock, offset: number) =>
  new SelectionState({
    anchorOffset: 0,
    focusOffset: offset,
    anchorKey: block.getKey(),
    focusKey: block.getKey()
  });

export const selectRegex = (key: string, regex: RegExpMatchArray) =>
  new SelectionState({
    anchorOffset: regex.index,
    focusOffset: regex.index + regex[0].length,
    anchorKey: key,
    focusKey: key
  });

export function insertText(chars: string, editorState?: EditorState) {
  editorState = editorState || EditorState.createEmpty();
  let content = editorState.getCurrentContent();
  let selection = editorState.getSelection();

  // prevent invalid chars
  chars = sanitizeChars(chars);

  // prevent typing inside an atomic block or across blocs
  if (selection.getAnchorKey() !== selection.getFocusKey()) {
    return editorState;
  }
  if (content.getBlockForKey(selection.getAnchorKey()).getType() === "atomic") {
    return editorState;
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

  editorState = changeBlockTypes(editorState);

  return markEmptyBlocks(editorState);
}

function changeBlockTypes(editorState: EditorState) {
  let content = editorState.getCurrentContent();

  const blockToChange = content
    .getBlocksAsArray()
    .filter(
      b => b.getType() !== "atomic" && /\[\d+:?\d*\]/.test(b.getText())
    )[0];

  if (!blockToChange) {
    return editorState;
  }

  const key = blockToChange.getKey();
  const match = /\[\d+:?\d*\]/.exec(blockToChange.getText());

  content = Modifier.removeRange(content, selectRegex(key, match), "backward");
  editorState = EditorState.push(editorState, content, "remove-range");

  content.createEntity("object-bubble", "IMMUTABLE");
  editorState = AtomicBlockUtils.insertAtomicBlock(
    editorState,
    content.getLastCreatedEntityKey(),
    match[0]
  );

  editorState = changeBlockTypes(editorState);

  return editorState;
}

function markEmptyBlocks(editorState: EditorState): EditorState {
  let content = editorState.getCurrentContent();
  content
    .getBlocksAsArray()
    .filter(b => !b.getText())
    .forEach(b => {
      content = Modifier.setBlockData(
        content,
        selectBlock(b, 0),
        Map({ isEmpty: true })
      );
    });

  return EditorState.push(editorState, content, "change-block-data");
}
