import { OpaqueType } from "@cloudy-ts/opaque-type";
import {
  Table as BaseTable,
  AttributeType,
  StreamViewType,
  TableProps,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { F } from "ts-toolbelt";
// // eslint-disable-next-line import/no-extraneous-dependencies
// export { AttributeValue } from "@aws-sdk/client-dynamodb";
// export {
//   AttributeType,
//   StreamViewType,
//   BillingMode,
// } from "aws-cdk-lib/aws-dynamodb";

import { ValueType } from "../core/value-type.js";
import { staticTest } from "../static-test.js";
import { IsExact, typeAssert } from "./table.conditional-type-checks.js";

type DynamodbPrimitiveValues =
  | string
  | number
  | bigint
  | Uint8Array
  | boolean
  | string[]
  | (number | bigint)[]
  | Uint8Array[]
  | boolean[];

export interface DynamodbItem {
  [name: string]: DynamodbPrimitiveValues | DynamodbItem | DynamodbItem[];
}
// export type DynamodbItem = {
//   [name: string]: DynamodbPrimitiveValues | DynamodbItem | DynamodbItem[];
// };

type KeyDefinition = {
  name: string;
  type: AttributeType;
};

type TypeFromAttributeType<T extends AttributeType> =
  T extends AttributeType.STRING
    ? string
    : T extends AttributeType.NUMBER
    ? number | bigint
    : T extends AttributeType.BINARY
    ? Uint8Array
    : never;

type AttributeFromKeyDefinition<T extends KeyDefinition> = {
  [name in T["name"]]: TypeFromAttributeType<T["type"]>;
};

type AccessPattern<
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined,
> = DynamodbItem &
  AttributeFromKeyDefinition<PartitionKey> &
  AttributeFromKeyDefinition<NonNullable<SortKey>>;

export interface TableProperties<
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined,
  ItemType extends AccessPattern<PartitionKey, SortKey> | undefined,
  Stream extends StreamViewType | undefined,
> extends TableProps {
  partitionKey: PartitionKey;
  sortKey?: SortKey;
  itemType?: ValueType<ItemType>;
  stream?: Stream;
}

type ResolveValueType<T> = T extends ValueType<infer V> ? V : T;

export interface MaterializedTableProperties<
  T extends DynamodbItem = DynamodbItem,
> {
  partitionKey: keyof T;
  sortKey: keyof T | never;
  itemType: T;
  stream: StreamViewType | never;
}

export type MaterializeTableProperties<
  T extends TableProperties<any, any, any, any>,
> = {
  partitionKey: T["partitionKey"]["name"] extends string
    ? T["partitionKey"]["name"]
    : never;
  sortKey: T["sortKey"] extends infer SortKey
    ? SortKey extends KeyDefinition
      ? SortKey["name"]
      : never
    : never;
  itemType: ResolveValueType<
    T["itemType"] extends infer ItemType | undefined ? ItemType : T["itemType"]
  > extends infer ItemType
    ? unknown extends ItemType
      ? AccessPattern<T["partitionKey"], T["sortKey"]>
      : ItemType extends undefined
      ? AccessPattern<T["partitionKey"], T["sortKey"]>
      : ItemType
    : AccessPattern<T["partitionKey"], T["sortKey"]>;
  stream: T["stream"] extends infer Stream
    ? Stream extends StreamViewType
      ? Stream
      : never
    : never;
};

staticTest(() => {
  type p1 = MaterializeTableProperties<
    TableProperties<
      { name: "id"; type: AttributeType.STRING },
      undefined,
      { id: string },
      undefined
    >
  >;
  typeAssert<
    IsExact<
      p1,
      {
        partitionKey: "id";
        sortKey: never;
        itemType: { id: string };
        stream: never;
      }
    >
  >(true);

  type p2 = MaterializeTableProperties<
    TableProperties<
      { name: "id"; type: AttributeType.STRING },
      { name: "sk"; type: AttributeType.STRING },
      { id: string; sk: string },
      undefined
    >
  >;
  typeAssert<
    IsExact<
      p2,
      {
        partitionKey: "id";
        sortKey: "sk";
        itemType: { id: string; sk: string };
        stream: never;
      }
    >
  >(true);

  type p3 = MaterializeTableProperties<
    TableProperties<
      { name: "id"; type: AttributeType.STRING },
      { name: "sk"; type: AttributeType.NUMBER },
      { id: string; sk: number; age: number },
      undefined
    >
  >;
  typeAssert<
    IsExact<
      p3,
      {
        partitionKey: "id";
        sortKey: "sk";
        itemType: { id: string; sk: number; age: number };
        stream: never;
        // exact: true;
      }
    >
  >(true);

  type p4 = TableProperties<
    { name: "id"; type: AttributeType.STRING },
    { name: "sk"; type: AttributeType.STRING },
    // @ts-expect-error: sk is missing.
    { id: string },
    undefined
  >;
  type p5 = TableProperties<
    { name: "id"; type: AttributeType.STRING },
    { name: "sk"; type: AttributeType.STRING },
    // @ts-expect-error: id is missing.
    {},
    undefined
  >;
  type p6 = TableProperties<
    { name: "id"; type: AttributeType.STRING },
    undefined,
    // @ts-expect-error: id is missing.
    {},
    undefined
  >;

  type p7 = MaterializeTableProperties<
    TableProperties<
      { name: "id"; type: AttributeType.STRING },
      undefined,
      undefined,
      undefined
    >
  >;
  typeAssert<
    IsExact<
      p7,
      {
        partitionKey: "id";
        sortKey: never;
        itemType: { id: string };
        stream: never;
        // exact: false;
      }
    >
  >(true);

  type p8 = MaterializeTableProperties<
    TableProperties<
      { name: "id"; type: AttributeType.STRING },
      { name: "sk"; type: AttributeType.NUMBER },
      | { id: "age"; sk: number; age: number }
      | { id: "name"; sk: number; name: string },
      undefined
    >
  >;
  typeAssert<
    IsExact<
      p8,
      {
        partitionKey: "id";
        sortKey: "sk";
        itemType:
          | { id: "age"; sk: number; age: number }
          | { id: "name"; sk: number; name: string };
        stream: never;
        // exact: true;
      }
    >
  >(true);
});

export type TableName<T extends MaterializedTableProperties> = OpaqueType<
  string,
  T
>;

/**
 * Defines a type-safe DynamoDB table.
 *
 * @example
 * ```ts
 * type User = {
 *   pk: string;
 *   sk: number;
 * };
 * const table = new cloudy.aws_dynamodb.Table(this, "table", {
 *   partitionKey: {
 *     name: "pk",
 *     type: cloudy.AttributeType.STRING,
 *   },
 *   sortKey: {
 *     name: "sk",
 *     type: cloudy.AttributeType.NUMBER,
 *   },
 *   itemType: cloudy.ValueType.as<User>(),
 * });
 * ```
 */
export class Table<
  // PartitionKey extends KeyDefinition = KeyDefinition,
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined = undefined,
  ItemType extends AccessPattern<PartitionKey, SortKey> = AccessPattern<
    PartitionKey,
    SortKey
  >,
  Stream extends StreamViewType | undefined = undefined,
  // PartitionKey extends KeyDefinition,
  // SortKey extends KeyDefinition | undefined,
  // ItemType extends AccessPattern<PartitionKey, SortKey>,
  // Stream extends StreamViewType | undefined,
> extends BaseTable {
  /**
   * Name of the dynamodb table.
   *
   * @attribute
   */
  public declare readonly tableName: TableName<
    MaterializeTableProperties<
      TableProperties<PartitionKey, SortKey, ItemType, Stream>
    >
  >;

  public constructor(
    scope: Construct,
    id: string,
    properties: F.Narrow<
      TableProperties<PartitionKey, SortKey, ItemType, Stream>
    >,
    // properties: TableProperties<PartitionKey, SortKey, ItemType, Stream>,
  ) {
    super(scope, id, properties as unknown as TableProps);
  }
}

() => {
  const x: ValueType<
    AccessPattern<{ name: "streamId"; type: AttributeType.STRING }, undefined>
  > = ValueType.as<{
    streamId: string;
    events: {
      id: string;
      data: string;
      // metadata: JsonEncoded
    }[];
  }>();

  new Table(undefined as unknown as Construct, "Transactions", {
    partitionKey: {
      name: "streamId",
      type: AttributeType.STRING,
    },
    itemType: ValueType.as<{
      streamId: string;
      events: {
        id: string;
      }[];
    }>(),
  });

  new Table(undefined as unknown as Construct, "Transactions", {
    partitionKey: { name: "pk", type: AttributeType.STRING },
    itemType: ValueType.as<
      | {
          pk: "name";
          name: string;
        }
      | {
          pk: "age";
          age: number;
        }
    >(),
  });
};
