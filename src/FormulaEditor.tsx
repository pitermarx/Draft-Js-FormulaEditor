import React from "react";
import {
  Editor,
  EditorState,
  DefaultDraftBlockRenderMap,
  DraftHandleValue,
  ContentBlock
} from "draft-js";

import Debugger from "./Debugger";
import { stateToFormula, getSelectionKey, deleteBlock } from "./Formula/utils";
import onChange from "./Formula/onChange";
import Atom from "./Formula/Atom";
import { BubbleType } from "./Formula/bubbleUtils";
import ObjSelector from "./ObjSelector";

interface IFormulaEditorProps {
  value?: string;
  onChange?: (formula: string) => void;
  getObjectName: (id: number) => Promise<string>;
  getPropertyName: (id: number) => Promise<string>;
}

// change atomic blocks to spans (instead of "figure")
const extendedBlockRenderMap = DefaultDraftBlockRenderMap.set("atomic", {
  element: "span"
});

interface IFormulaEditorState {
  editorState: EditorState;
  formula: string;
  focusKey?: string;
  focusType?: BubbleType;
}

export default class extends React.Component<
  IFormulaEditorProps,
  IFormulaEditorState
> {
  entities = new Map<string, () => ClientRect>();
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
  ) => {
    if (!prevState || newProps.value !== prevState.formula) {
      const editorState = onChange(newProps.value);
      return {
        editorState,
        focusedEntity: getSelectionKey(editorState),
        formula: newProps.value
      };
    }

    return null;
  };

  onChange = (editorState: EditorState) => {
    const formula = stateToFormula(editorState);
    const focus = getSelectionKey(editorState);
    this.setState({ editorState, formula, ...focus });
    if (this.props.onChange && this.state.formula !== formula) {
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
            blockRendererFn={(b: ContentBlock) => {
              if (b.getText() === "")
                // Renders empty blocks as null to prevent newlines
                return { component: () => null };

              if (b.getType() === "atomic") {
                return {
                  component: Atom,
                  props: {
                    getObjectName: this.props.getObjectName,
                    getPropertyName: this.props.getPropertyName,
                    entities: this.entities
                  }
                };
              }
            }}
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
        {this.state.focusType !== "function" && (
          <ObjSelector
            getRect={this.entities.get(this.state.focusKey)}
            onClick={text => {
              const state = deleteBlock(
                this.state.focusKey,
                this.state.editorState
              );
              this.onChange(onChange(text + " ", state));
            }}
          />
        )}
      </>
    );
  }
}
