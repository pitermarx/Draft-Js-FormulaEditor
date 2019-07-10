import * as React from "react";
import { ContentState, ContentBlock } from "draft-js";
import { BubbleType } from "./bubbleUtils";
import { getEntity } from "./utils";

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
    const entity = getEntity(this.props.contentState, this.props.block);
    const type = entity && (entity.getType() as BubbleType);
    const p = this.props.blockProps;
    switch (type) {
      case "object-bubble":
        return (
          <ObjectBubble
            spanRef={r => (this.ref = r)}
            {...p}
            {...entity.getData()}
          />
        );

      case "function":
      case "object-suggestion":
        return (
          <span ref={r => (this.ref = r)} className={type}>
            {this.props.block.getText()}
          </span>
        );

      default:
        return this.props.block.getText();
    }
  }
}

interface IObjectBubbleProps {
  spanRef: (ref) => void;
  getObjectName: (id: number) => Promise<string>;
  getPropertyName: (id: number) => Promise<string>;
  objectId: number;
  propertyId: number;
}

interface IObjectBubbleState {
  objName: string;
  propName: string;
}

class ObjectBubble extends React.Component<
  IObjectBubbleProps,
  IObjectBubbleState
> {
  constructor(p: IObjectBubbleProps) {
    super(p);
    this.state = {
      objName: p.objectId.toString(),
      propName: p.propertyId.toString()
    };

    p.getObjectName(p.objectId).then(o => this.setState({ objName: o }));
    p.getPropertyName(p.propertyId).then(o => this.setState({ propName: o }));
  }

  render() {
    return (
      <span ref={this.props.spanRef} className="obj-bubble">
        [{this.state.objName}:{this.state.propName}]
      </span>
    );
  }
}
