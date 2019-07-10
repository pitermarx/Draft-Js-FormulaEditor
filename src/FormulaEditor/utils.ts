import {
  EditorState,
  Modifier,
  SelectionState,
  ContentBlock,
  AtomicBlockUtils
} from "draft-js";

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
  editorState = changeBlockTypes(editorState);
  editorState = changeBlockTypes(editorState);
  editorState = changeBlockTypes(editorState);
  return editorState;
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
  const fullBlockSelection = selectBlock(blockToChange, 0);
  const match = /\[\d+:?\d*\]/.exec(blockToChange.getText());
  const text = match[0];

  content = Modifier.splitBlock(content, selectRegex(key, match));
  content = Modifier.insertText(content, fullBlockSelection, text);
  editorState = EditorState.push(editorState, content, "insert-characters");

  editorState = AtomicBlockUtils.insertAtomicBlock(
    editorState,
    content
      .createEntity("object-bubble", "IMMUTABLE")
      .getLastCreatedEntityKey(),
    ""
  );
  content = Modifier.setBlockType(content, fullBlockSelection, "atomic");

  content = content.createEntity("object-bubble", "IMMUTABLE");
  content = Modifier.applyEntity(
    content,
    fullBlockSelection,
    content.getLastCreatedEntityKey()
  );

  editorState = EditorState.push(editorState, content, "change-block-data");

  return editorState;
}
