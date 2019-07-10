import * as React from "react";
import { regexStrategy } from "./strategies";
import { EditorState } from "draft-js";
import { InternalConfig } from "./formulaEditor";

export const Type = "FUNCTION-SUGGESTION";

const component = (config: InternalConfig) => {
  return class FunctionSuggestionDecorator extends React.Component {
    render() {
      return <span className="function">{this.props.children}</span>;
    }
  };
};

export const decorator = (config: InternalConfig) => ({
  strategy: regexStrategy(/[A-Z]+/g),
  component: component(config)
});

export function handler(editorState: EditorState): EditorState {
  return editorState;
}
