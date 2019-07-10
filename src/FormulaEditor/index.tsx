import React from "react";
import {
  Editor,
  EditorState,
  DefaultDraftBlockRenderMap,
  DraftHandleValue,
  ContentBlock
} from "draft-js";
import { Map } from "immutable";
import Debugger from "../Debugger";
import { stateToFormula, onChange } from "./utils";
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

// Renders empty blocks as spans to prevent newlines
function blockRender(b: ContentBlock) {
  if (b.getText() === "")
    return {
      component: () => null
    };

  if (b.getType() === "atomic") {
    return {
      component: Atom
    };
  }
}

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
            blockRenderMap={extendedBlockRenderMap}
            blockRendererFn={blockRender}
            editorState={this.state.editorState}
            onChange={this.onChange}
            // prevent newlines
            handleReturn={() => "handled"}
            handleBeforeInput={this.handleChar}
            handlePastedText={(text, html, state) =>
              this.handleChar(text, state)
            }
          />
        </div>
        <div style={{ marginTop: 30 }}>
          <Debugger
            focusedEntity={undefined}
            editorState={this.state.editorState}
          />
        </div>
      </>
    );
  }
}
