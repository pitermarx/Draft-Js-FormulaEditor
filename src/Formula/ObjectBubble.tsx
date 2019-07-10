import React from "react";

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

export default class extends React.Component<
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
