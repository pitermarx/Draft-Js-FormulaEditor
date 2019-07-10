import {
  EditorState,
  Modifier,
  SelectionState,
  ContentBlock,
  AtomicBlockUtils,
  ContentState
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

export const advanceSelection = (selection: SelectionState, offset: number) =>
  selection
    .set("anchorOffset", selection.getAnchorOffset() + offset)
    .set("focusOffset", selection.getFocusKey() + offset) as SelectionState;

export function onChange(chars: string, editorState?: EditorState) {
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
    const entityKey = focusedBlock.getEntityAt(0);
    if (content.getEntity(entityKey).getMutability() === "IMMUTABLE") {
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

  editorState = insertAtomicBlocks(
    editorState,
    /\[\d+:?\d*\]/,
    (c: ContentState) => c.createEntity("object-bubble", "IMMUTABLE")
  );

  editorState = insertAtomicBlocks(
    editorState,
    /[A-Z]+/,
    (content: ContentState) => content.createEntity("function", "MUTABLE")
  );

  return editorState;
}

function insertAtomicBlocks(
  editorState: EditorState,
  pattern: RegExp,
  createEntity: (ContentState) => ContentState
) {
  let content = editorState.getCurrentContent();

  const blockToChange = content
    .getBlocksAsArray()
    .filter(b => b.getType() !== "atomic" && pattern.test(b.getText()))[0];

  if (!blockToChange) {
    return editorState;
  }

  const key = blockToChange.getKey();
  const match = pattern.exec(blockToChange.getText());

  content = Modifier.removeRange(content, selectRegex(key, match), "backward");
  editorState = EditorState.push(editorState, content, "remove-range");

  content = createEntity(content);
  editorState = AtomicBlockUtils.insertAtomicBlock(
    editorState,
    content.getLastCreatedEntityKey(),
    match[0]
  );

  editorState = insertAtomicBlocks(editorState, pattern, createEntity);

  return editorState;
}
