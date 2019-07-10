import * as React from "react";
import { ContentState, ContentBlock } from "draft-js";
import { BubbleType } from "./bubbleUtils";
import { getEntity } from "./utils";

interface IAtomProps {
  contentState: ContentState;
  block: ContentBlock;
  blockProps: any;
  offsetKey: string;
}

export default class extends React.Component<IAtomProps> {
  render() {
    const entity = getEntity(this.props.contentState, this.props.block);
    const type = entity && (entity.getType() as BubbleType);
    switch (type) {
      case "object-bubble":
        return (
          <ObjectBubble {...this.props.blockProps} {...entity.getData()} />
        );

      case "function":
        return <span className="function">{this.props.block.getText()}</span>;

      default:
        return this.props.block.getText();
    }
  }
}

const ObjectBubble = ({
  objectId,
  propertyId,
  getObjectName,
  getPropertyName
}) => {
  const [objName, setObjName] = React.useState(objectId);
  const [propName, setPropName] = React.useState(propertyId);
  getObjectName(objectId).then(setObjName);
  getPropertyName(propertyId).then(setPropName);

  return (
    <span className="obj-bubble">
      [{objName}:{propName}]
    </span>
  );
};
