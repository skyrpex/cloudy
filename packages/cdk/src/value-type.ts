import { JsonEncoded, JsonSerializable } from "@cloudy-ts/json-codec";

const tag = Symbol("@cloudy-ts/cdk/ValueType");

export class ValueType<T> {
  declare readonly [tag]: T;

  public static string<T extends string>() {
    return new ValueType<T>();
  }

  public static json<T extends JsonSerializable>() {
    return new ValueType<JsonEncoded<T>>();
  }

  public static binary<T extends Uint8Array>() {
    return new ValueType<T>();
  }

  public static as<T>() {
    return new ValueType<T>();
  }
}
