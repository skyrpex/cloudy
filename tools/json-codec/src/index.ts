import { OpaqueType } from "@cloudy-ts/opaque-type"

type JsonSerializablePrimitive = string | number | boolean

export interface JsonSerializableRecord {
  [key: string]:
    | JsonSerializablePrimitive
    | JsonSerializablePrimitive[]
    | JsonSerializableRecord
    | JsonSerializableRecord[]
    | null
    | null[]
    | undefined
    | undefined[]
}

export type JsonSerializable =
  | JsonSerializablePrimitive
  | JsonSerializablePrimitive[]
  | JsonSerializableRecord
  | JsonSerializableRecord[]

export type JsonEncoded<T extends JsonSerializable = JsonSerializable> =
  OpaqueType<string, T>

/**
 * Converts a JavaScript value to a typed JavaScript Object Notation (JSON) string.
 * @param value A JavaScript value, usually an object or array, to be converted.
 * @param replacer A function that transforms the results.
 * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
 * @example
 * ```ts
 * const userJson = jsonEncode({ id: 1, name: "Jane Doe" });
 * console.log(userJson); // '{"id":1,"name":"Jane Doe"}'
 *
 * const user = jsonDecode(userJson);
 * type UserType = typeof user; // { id: number; name: string }
 * ```
 */
export function jsonEncode<T extends JsonSerializable>(
  value: T,
  replacer?: ((key: string, value: any) => any) | undefined,
  space?: string | number,
): JsonEncoded<T>

/**
 * Converts a JavaScript value to a typed JavaScript Object Notation (JSON) string.
 * @param value A JavaScript value, usually an object or array, to be converted.
 * @param replacer An array of strings and numbers that acts as an approved list for selecting the object properties that will be stringified.
 * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
 */
export function jsonEncode<T extends JsonSerializable>(
  value: T,
  replacer?: (number | string)[] | undefined,
  space?: string | number,
): JsonEncoded<T>

export function jsonEncode<T extends JsonSerializable>(
  value: T,
  replacer?: any,
  space?: string | number | undefined,
): JsonEncoded<T> {
  return JSON.stringify(value, replacer, space) as JsonEncoded<T>
}

/**
 * Converts a JavaScript Object Notation (JSON) string into an object.
 *
 * @param json A valid JSON string.
 * @param reviver A function that transforms the results. This function is called for each member of the object.
 * If a member contains nested objects, the nested objects are transformed before the parent object is.
 * @example
 * ```ts
 * const userJson = jsonEncode({ id: 1, name: "Jane Doe" });
 * const user = jsonDecode(userJson);
 * type UserType = typeof user; // { id: number; name: string }
 * ```
 */
export function jsonDecode<T extends JsonSerializable>(
  json: JsonEncoded<T>,
  reviver?: ((this: any, key: string, value: any) => any) | undefined,
) {
  return JSON.parse(json, reviver) as T
}
