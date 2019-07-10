import {
  ContentState,
  ContentBlock,
  Modifier,
  SelectionState,
  genKey
} from "draft-js";

import { Map } from "immutable";
interface IRange {
  start: number;
  end: number;
}

export function matchRegex(regex: RegExp, text: string): IRange[] {
  const ranges = [];
  let prevLastIndex = regex.lastIndex;
  let matchArr = regex.exec(text);
  while (matchArr !== null && regex.lastIndex !== prevLastIndex) {
    prevLastIndex = regex.lastIndex;
    ranges.push({
      start: matchArr.index,
      end: matchArr.index + matchArr[0].length
    });
    matchArr = regex.exec(text);
  }

  return ranges;
}

export function createSelection(
  block: ContentBlock,
  r: IRange = undefined
): SelectionState {
  const key = block.getKey();
  return new SelectionState({
    anchorKey: key,
    focusKey: key,
    anchorOffset: r ? r.start : 0,
    focusOffset: r ? r.end : block.getLength()
  });
}

function splitByRegex(
  regex: RegExp,
  text: string
): { text: string; match: boolean }[] {
  const ranges = matchRegex(regex, text);
  const matches = [];
  let start = 0;
  ranges.forEach(r => {
    if (start !== r.start) {
      matches.push({ match: false, text: text.substring(start, r.start) });
    }
    matches.push({ match: true, text: text.substring(r.start, r.end) });
    start = r.end + 1;
  });

  if (start < text.length) {
    matches.push({ match: false, text: text.substring(start, text.length) });
  }

  return matches;
}

export function createBlocks(formula: string): ContentState {
  const parts = splitByRegex(/\[\d+:?\d*\]/g, formula);

  const blocks = parts.map(
    ({ text, match }) =>
      new ContentBlock({
        text,
        key: genKey(),
        type: match ? "atomic" : "unstyled",
        data: match
          ? Map({
              type: "object-bubble"
            })
          : Map()
      })
  );

  let content = ContentState.createFromBlockArray(blocks);

  content = content.getBlockMap().reduce((ct, block) => {
    if (block.getType() !== "atomic") {
      return ct;
    }
    ct = ct.createEntity("object-block", "IMMUTABLE");
    return Modifier.applyEntity(
      ct,
      createSelection(block),
      ct.getLastCreatedEntityKey()
    );
  }, content);

  return content;
}
