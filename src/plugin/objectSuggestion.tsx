import * as React from "react";
import { applyEntity, createSelection } from "./draftUtils";
import { typeStrategy, matchRegex } from "./strategies";
import { EditorState } from "draft-js";
import { InternalConfig } from "./formulaEditor";

export const Type = "OBJECT-SUGGESTION";
interface IObjectSuggestionProps {
  offsetKey: string;
  entityKey: string;
  decoratedText: string;
}
const component = (config: InternalConfig) => {
  return class ObjectSuggestionDecorator extends React.Component<
    IObjectSuggestionProps
  > {
    elem: HTMLSpanElement;
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
      return (
        <span className="obj-suggestion" ref={r => (this.elem = r)}>
          {this.props.children}
        </span>
      );
    }
  };
};

export const decorator = (config: InternalConfig) => ({
  strategy: typeStrategy(Type),
  component: component(config)
});

const changeTypes = [
  "backspace-character",
  "delete-character",
  "insert-characters",
  "insert-fragment",
  "redo",
  "remove-range",
  "undo"
];

export function handler(editorState: EditorState): EditorState {
  const currentContent = editorState.getCurrentContent();

  const lastChange = editorState.getLastChangeType();
  if (!changeTypes.includes(lastChange)) {
    return editorState;
  }

  currentContent
    .getBlockMap()
    .filter(b => b.getType() !== "atomic")
    .forEach(block => {
      matchRegex(
        /(\[\d+:?\d*|\[\d*)([^\]])/g,
        block.getText(),
        0,
        (start, end) => {
          const entityKey = block.getEntityAt(start);
          if (
            entityKey &&
            currentContent.getEntity(entityKey).getType() !== Type
          ) {
            return;
          }
          const afterChange = applyEntity(
            editorState,
            { start, end },
            Type,
            true
          );

          editorState = EditorState.forceSelection(
            afterChange,
            createSelection(block, { start: end, end })
          );
        }
      );
    });

  return editorState;
}
