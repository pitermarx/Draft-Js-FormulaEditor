import { SelectionState, ContentBlock } from "draft-js";

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
