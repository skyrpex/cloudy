import { StringEncoded } from "../../codec-string/index.js";

export type AttributeValue =
  | undefined
  | S
  | N
  | NB
  | B
  | BOOL
  | NULL
  | L<ArrayLike<AttributeValue>>
  | M<Record<string, AttributeValue>>;

export type AttributeMap = Record<string, AttributeValue>;

export type NativeBinaryAttribute =
  | ArrayBuffer
  | BigInt64Array
  | BigUint64Array
  | Buffer
  | DataView
  | Float32Array
  | Float64Array
  | Int16Array
  | Int32Array
  | Int8Array
  | Uint16Array
  | Uint32Array
  | Uint8Array
  | Uint8ClampedArray;

export type DocumentValue =
  | undefined
  | null
  | boolean
  | number
  | bigint
  | string
  | Document[]
  | NativeBinaryAttribute
  | {
      [key: string]: DocumentValue;
    };

export type ToAttributeMap<T extends object> = ToAttributeValue<T>["M"];

/**
 * Computes the JSON representation of an object, {@link T}.
 */
export type ToAttributeValue<T> = T extends undefined
  ? undefined
  : T extends null
    ? NULL
    : T extends boolean
      ? BOOL<T>
      : T extends string
        ? S<T>
        : T extends number
          ? N<T>
          : T extends bigint
            ? NB<T>
            : // : // this behavior is not defined by https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html
              // // should it be a number of string?
              // T extends Date
              // ? N<number>
              T extends NativeBinaryAttribute
              ? B
              : T extends ArrayLike<unknown>
                ? L<{
                    [index in keyof T]: index extends "length"
                      ? T[index]
                      : ToAttributeValue<T[index]>;
                  }>
                : M<{
                    [name in keyof T]: ToAttributeValue<T[name]>;
                  }>;

// export function isS(a: any): a is S {
//   return a !== undefined && "S" in a
// }

export interface S<T extends string = string> {
  S: T;
}

// export function isB(a: any): a is B {
//   return a !== undefined && "B" in a
// }

export interface B {
  B: Buffer;
}

// export function isBOOL(a: any): a is BOOL {
//   return a !== undefined && "BOOL" in a
// }

export interface BOOL<T = boolean> {
  BOOL: T;
}

// export function isM(a: any): a is M {
//   return a !== undefined && "M" in a
// }

export interface M<
  T extends Record<string, AttributeValue> = Record<string, AttributeValue>,
> {
  M: T;
}

// export function isN(a: any): a is N {
//   return a !== undefined && "N" in a
// }

export interface N<T extends number = number> {
  // If number extends N, it means that N is just a plain number,
  // so we make it acceptable to pass raw number strings instead
  // of forcing the user to use the `stringEncode` method.
  N: number extends T ? `${T}` | StringEncoded<T> : StringEncoded<T>;
}

export interface NB<T extends bigint = bigint> {
  // If bigint extends N, it means that N is just a plain bigint,
  // so we make it acceptable to pass raw bigint strings instead
  // of forcing the user to use the `stringEncode` method.
  N: bigint extends T ? `${T}` | StringEncoded<T> : StringEncoded<T>;
}

// export function isNULL(a: any): a is NULL {
//   return a !== undefined && "NULL" in a
// }

export interface NULL {
  NULL: boolean;
}

// export function isL(a: any): a is L {
//   return a !== undefined && "L" in a
// }

export interface L<
  T extends ArrayLike<AttributeValue> = ArrayLike<AttributeValue>,
> {
  L: T;
}

// export interface Stringifable {
//   toString(): string
// }

// // export type StringifiedNumber<T extends number | bigint = number> = OpaqueType<
// export type StringifiedNumber<T extends Stringifable> = OpaqueType<string, T>

// // export function stringEncode<T extends number | bigint>(value: T) {
// //   return value.toString() as StringifiedNumber<T>
// // }
