import React from "react";
import { Map } from "immutable";
import {
  Editor,
  EditorState,
  DefaultDraftBlockRenderMap,
  DraftHandleValue,
  ContentBlock
} from "draft-js";

import Debugger from "../Debugger";
import { stateToFormula } from "./utils";
import onChange from "./onChange";
import Atom from "./Atom";

interface IFormulaEditorProps {
  value?: string;
  onChange?: (formula: string) => void;
  getObjectName: (id: number) => Promise<string>;
  getPropertyName: (id: number) => Promise<string>;
}

// change atomic blocks to spans (instead of "figure")
const extendedBlockRenderMap = DefaultDraftBlockRenderMap.merge(
  Map({ atomic: { element: "span" } })
);

const blockRender = ({ getObjectName, getPropertyName }: IFormulaEditorProps) =>
  function(b: ContentBlock) {
    if (b.getText() === "")
      // Renders empty blocks as null to prevent newlines
      return { component: () => null };

    if (b.getType() === "atomic") {
      return {
        component: Atom,
        props: {
          getObjectName,
          getPropertyName
        }
      };
    }
  };

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
      editorState: onChange(p.value)
    };
  }

  static getDerivedStateFromProps = (
    newProps: IFormulaEditorProps,
    prevState?: IFormulaEditorState
  ) =>
    (!prevState || newProps.value !== prevState.formula) && {
      editorState: onChange(newProps.value),
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
    this.onChange(onChange(chars, editorState));
    return "handled";
  };

  render() {
    return (
      <>
        <div
          style={{
            background: "white",
            top: "8px",
            position: "fixed",
            width: "100%"
          }}
        >
          <Editor
            editorState={this.state.editorState}
            onChange={this.onChange}
            blockRenderMap={extendedBlockRenderMap}
            blockRendererFn={blockRender(this.props)}
            // prevent newlines
            handleReturn={() => "handled"}
            handleBeforeInput={this.handleChar}
            handlePastedText={(text, html, state) =>
              this.handleChar(text, state)
            }
          />
        </div>
        <div style={{ marginTop: 10, display: "flex" }}>
          <Debugger
            title="Editor State"
            item={() => this.state.editorState.getCurrentContent()}
          />
          <Debugger
            title="Selection"
            item={() => this.state.editorState.getSelection()}
          />
        </div>
      </>
    );
  }
}
