import {
  EditorState,
  Modifier,
  AtomicBlockUtils,
  ContentState,
  ContentBlock
} from "draft-js";

import { selectRegex, selectBlock } from "./selectionUtils";

export const stateToFormula = (editorState: EditorState): string =>
  sanitizeChars(editorState.getCurrentContent().getPlainText());

export const sanitizeChars = (chars: string): string =>
  chars.replace(/[^a-zA-Z0-9[()+-\\*:\s\]]/g, "");

export const getEntity = (content: ContentState, block: ContentBlock) => {
  const entityKey = block.getEntityAt(0);
  return entityKey && content.getEntity(entityKey);
};

export function insertAtomicBlocks(
  editorState: EditorState,
  pattern: RegExp,
  createEntity: (ContentState, string?) => ContentState
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

  content = createEntity(content, match[0]);
  editorState = AtomicBlockUtils.insertAtomicBlock(
    editorState,
    content.getLastCreatedEntityKey(),
    match[0]
  );

  editorState = insertAtomicBlocks(editorState, pattern, createEntity);

  return editorState;
}

export function getSelectionKey(
  editorState: EditorState
): { focusKey?; focusType? } {
  const selection = editorState.getSelection();

  const anchor = selection.getAnchorKey();
  const focus = selection.getFocusKey();

  if (anchor !== focus) {
    return;
  }

  const content = editorState.getCurrentContent();
  const block = content.getBlockForKey(anchor);
  const entity = getEntity(content, block);
  return entity && block.getType() === "atomic"
    ? { focusKey: anchor, focusType: entity.getType() }
    : {};
}

export function deleteBlock(
  key: string,
  editorState: EditorState
): EditorState {
  let content = editorState.getCurrentContent();
  const block = content.getBlockForKey(key);
  content = Modifier.removeRange(
    content,
    selectBlock(block, block.getLength()),
    "backward"
  );

  content = Modifier.setBlockType(
    content,
    content.getSelectionAfter(),
    "unstyled"
  );
  return EditorState.push(editorState, content, "remove-range");
}
