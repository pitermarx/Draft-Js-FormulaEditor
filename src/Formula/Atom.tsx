import * as React from "react";
import { ContentState, ContentBlock } from "draft-js";
import { BubbleType } from "./bubbleUtils";
import { getEntity } from "./utils";
import ObjectBubble from "./ObjectBubble";

interface IAtomProps {
  contentState: ContentState;
  block: ContentBlock;
  blockProps: {
    entities: Map<string, () => ClientRect>;
    getObjectName: (id: number) => Promise<string>;
    getPropertyName: (id: number) => Promise<string>;
  };
  offsetKey: string;
}

export default class extends React.Component<IAtomProps> {
  ref: HTMLElement;

  componentDidMount() {
    this.props.blockProps.entities.set(this.props.block.getKey(), () =>
      this.ref.getBoundingClientRect()
    );
  }

  componentWillUnmount() {
    this.props.blockProps.entities.delete(this.props.block.getKey());
  }

  render() {
    const prop = this.props;
    const block = this.props.block;
    const entity = getEntity(prop.contentState, block);
    const type = entity && (entity.getType() as BubbleType);
    switch (type) {
      case "object-bubble":
        return (
          <ObjectBubble
            spanRef={r => (this.ref = r)}
            {...prop.blockProps}
            {...entity.getData()}
          />
        );

      case "function":
        return (
          <span ref={r => (this.ref = r)} className="function">
            {block.getText()}
          </span>
        );

      case "object-suggestion":
        return (
          <span ref={r => (this.ref = r)} className="obj-suggestion">
            {block.getText()}
          </span>
        );

      default:
        return block.getText();
    }
  }
}
