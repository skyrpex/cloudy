import { JsonEncoded, JsonSerializable } from "@cloudy-ts/json-codec";

const tag = Symbol("@cloudy-ts/cdk.ValueType");

/**
 * Represents a type of value. Useful to define specialized attribute types
 * used in several Cloudy constructs.
 *
 * @example
 * ```ts
 * const bigIntType = ValueType.as<bigint>();
 * const userType = ValueType.json<{ name: string; age: number }>();
 * ```
 */
export class ValueType<T> {
  declare readonly [tag]: T;

  private constructor() {}

  /**
   * Create a string-based ValueType.
   */
  public static string<T extends string>() {
    return new ValueType<T>();
  }

  /**
   * Create a string-based ValueType that can be serialized to JSON.
   */
  public static json<T extends JsonSerializable>() {
    return new ValueType<JsonEncoded<T>>();
  }

  /**
   * Create a binary-based ValueType.
   */
  public static binary<T extends Uint8Array>() {
    return new ValueType<T>();
  }

  /**
   * Create a ValueType.
   */
  public static as<T>() {
    return new ValueType<T>();
  }
}
