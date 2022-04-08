import type { AttributeValue } from "@aws-sdk/client-dynamodb"
import {
  Table as BaseTable,
  AttributeType,
  StreamViewType,
  TableProps,
  BillingMode,
} from "aws-cdk-lib/aws-dynamodb"
import { Construct } from "constructs"
import { Function, Union } from "ts-toolbelt"

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

/**
 * Returns the AttributeValue of the given DynamoDB item key.
 *
 * @example
 * ```ts
 * type User = {
 *   id: { N: string }
 *   name: { S: string }
 * }
 * type UserId = ItemAttributeValue<User, "id"> // { N: string }
 * type UserName = ItemAttributeValue<User, "name"> // { S: string }
 * ```
 */
type ItemAttributeValue<
  Item extends DynamodbItem,
  Key extends keyof Item,
> = Key extends keyof Item ? Item[Key] : never

/**
 * Returns the equivalent AttributeType for the given DynamoDB item key.
 *
 * @example
 * ```ts
 * type User = {
 *   id: { N: string }
 *   name: { S: string }
 * }
 * type UserIdAttributeType = ItemAttributeType<User, "id"> // AttributeType.NUMBER
 * type UserNameAttributeType = ItemAttributeType<User, "name"> // AttributeType.STRING
 * ```
 */
type ItemAttributeType<
  Item extends DynamodbItem,
  Key extends keyof Item,
> = ItemAttributeValue<Item, Key> extends AttributeValue.SMember
  ? AttributeType.STRING
  : ItemAttributeValue<Item, Key> extends AttributeValue.NMember
  ? AttributeType.NUMBER
  : ItemAttributeValue<Item, Key> extends AttributeValue.BMember
  ? AttributeType.BINARY
  : never

/**
 * Returns the equivalent AttributeValue for the given AttributeType.
 *
 * @example
 * ```ts
 * type Type = AttributeValueFromAttributeType<AttributeType.STRING> // AttributeValue.SMember
 * type Type = AttributeValueFromAttributeType<AttributeType.NUMBER> // AttributeValue.NMember
 * type Type = AttributeValueFromAttributeType<AttributeType.BINARY> // AttributeValue.BMember
 * ```
 */
type AttributeValueFromAttributeType<T extends AttributeType> =
  T extends AttributeType.STRING
    ? AttributeValue.SMember
    : T extends AttributeType.NUMBER
    ? AttributeValue.NMember
    : T extends AttributeType.BINARY
    ? AttributeValue.BMember
    : never

/**
 * Defines a table key such as partition key or sort key.
 */
type KeyDefinition = {
  name: string
  type: AttributeType
}

/**
 * Defines the properties that we're interested in: partitionKey, sortKey and stream.
 *
 * Those are used to provide type-safe constraints.
 */
type StaticProperties = {
  partitionKey: KeyDefinition
  sortKey?: KeyDefinition | undefined
  stream?: StreamViewType | undefined
}

/**
 * Defines the rest of table properties.
 */
type BaseProperties = Omit<TableProps, "partitionKey" | "sortKey" | "stream">

/**
 * Represents the name of a dynamodb table along with the table types.
 */
export type TableName<
  I extends DynamodbItem | unknown,
  P extends StaticProperties,
> = OpaqueType<string, { readonly t: unique symbol; item: I; properties: P }>

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
  I extends DynamodbItem | unknown = unknown,
  P extends StaticProperties = StaticProperties,
> extends BaseTable {
  // /**
  //  * Arn of the dynamodb table.
  //  *
  //  * @attribute
  //  */
  // public readonly tableArn!: TableArn<I, P>

  /**
   * Name of the dynamodb table.
   *
   * @attribute
   */
  public readonly tableName!: TableName<I, P>

  public constructor(
    scope: Construct,
    id: string,
    properties: BaseProperties & Function.Narrow<P>,
  ) {
    super(scope, id, properties as unknown as TableProps)
  }

  /**
   * Returns a table with a constraint for the item type.
   *
   * The item type must match the partition and sort keys defined in the table.
   *
   * @example
   * ```ts
   * type User = {
   *   pk: { S: string }
   * }
   * const table = new cloudy.Table(this, "table", {
   *   partitionKey: {
   *     name: "pk",
   *     type: cloudy.AttributeType.STRING,
   *   },
   * }).withItemType<User>()
   * ```
   */
  withItemType<
    I extends DynamodbItem &
      Record<
        P["partitionKey"]["name"],
        AttributeValueFromAttributeType<P["partitionKey"]["type"]>
      > &
      (P["sortKey"] extends KeyDefinition
        ? Record<
            P["sortKey"]["name"],
            AttributeValueFromAttributeType<P["sortKey"]["type"]>
          >
        : Record<string, AttributeValue>),
  >(): Table<I, P> {
    return this as Table<I, P>
  }
}

/**
 * Returns the table item type.
 *
 * @example
 * ```ts
 * type User = { id: { S: string } }
 * declare const table: Table<User, any>
 * const item: TableItemType<typeof table> = { id: { S: "user_1" } }
 * ```
 */
export type TableItemType<T extends Table> = T extends Table<infer I>
  ? I
  : never

staticTest((table: Table<{ id: { S: string } }, any>) => {
  const item: TableItemType<typeof table> = {
    id: { S: "user_1" },
  }
})

/**
 * Returns the table stream view type.
 */
export type TableStreamViewType<T extends Table> = T extends Table<any, infer P>
  ? P["stream"] extends StreamViewType
    ? P["stream"]
    : never
  : never

/**
 * Represents an empty object.
 *
 * Useful to merge types with nothing in it.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
type Empty = {}

/**
 * Represents a dynamodb stream event change record for lambda.
 */
type StreamEventDynamodbType<T extends Table> =
  TableStreamViewType<T> extends never
    ? never
    : Union.Merge<
        {
          ApproximateCreationDateTime: number
          // Keys?: TableAttributes
          SequenceNumber: string
          SizeBytes: number
          StreamViewType: TableStreamViewType<T>
        } & (TableStreamViewType<T> extends StreamViewType.NEW_IMAGE
          ? {
              NewImage: TableItemType<T> | undefined
            }
          : TableStreamViewType<T> extends StreamViewType.NEW_AND_OLD_IMAGES
          ? {
              NewImage: TableItemType<T> | undefined
            }
          : Empty) &
          (TableStreamViewType<T> extends StreamViewType.OLD_IMAGE
            ? {
                OldImage: TableItemType<T> | undefined
              }
            : TableStreamViewType<T> extends StreamViewType.NEW_AND_OLD_IMAGES
            ? {
                OldImage: TableItemType<T> | undefined
              }
            : Empty)
      >

/**
 * Represents a dynamodb stream event for lambda.
 */
export type StreamEventType<T extends Table> =
  TableStreamViewType<T> extends never
    ? never
    : {
        Records: {
          eventID: string
          eventName: "INSERT" | "MODIFY" | "REMOVE"
          eventVersion: string
          eventSource: "aws:dynamodb"
          awsRegion: string
          dynamodb: StreamEventDynamodbType<T>
          eventSourceARN: string
        }[]
      }

staticTest(() => {
  type User = {
    pk: { S: string }
    sk: { N: string }
  }
  const table = new Table(undefined as unknown as Construct, "table", {
    partitionKey: {
      name: "pk",
      type: AttributeType.STRING,
    },
    sortKey: {
      name: "sk",
      type: AttributeType.NUMBER,
    },
    // stream: StreamViewType.OLD_IMAGE,
    // stream: StreamViewType.NEW_IMAGE,
    stream: StreamViewType.NEW_AND_OLD_IMAGES,
    billingMode: BillingMode.PAY_PER_REQUEST,
  })
  const table2 = table.withItemType<User>()
  type x = StreamEventType<typeof table2>
})
