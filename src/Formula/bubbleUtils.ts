import { ContentState, DraftEntityMutability } from "draft-js";

export type BubbleType = "object-bubble" | "function" | "object-suggestion";

const createEntity = (
  c: ContentState,
  type: BubbleType,
  mut: DraftEntityMutability,
  data?
) => c.createEntity(type, mut, data);

export const createObjectBubbleEntity = (c: ContentState, t: string) => {
  const [objectId, propertyId] = t
    ? t.substring(1, t.length - 1).split(":")
    : [0, 0];
  return createEntity(c, "object-bubble", "IMMUTABLE", {
    objectId: +objectId,
    propertyId: +(propertyId || "85")
  });
};
export const createFunctionBubbleEntity = (c: ContentState) =>
  createEntity(c, "function", "MUTABLE");

export const createObjSugestionBubbleEntity = (c: ContentState) =>
  createEntity(c, "object-suggestion", "MUTABLE");
