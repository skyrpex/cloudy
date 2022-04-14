import { JsonEncoded, JsonSerializable } from "@cloudy-ts/json-codec"

declare const tag: unique symbol

export class ValueType<T> {
  public readonly [tag]: T | undefined

  public static string<T extends string>() {
    return new ValueType<T>()
  }

  public static json<T extends JsonSerializable>() {
    return new ValueType<JsonEncoded<T>>()
  }

  public static binary<T extends Uint8Array>() {
    return new ValueType<T>()
  }
}
