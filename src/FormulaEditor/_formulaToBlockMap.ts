import {
  ContentState,
  ContentBlock,
  genKey,
  Modifier,
  SelectionState
} from "draft-js";
import { Map } from "immutable";
import { rangesByRegex } from "./utils";

export function formulaToBlockMap(formula: string): ContentBlock[] {
  let blocks = ContentState.createFromText(formula).getBlocksAsArray();
  blocks = [].concat(...blocks.map(createObjectBubbleBlocks));
  return blocks;
}

function createObjectBubbleBlocks(
  block: ContentBlock
): ContentBlock | ContentBlock[] {
  const parts = rangesByRegex(/\[\d+:?\d*\]/g, block.getText());
  if (parts.length !== 1) {
    return parts.map(
      ({ text, match }) =>
        new ContentBlock({
          text,
          key: genKey(),
          type: match ? "atomic" : "unstyled"
        })
    );
  }
  return block;
}

function createObjectBubbleEntities(content: ContentState): ContentState {
  content
    .getBlocksAsArray()
    .filter(
      block =>
        block.getType() === "atomic" &&
        block.getData().get("type") === "object-bubble"
    )
    .forEach(block => {
      content = content.createEntity("object-bubble", "IMMUTABLE");
      content = Modifier.applyEntity(
        content,
        new SelectionState({
          anchorKey: block.getKey(),
          focusKey: block.getKey(),
          anchorOffset: 0,
          focusOffset: block.getLength()
        }),
        content.getLastCreatedEntityKey()
      );
    });

  return content;
}
