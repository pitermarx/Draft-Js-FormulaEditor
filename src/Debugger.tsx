import React from "react";
import { convertToRaw } from "draft-js";

const toJSON = (o, sep = " ") => {
  o = typeof o === "function" ? o() : o;
  if (o && o.entityMap) o = convertToRaw(o);
  return o && <pre>{JSON.stringify(o, null, sep)}</pre>;
};

export default ({ title, item }) => (
  <div>
    <b>{title}</b>
    {toJSON(item)}
  </div>
);
