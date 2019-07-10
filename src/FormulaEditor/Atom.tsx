import * as React from "react";
import { ContentState, ContentBlock } from "draft-js";

interface IAtomProps {
  contentState: ContentState;
  block: ContentBlock;
  blockProps: any;
  offsetKey: string;
}

export default class extends React.Component<IAtomProps> {
  render() {
    const key = this.props.block.getEntityAt(0);
    const type = key && this.props.contentState.getEntity(key).getType();
    switch (type) {
      case "object-bubble":
        return <span className="obj-bubble">{this.props.block.getText()}</span>;
      case "function":
        return <span className="function">{this.props.block.getText()}</span>;
      default:
        return this.props.block.getText();
    }
  }
}
