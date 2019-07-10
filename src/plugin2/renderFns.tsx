import React from "react";
import { ContentBlock, ContentState } from "draft-js";

export function renderFn(block: ContentBlock) {
  const type = block.getType();
  const data = block.getData();
  if (type === "atomic" && data && data.get("type") === "object-bubble") {
    return {
      component: MediaComponent,
      props: {
        text: block.getText()
      }
    };
  }
}

function parseObject(text: string) {
  let [objectId, propertyId] = text.substring(1, text.length - 1).split(":");
  return [+objectId, +(propertyId || "85")];
}

class MediaComponent extends React.Component<{
  blockProps: { text: string };
  block: ContentBlock;
  contentState: ContentState;
}> {
  render() {
    const [obj, prop] = parseObject(this.props.blockProps.text);
    return (
      <span className="obj-bubble" ref={r => (this.elem = r)}>
        {`[${obj}:${prop === 85 ? "present-value" : prop}]`}
      </span>
    );
  }
}
