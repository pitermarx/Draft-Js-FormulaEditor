import React from "react";

export interface IObjectSelectorProps {
  onClick: (string) => void;
  getRect: () => DOMRect | ClientRect;
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

export default ({ getRect, onClick }: IObjectSelectorProps) => {
  const rect = getRect && getRect();
  if (!rect) {
    return null;
  }

  return (
    <div className="popover" style={getStyle(rect)}>
      <div onClick={() => onClick("[1]")}> uno </div>
      <div onClick={() => onClick("[2]")}> dos </div>
      <div onClick={() => onClick("[3:99]")}> tres </div>
    </div>
  );
};
