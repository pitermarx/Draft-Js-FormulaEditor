import {
  EditorState,
  Modifier,
  AtomicBlockUtils,
  ContentState,
  ContentBlock
} from "draft-js";

import { selectRegex } from "./selectionUtils";

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
