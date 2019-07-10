import {
  ContentBlock,
  ContentState,
  CharacterMetadata,
  EditorState,
  SelectionState
} from "draft-js";
import { createSelection } from "./draftUtils";

type RangeCallback = (
  start: number,
  end: number,
  getSelection: () => SelectionState
) => void;

export function findNoEntityRanges(
  block: ContentBlock,
  callback: RangeCallback
) {
  findEntityRanges(block, null, callback);
}

export function findEntityRanges(
  block: ContentBlock | EditorState,
  entity: string,
  callback: RangeCallback
) {
  if (block instanceof EditorState) {
    block
      .getCurrentContent()
      .getBlockMap()
      .forEach(b => findEntityRanges(b, entity, callback));
  } else {
    block.findEntityRanges(
      c => c.getEntity() === entity,
      (start, end) =>
        callback(start, end, () => createSelection(block, { start, end }))
    );
  }
}

export function regexStrategy(
  regex: RegExp,
  filter: (c: CharacterMetadata) => boolean = undefined
) {
  return (contentBlock: ContentBlock, callback: RangeCallback) => {
    const fullText = contentBlock.getText();
    contentBlock.findEntityRanges(
      filter || (character => !character.getEntity()),
      (start, end) => {
        matchRegex(regex, fullText.substring(start, end), start, callback);
      }
    );
  };
}

export function matchRegex(
  regex: RegExp,
  text: string,
  rangeStart: number,
  callback: RangeCallback
) {
  let prevLastIndex = regex.lastIndex;
  let matchArr = regex.exec(text);
  while (matchArr !== null && regex.lastIndex !== prevLastIndex) {
    prevLastIndex = regex.lastIndex;
    const start = rangeStart + matchArr.index;
    callback(start, start + matchArr[0].length);
    matchArr = regex.exec(text);
  }
}

export function typeStrategy(type: string) {
  return (
    contentBlock: ContentBlock,
    callback: RangeCallback,
    contentState: ContentState
  ) => {
    contentBlock.findEntityRanges(character => {
      const entityKey = character.getEntity();
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === type
      );
    }, callback);
  };
}
