import type { AttributeValue } from "@aws-sdk/client-dynamodb"
import {
  Table as BaseTable,
  AttributeType,
  StreamViewType,
  TableProps,
} from "aws-cdk-lib/aws-dynamodb"
import { Construct } from "constructs"
import { Function, Union, Object, List } from "ts-toolbelt"

import { OpaqueType } from "@cloudy-ts/opaque-type"

import { staticTest } from "../static-test.js"

export { AttributeValue } from "@aws-sdk/client-dynamodb"
export {
  AttributeType,
  StreamViewType,
  BillingMode,
} from "aws-cdk-lib/aws-dynamodb"

/**
 * Represents a DynamoDB item.
 */
export interface DynamodbItem {
  [key: string]: AttributeValue
}

// S: string;
//         N?: never;
//         B?: never;
//         SS?: never;
//         NS?: never;
//         BS?: never;
//         M?: never;
//         L?: never;
//         NULL?: never;
//         BOOL?: never;
type DynamodbPrimitiveValues =
  | string
  | number
  | bigint
  | Uint8Array
  | boolean
  | string[]
  | (number | bigint)[]
  | Uint8Array[]
  | boolean[]

interface DynamodbMapValue {
  [name: string]:
    | DynamodbPrimitiveValues
    | DynamodbMapValue
    | DynamodbMapValue[]
}

type DynamodbMap = DynamodbMapValue

// /**
//  * Returns the AttributeValue of the given DynamoDB item key.
//  *
//  * @example
//  * ```ts
//  * type User = {
//  *   id: { N: string }
//  *   name: { S: string }
//  * }
//  * type UserId = ItemAttributeValue<User, "id"> // { N: string }
//  * type UserName = ItemAttributeValue<User, "name"> // { S: string }
//  * ```
//  */
// type ItemAttributeValue<
//   Item extends DynamodbItem,
//   Key extends keyof Item,
// > = Key extends keyof Item ? Item[Key] : never

// /**
//  * Returns the equivalent AttributeType for the given DynamoDB item key.
//  *
//  * @example
//  * ```ts
//  * type User = {
//  *   id: { N: string }
//  *   name: { S: string }
//  * }
//  * type UserIdAttributeType = ItemAttributeType<User, "id"> // AttributeType.NUMBER
//  * type UserNameAttributeType = ItemAttributeType<User, "name"> // AttributeType.STRING
//  * ```
//  */
// type ItemAttributeType<
//   Item extends DynamodbItem,
//   Key extends keyof Item,
// > = ItemAttributeValue<Item, Key> extends AttributeValue.SMember
//   ? AttributeType.STRING
//   : ItemAttributeValue<Item, Key> extends AttributeValue.NMember
//   ? AttributeType.NUMBER
//   : ItemAttributeValue<Item, Key> extends AttributeValue.BMember
//   ? AttributeType.BINARY
//   : never

// /**
//  * Returns the equivalent AttributeValue for the given AttributeType.
//  *
//  * @example
//  * ```ts
//  * type Type = AttributeValueFromAttributeType<AttributeType.STRING> // { S: string }
//  * type Type = AttributeValueFromAttributeType<AttributeType.NUMBER> // { N: string }
//  * type Type = AttributeValueFromAttributeType<AttributeType.BINARY> // { B: Uint8Array }
//  * ```
//  */
// type AttributeValueFromAttributeType<T extends AttributeType> =
//   T extends AttributeType.STRING
//     ? { S: string }
//     : T extends AttributeType.NUMBER
//     ? { N: string }
//     : T extends AttributeType.BINARY
//     ? { B: Uint8Array }
//     : never

/**
 * Defines a table key such as partition key or sort key.
 */
export type KeyDefinition = {
  name: string
  type: AttributeType
}

// type AttributeFromKeyDefinition<T extends KeyDefinition | undefined> =
//   T extends KeyDefinition
//     ? {
//         [name in T["name"]]: AttributeValueFromAttributeType<T["type"]>
//       }
//     : {}

type TypeFromAttributeType<T extends AttributeType> =
  T extends AttributeType.STRING
    ? string
    : T extends AttributeType.NUMBER
    ? number | bigint
    : T extends AttributeType.BINARY
    ? Uint8Array
    : never
export type AttributeFromKeyDefinition<T extends KeyDefinition | undefined> =
  T extends KeyDefinition
    ? {
        [name in T["name"]]: TypeFromAttributeType<T["type"]>
      }
    : {}

// /**
//  * Defines the properties that we're interested in: partitionKey, sortKey and stream.
//  *
//  * Those are used to provide type-safe constraints.
//  */
// export type StaticProperties = {
//   partitionKey: KeyDefinition
//   sortKey?: KeyDefinition | undefined
//   stream?: StreamViewType | undefined
// }

// /**
//  * Defines the rest of table properties.
//  */
// type BaseProperties = Omit<TableProps, "partitionKey" | "sortKey" | "stream">

export type AccessPattern<
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined,
> = DynamodbMap &
  AttributeFromKeyDefinition<PartitionKey> &
  AttributeFromKeyDefinition<SortKey>

interface TableProperties<
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined,
  AccessPatterns extends AccessPattern<PartitionKey, SortKey> | "any",
  StreamView extends StreamViewType | undefined = undefined,
> extends TableProps {
  partitionKey: PartitionKey
  sortKey?: SortKey
  accessPatterns: AccessPatterns
  stream?: StreamView
}

/**
 * Represents the name of a dynamodb table along with the table types.
 */
export type TableName<
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined,
  AccessPatterns extends AccessPattern<PartitionKey, SortKey> | "any",
  StreamView extends StreamViewType | undefined,
> = OpaqueType<
  string,
  {
    readonly t: unique symbol
    AccessPatterns: AccessPatterns
    PartitionKey: PartitionKey
    SortKey: SortKey
    StreamView: StreamView
  }
>

// export type TopicArn<Types extends TopicTypes, Fifo extends boolean> = Opaque<
//   string,
//   { readonly t: unique symbol; types: TopicTypes; fifo: Fifo }
// >

/**
 * Defines a type-safe DynamoDB table.
 *
 * @example
 * ```ts
 * type User = {
 *   pk: { S: string }
 *   sk: { N: string }
 * }
 * const table = new cloudy.Table(this, "table", {
 *   partitionKey: {
 *     name: "pk",
 *     type: cloudy.AttributeType.STRING,
 *   },
 *   sortKey: {
 *     name: "sk",
 *     type: cloudy.AttributeType.NUMBER,
 *   },
 * }).withItemType<User>()
 * ```
 */
export class Table<
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined = undefined,
  AccessPatterns extends AccessPattern<PartitionKey, SortKey> | "any" = "any",
  StreamView extends StreamViewType | undefined = undefined,
> extends BaseTable {
  /**
   * Name of the dynamodb table.
   *
   * @attribute
   */
  public readonly tableName!: TableName<
    PartitionKey,
    SortKey,
    AccessPatterns,
    StreamView
  >

  public constructor(
    scope: Construct,
    id: string,
    properties: Function.Narrow<
      TableProperties<PartitionKey, SortKey, AccessPatterns, StreamView>
    >,
    // properties: TableProperties<
    //   PartitionKey,
    //   SortKey,
    //   AccessPatterns,
    //   StreamView
    // >,
  ) {
    super(scope, id, properties as unknown as TableProps)
  }
}

export const AccessPatterns = {
  // boolType,
  // stringType,
  // numberType,
  // arrayType,
  // objectType,
  // BOOL: boolType,
  // STRING: stringType,
  // NUMBER: numberType,
  // ARRAY: arrayType,
  // OBJECT: objectType,
  // bool: boolType,
  // string: stringType,
  // number: numberType,
  // array: arrayType,
  // object: objectType,
  from: accessPatternsFrom,
  any() {
    // return undefined as unknown as DynamodbMap
    return "any" as const
  },
}

// export function boolType() {
//   // return { BOOL: undefined as unknown as T }
//   return undefined as unknown as boolean
// }

// export function stringType<T extends string>() {
//   // return { S: undefined as unknown as T }
//   return undefined as unknown as T
// }

// export function numberType<T extends number | bigint>() {
//   // return { N: undefined as unknown as T }
//   return undefined as unknown as T
// }

// export function arrayType<T extends AttributeValue>(arrayOf: T) {
//   // return { L: undefined as unknown as T[] }
//   return undefined as unknown as T[]
// }

// export function objectType<T extends DynamodbItem>(object: T) {
//   // return { M: undefined as unknown as T }
//   return undefined as unknown as T
// }

// // export function conjunctionType<T extends DynamodbItem[]>(...types: T) {
// //   return {} as T
// // }
// // export function conjunctionType<T extends DynamodbItem, T2 extends DynamodbItem>(t1: T, t2: T2) {
// //   return {} as T| T2
// // }
// // export function conjunctionType<Ts extends DynamodbItem[]>(...types: Ts) {
// //   return {} as MergeList<Ts>
// // }
// export function conjunctionType<Ts extends any[]>(...types: Ts) {
//   return {} as MergeList<Ts>
// }

// type MergeList<Ts extends any[]> = Ts extends [
//   infer T1,
//   infer T2,
//   ...infer Tail,
// ]
//   ? T1 | T2 | MergeList<Tail>
//   : Ts extends [infer T1]
//   ? T1
//   : never

// type X0 = MergeList<[]>
// type X1 = MergeList<[{ id: "1"; yes: "yes" }]>
// type X2 = MergeList<[{ id: "1"; yes: "yes" }, { id: "2"; no: "no" }]>
// type X3 = MergeList<
//   [{ id: "1"; yes: "yes" }, { id: "2"; no: "no" }, { id: "3"; maybe: "maybe" }]
// >

// // type Pattern =
// //   | {
// //       id: `YES#${string}`
// //       yes: "yes"
// //     }
// //   | {
// //       id: `NO#${string}`
// //       no: "no"
// //     }
// const x = conjunctionType(
//   {
//     id: AccessPatterns.stringType<`YES#${string}`>(),
//     yes: AccessPatterns.stringType<"yes">(),
//     // id: undefined as unknown as `YES#${string}`,
//     // yes: undefined as unknown as "yes",
//   },
//   {
//     id: AccessPatterns.stringType<`NO#${string}`>(),
//     no: AccessPatterns.stringType<"no">(),
//     // id: undefined as unknown as `NO#${string}`,
//     // no: undefined as unknown as "no",
//   },
// )
// type X = typeof x
// // type X =
// //   // | { id: { S: `YES#${string}` }; yes: { S: "yes" } }
// //   // | { id: { S: `NO#${string}` }; no: { S: "no" } }
// //   | { id: `YES#${string}`; yes: { S: "yes" } }
// //   | { id:`NO#${string}`; no: { S: "no" } }
// function caca(x: X) {}
// // caca({
// //   id: { S: "YES#1" },
// //   yes: { S: "yes" },
// //   no: { S: "no" },
// // })
// // caca({
// //   id: { S: "NO#1" },
// //   yes: { S: "yes" },
// //   no: { S: "no" },
// // })
// caca({
//   id: "YES#1",
//   yes: "yes",
//   no: "no",
// })
// caca({
//   id: "NO#1",
//   yes: "yes",
//   no: "no",
// })

function accessPatternsFrom<T extends DynamodbMap>() {
  return {} as T
}

type Revision = OpaqueType<bigint, { readonly t: unique symbol }>
staticTest((scope: Construct, id: string) => {
  type A = {
    id: `a#${string}`
    ho: Revision
    // a: "a"
  }
  type B = {
    id: `b#${string}`
    ho: Revision
    b: "b"
    caca: boolean
    // x: () => number
    cacas: {
      lol: string
      x: string[]
    }[]
  }
  const table = new Table(scope, id, {
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
    // sortKey: {
    //   name: "ho",
    //   type: AttributeType.NUMBER,
    // },
    stream: StreamViewType.NEW_IMAGE,
    accessPatterns: AccessPatterns.from<A | B>(),
    // accessPatterns: AccessPatterns.any(),
    // accessPatterns: AccessPatterns.from<A>(),
    // accessPatterns: conjunctionType(
    //   {
    //     id: AccessPatterns.stringType<`YES#${string}`>(),
    //     ho: AccessPatterns.numberType(),
    //     yes: AccessPatterns.stringType<"yes">(),
    //   },
    //   {
    //     id: AccessPatterns.stringType<`NO#${string}`>(),
    //     ho: AccessPatterns.numberType(),
    //     no: AccessPatterns.stringType<"no">(),
    //   },
    // ),
  })
})

// /**
//  * Returns the table item type.
//  *
//  * @example
//  * ```ts
//  * type User = { id: { S: string } }
//  * declare const table: Table<User>
//  * const item: TableItemType<typeof table> = { id: { S: "user_1" } }
//  * ```
//  */
// export type TableItemType<T extends Table> = T extends Table<infer Item>
//   ? Item
//   : never

// staticTest((table: Table<{ id: { S: string } }, any>) => {
//   const item: TableItemType<typeof table> = {
//     id: { S: "user_1" },
//   }
// })

// export type TableKeys<T extends Table<any, any>> = T extends Table<
//   any,
//   infer P
// >
//   ? Union.Merge<
//       {
//         [name in P["partitionKey"]["name"]]: TableItemType<T>[name]
//       } & (P["sortKey"] extends KeyDefinition
//         ? {
//             [name in P["sortKey"]["name"]]: TableItemType<T>[name]
//           }
//         : {})
//     >
//   : never

// export type TableNameFor<T extends Table<any, any>> = T extends Table<
//   infer I,
//   infer P
// >
//   ? TableName<I, P>
//   : never
