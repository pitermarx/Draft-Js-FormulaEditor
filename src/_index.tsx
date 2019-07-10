import React from "react";
import ReactDOM from "react-dom";
import { Editor, Modifier, EditorState } from "draft-js";

import { createSelection } from "./plugin/draftUtils";
import editor from "./plugin/formulaEditor";

import ObjectSuggestionPopover from "./ObjectSuggestionPopover";
import Debugger from "./Debugger";

import "draft-js/dist/Draft.css";
import "./styles.css";
import { findEntityRanges } from "./plugin/strategies";

const objectNamesCache = {
  "1": "uno",
  "2": "dos",
  "3": "tres"
};

const propNamesCache = {
  "85": "present-value"
};

const config = {
  formula: "[1:2] + [2] / SIN( [4:1])",
  getObjectName: id => Promise.resolve(objectNamesCache[id] || id),
  getPropertyName: id => Promise.resolve(propNamesCache[id] || id)
};
const { useFormulaEditor: useEditorState } = editor.initialize(config);

const App = ({ formula }) => {
  const [state, setState] = useEditorState(formula);
  return (
    <>
      <Editor
        editorState={state.editorState}
        onChange={setState}
        // prevent newlines
        handleReturn={() => "handled"}
        // prevent paste
        handlePastedText={() => "handled"}
        readOnly={state.focusedEntity && true}
      />
      {state.focusedEntity && state.focusedEntity.entityType && (
        <ObjectSuggestionPopover
          editorState={state.editorState}
          bubbleRect={state.focusedEntity.getClientRect()}
          bubbleText={state.focusedEntity.decoratedText}
          onClick={text => {
            findEntityRanges(
              state.editorState,
              state.focusedEntity.entityKey,
              (start, end) => {
                setState(s => {
                  let content = s.getCurrentContent();
                  const block = content.getFirstBlock();
                  content = Modifier.removeRange(
                    content,
                    createSelection(block, { start, end }),
                    "backward"
                  );
                  return EditorState.push(s, content, "backspace-character");
                });
                setState(s => {
                  let content = s.getCurrentContent();
                  const block = content.getFirstBlock();
                  content = Modifier.insertText(
                    content,
                    createSelection(block, { start, end: start }),
                    text
                  );
                  return EditorState.push(s, content, "insert-characters");
                });
              }
            );
          }}
        />
      )}
    </>
  );
};

ReactDOM.render(
  <App formula="[1] + SIN([99:99])" />,
  document.getElementById("root")
);
