import React from "react";
import { convertToRaw } from "draft-js";
import { IFormulaEditorState } from "./plugin/formulaEditor";
function toJSON(o, sep = " ") {
  return o && JSON.stringify(o, null, sep);
}
export default ({ editorState, focusedEntity }: IFormulaEditorState) => (
  <>
    <pre>{toJSON(focusedEntity)}</pre>
    <pre>{toJSON(editorState && editorState.getSelection(), " ")}</pre>
    <pre>
      {toJSON(editorState && convertToRaw(editorState.getCurrentContent()))}
    </pre>
  </>
);
