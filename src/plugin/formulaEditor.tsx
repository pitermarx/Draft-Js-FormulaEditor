import { EditorState, ContentState, CompositeDecorator } from "draft-js";
import * as objectBubble from "./objectBubble";
import * as suggestion from "./objectSuggestion";
import * as funcSuggestion from "./functionSuggestion";
import React from "react";
import { getSelectionEntity } from "./draftUtils";

export interface IBubbleArgs {
  entityType: string;
  getClientRect: () => DOMRect | ClientRect;
  offsetKey: string;
  entityKey: string;
  decoratedText: string;
}

export interface InternalConfig {
  getObjectName: (id: number) => Promise<string>;
  getPropertyName: (id: number) => Promise<string>;
  onMountBubble: (args: IBubbleArgs) => void;
  onUnmountBubble: (offsetKey: string) => void;
}

export interface IFormulaEditorConfig {
  getObjectName: (id: number) => Promise<string>;
  getPropertyName: (id: number) => Promise<string>;
}

export interface IFormulaEditorState {
  editorState: EditorState;
  focusedEntity: IBubbleArgs;
}

export default {
  initialize(config: IFormulaEditorConfig) {
    const bubblesCache = new Map<string, IBubbleArgs>();

    const handlers = s => {
      s = objectBubble.handler(s);
      s = funcSuggestion.handler(s);
      s = suggestion.handler(s);
      return s;
    };

    const internalConfig: InternalConfig = {
      ...config,
      onMountBubble: args => bubblesCache.set(args.entityKey, args),
      onUnmountBubble: key => bubblesCache.delete(key)
    };

    const decorator = new CompositeDecorator([
      suggestion.decorator(internalConfig),
      objectBubble.decorator(internalConfig),
      funcSuggestion.decorator(internalConfig)
    ]);

    return {
      useFormulaEditor(
        formula: string
      ): [
        IFormulaEditorState,
        React.Dispatch<React.SetStateAction<EditorState>>
      ] {
        const initialState = EditorState.createWithContent(
          ContentState.createFromText(formula || ""),
          decorator
        );
        const [editorState, setEditorState] = React.useState<EditorState>(
          handlers(initialState)
        );
        const [focusedEntity, setFocusedEntity] = React.useState<IBubbleArgs>(
          undefined
        );

        function onChange(state: React.SetStateAction<EditorState>) {
          let stateValue =
            typeof state === "function" ? state(editorState) : state;
          stateValue = handlers(stateValue);
          const entity = bubblesCache.get(getSelectionEntity(stateValue));
          if (focusedEntity !== entity) {
            setFocusedEntity(entity);
          }

          setEditorState(state);
        }

        return [{ editorState, focusedEntity }, onChange];
      }
    };
  }
};
