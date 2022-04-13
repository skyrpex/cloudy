import { OpaqueType } from "@cloudy-ts/opaque-type"

export interface Stringifable {
  toString(): string
}

export type StringEncoded<T extends Stringifable> = OpaqueType<string, T>

export function stringEncode<T extends Stringifable>(value: T) {
  return value.toString() as StringEncoded<T>
}
