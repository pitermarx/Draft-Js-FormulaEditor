import * as React from "react";
import { InternalConfig } from "./formulaEditor";
import { applyEntity, createSelection } from "./draftUtils";
import {
  typeStrategy,
  regexStrategy,
  findNoEntityRanges,
  findEntityRanges
} from "./strategies";
import { EditorState } from "draft-js";

import { Type as ObjSuggestionType } from "./objectSuggestion";

export const Type = "OBJECT-BUBBLE";

function parseObject(text: string) {
  let [objectId, propertyId] = text.substring(1, text.length - 1).split(":");
  return [+objectId, +(propertyId || "85")];
}

interface IObjectBubbleDecoratorProps {
  offsetKey: string;
  entityKey: string;
  decoratedText: string;
}
const component = (config: InternalConfig) => {
  return class ObjectBubbleDecorator extends React.Component<
    IObjectBubbleDecoratorProps,
    { obj; prop }
  > {
    elem: HTMLSpanElement;
    constructor(props) {
      super(props);
      let [obj, prop] = parseObject(this.props.decoratedText);
      this.state = { obj, prop };

      config.getObjectName(obj).then(obj => this.setState({ obj }));
      config.getPropertyName(prop).then(prop => this.setState({ prop }));
    }

    componentDidMount() {
      config.onMountBubble({
        getClientRect: () => this.elem.getBoundingClientRect(),
        entityType: Type,
        offsetKey: this.props.offsetKey,
        entityKey: this.props.entityKey,
        decoratedText: this.props.decoratedText
      });
    }

    componentWillUnmount() {
      config.onUnmountBubble(this.props.offsetKey);
    }

    render() {
      const title = this.state.obj + ":" + this.state.prop;
      return (
        <span className="obj-bubble" ref={r => (this.elem = r)}>
          [{title}]
          {/* 
            great hack.
            if the children are not in the content-editable
            then the selectionState gets all messed up
            try to remove this div and type "[1] + 1"
          */}
          <span style={{ display: "none" }}>{this.props.children}</span>
          {/* {this.props.children} */}
        </span>
      );
    }
  };
};

export const decorator = (config: InternalConfig) => ({
  strategy: typeStrategy(Type),
  component: component(config)
});

const findWithRegex = regexStrategy(/\[\d+:?\d*\]/g);

export function handler(editorState: EditorState) {
  // assume single block
  let currentContent = editorState.getCurrentContent();
  currentContent
    .getBlockMap()
    .filter(b => b.getType() !== "atomic")
    .forEach(block => {
      // the full formula
      let fullText = block.getText();

      findNoEntityRanges(block, start => {
        const entityKey = block.getEntityAt(start - 1);
        if (
          // there is an entity before the range
          entityKey &&
          // there is an ] after the entity
          fullText[start] === "]" &&
          // and it is an entity of type "ObjSuggestionType"
          currentContent.getEntity(entityKey).getType() === ObjSuggestionType
        ) {
          findEntityRanges(
            block,
            entityKey,
            (start, end) =>
              (editorState = applyEntity(editorState, { start, end }, null))
          );
        }
      });

      findWithRegex(block, (start, end) => {
        const afterChange = applyEntity(editorState, { start, end }, Type);

        editorState = EditorState.forceSelection(
          afterChange,
          createSelection(block, { start: end, end })
        );
      });
    });

  return editorState;
}
