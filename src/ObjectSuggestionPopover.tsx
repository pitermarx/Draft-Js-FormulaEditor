import React from "react";

import { EditorState } from "draft-js";

export interface IObjectSuggestionPopoverProps {
  editorState: EditorState;
  onClick: (string) => void;
  bubbleRect: DOMRect | ClientRect;
  bubbleText: string;
}

function getStyle(decoratorRect: DOMRect | ClientRect): React.CSSProperties {
  const left =
    decoratorRect.left +
    (window.pageXOffset || document.documentElement.scrollLeft);
  const top =
    decoratorRect.bottom +
    (window.pageYOffset || document.documentElement.scrollTop);

  return { position: "absolute", left: `${left}px`, top: `${top}px` };
}

export default class ObjectSuggestionPopover extends React.Component<
  IObjectSuggestionPopoverProps
> {
  render() {
    if (!this.props.bubbleRect) {
      return null;
    }

    return (
      <div className="popover" style={getStyle(this.props.bubbleRect)}>
        <div onClick={() => this.props.onClick("[1]")}> uno </div>
        <div onClick={() => this.props.onClick("[2]")}> dos </div>
        <div onClick={() => this.props.onClick("[3:99]")}> tres </div>
      </div>
    );
  }
}
