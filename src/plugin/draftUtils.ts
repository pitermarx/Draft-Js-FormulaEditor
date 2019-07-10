import {
  Modifier,
  EditorState,
  SelectionState,
  ContentBlock,
  ContentState
} from "draft-js";

interface IRange {
  start: number;
  end: number;
}

export function createSelection(
  block: ContentBlock,
  r: IRange = undefined
): SelectionState {
  const key = block.getKey();
  return new SelectionState({
    anchorKey: key,
    startKey: key,
    endKey: key,
    focusKey: key,
    startOffset: r ? r.start : 0,
    anchorOffset: r ? r.start : 0,
    focusOffset: r ? r.end : block.getLength(),
    endOffset: r ? r.end : block.getLength()
  });
}

export function applyEntity(
  eState: EditorState,
  range: IRange,
  type: string,
  isMuttable = false
) {
  // assume single block
  const content = eState.getCurrentContent();
  const block = content.getFirstBlock();
  const afterNewEntity = Modifier.applyEntity(
    content,
    // select the range
    createSelection(block, range),
    // createEntity
    type
      ? content
          .createEntity(type, isMuttable ? "MUTABLE" : "IMMUTABLE")
          .getLastCreatedEntityKey()
      : null
  );

  // apply change
  return EditorState.push(eState, afterNewEntity, "apply-entity");
}

export function deleteRange(
  editorState: EditorState,
  range: IRange
): ContentState {
  const content = editorState.getCurrentContent();
  const block = content.getFirstBlock();
  return Modifier.removeRange(
    content,
    createSelection(block, range),
    "backward"
  );
}

export function getSelectionEntity(editorState: EditorState) {
  const selection = editorState.getSelection();
  if (!selection.getHasFocus()) {
    return;
  }

  const content = editorState.getCurrentContent();
  const block = content.getFirstBlock();
  const startOffset = selection.getStartOffset() - 1;
  const endOffset = selection.getEndOffset() - 1;
  const startEntity = block.getEntityAt(startOffset);
  const endEntity = block.getEntityAt(endOffset);
  if (!startEntity || startEntity !== endEntity) {
    return;
  }

  let selectionEntity;

  block.findEntityRanges(
    c => c.getEntity() === startEntity,
    (start, end) => {
      if (startOffset >= start - 1 && endOffset < end)
        selectionEntity = startEntity;
    }
  );

  return selectionEntity;
}
