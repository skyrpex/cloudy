import {
  marshallOptions,
  unmarshallOptions,
  marshall as _marshall,
  unmarshall as _unmarshall,
} from "@aws-sdk/util-dynamodb";

import {
  AttributeMap,
  B,
  L,
  M,
  N,
  NB,
  NativeBinaryAttribute,
  S,
  ToAttributeMap,
} from "./attribute-value.js";
import { StringEncoded } from "../../codec-string/index.js";

export const marshall: <
  Item extends object,
  MarshallOptions extends marshallOptions | undefined,
>(
  item: Item,
  options?: MarshallOptions,
) => ToAttributeMap<Item> = _marshall;

export const unmarshall: <
  Item extends AttributeMap,
  UnmarshallOptions extends unmarshallOptions | undefined,
>(
  item: Item,
  options?: UnmarshallOptions,
) => {
  [property in keyof Item]: Unmarshall<Item[property], UnmarshallOptions>;
} = _unmarshall as any;

export interface NumberValue<N extends number> {
  value: `${N}`;
}

export type Unmarshall<
  T,
  UnmarshallOptions extends unmarshallOptions | undefined,
> = T extends S<infer s>
  ? s
  : T extends B
    ? NativeBinaryAttribute
    : T extends NB<infer n>
      ? Exclude<UnmarshallOptions, undefined>["wrapNumbers"] extends true
        ? { value: StringEncoded<n> }
        : never
      : T extends N<infer n>
        ? Exclude<UnmarshallOptions, undefined>["wrapNumbers"] extends true
          ? { value: StringEncoded<n> }
          : n
        : T extends Date
          ? string
          : T extends L<infer Items>
            ? {
                [index in keyof Items]: index extends "length"
                  ? Items[index]
                  : Unmarshall<Items[index], UnmarshallOptions>;
              }
            : T extends M<infer Attributes>
              ? {
                  [property in keyof Attributes]: Unmarshall<
                    Attributes[property],
                    UnmarshallOptions
                  >;
                }
              : never;

// type UnmarshallMap<
//   Item extends AttributeMap,
//   UnmarshallOptions extends unmarshallOptions | undefined,
// > = {
//   [property in keyof Item]: Unmarshall<Item[property], UnmarshallOptions>
// }

// type X = UnmarshallMap<
//   {
//     id: { S: string }
//     events: {
//       L: {
//         M: {
//           id: { S: string }
//         }
//       }[]
//     }
//   },
//   undefined
// >

// type Y = ToAttributeMap<X>
// const y: Y = {
//   id: {S: ""},
//   events: {L: [
//     {
//       M: {
//         id: {S:""}
//       }
//     }
//   ]}
// }
