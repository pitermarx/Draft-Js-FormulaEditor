import React from "react";
import {
  Editor,
  EditorState,
  DefaultDraftBlockRenderMap,
  DraftHandleValue
} from "draft-js";
import { Map } from "immutable";
import Debugger from "../Debugger";
import { stateToFormula, insertText } from "./utils";

interface IFormulaEditorProps {
  value?: string;
  onChange?: (formula: string) => void;
  getObjectName: (id: number) => Promise<string>;
  getPropertyName: (id: number) => Promise<string>;
}

const extendedBlockRenderMap = DefaultDraftBlockRenderMap.merge(
  Map({ atomic: { element: "div" } })
);

interface IFormulaEditorState {
  editorState: EditorState;
  formula: string;
}

export default class extends React.Component<
  IFormulaEditorProps,
  IFormulaEditorState
> {
  constructor(p: IFormulaEditorProps) {
    super(p);
    this.state = {
      formula: p.value,
      editorState: insertText(p.value)
    };
  }

  static getDerivedStateFromProps = (
    newProps: IFormulaEditorProps,
    prevState?: IFormulaEditorState
  ) =>
    (!prevState || newProps.value !== prevState.formula) && {
      editorState: insertText(newProps.value),
      formula: newProps.value
    };

  onChange = (editorState: EditorState) => {
    const formula = stateToFormula(editorState);
    this.setState({ editorState, formula });
    if (this.state.formula !== formula) {
      this.props.onChange(formula);
    }
  };

  handleChar = (chars: string, editorState: EditorState): DraftHandleValue => {
    this.onChange(insertText(chars, editorState));
    return "handled";
  };

  render() {
    return (
      <>
        <Editor
          blockRenderMap={extendedBlockRenderMap}
          editorState={this.state.editorState}
          onChange={this.onChange}
          // prevent newlines
          handleReturn={() => "handled"}
          handleBeforeInput={this.handleChar}
          handlePastedText={(text, html, state) => this.handleChar(text, state)}
        />
        <Debugger
          focusedEntity={undefined}
          editorState={this.state.editorState}
        />
      </>
    );
  }
}
