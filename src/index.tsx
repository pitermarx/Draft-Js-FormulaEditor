import React from "react";
import ReactDOM from "react-dom";

import "draft-js/dist/Draft.css";
import "./styles.css";
import FormulaEditor from "./FormulaEditor";

const objCache = {
  "1": "uno",
  "2": "dos",
  "3": "tres"
};

const propCache = {
  "85": "present-value"
};
const log = x => {
  // console.log(x);
  return x;
};

const App = () => {
  const [formula, setFormula] = React.useState("[1:99] + SIN ([2:57] * [7])");
  return (
    <FormulaEditor
      value={formula}
      onChange={f => setFormula(log(f))}
      getObjectName={id => Promise.resolve(objCache[id] || id)}
      getPropertyName={id => Promise.resolve(propCache[id] || id)}
    />
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
