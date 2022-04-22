import { OpaqueType } from "@cloudy-ts/opaque-type";

/**
 * Represents an object with a toString() method.
 */
export interface Stringifiable {
  toString(): string;
}

/**
 * Represents an object that has been converted to a string.
 */
export type StringEncoded<T extends Stringifiable> = OpaqueType<string, T>;

/**
 * Converts the given object to a string.
 * @param value The object to convert to a string
 * @returns The string that represents the object
 * @example
 * ```ts
 * const hugeNumberString = stringEncode(99999999n);
 * // typeof hugeNumberString = StringEncoded<bigint>
 * const hugeNumber = BigInt(hugeNumberString)
 * // typeof hugeNumber = bigint
 * ```
 */
export function stringEncode<T extends Stringifiable>(value: T) {
  return value.toString() as StringEncoded<T>;
}
