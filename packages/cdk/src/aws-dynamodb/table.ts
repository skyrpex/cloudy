import type { AttributeValue } from "@aws-sdk/client-dynamodb";
import {
  Table as BaseTable,
  AttributeType,
  StreamViewType,
  TableProps,
} from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";
import { Function, Union, Object, List, F } from "ts-toolbelt";

import { OpaqueType } from "@cloudy-ts/opaque-type";

import { staticTest } from "../static-test.js";

// eslint-disable-next-line import/no-extraneous-dependencies
export { AttributeValue } from "@aws-sdk/client-dynamodb";
export {
  AttributeType,
  StreamViewType,
  BillingMode,
} from "aws-cdk-lib/aws-dynamodb";

import { ToAttributeMap } from "@cloudy-ts/util-dynamodb";

import { ValueType } from "../value-type.js";
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

type AttributeFromKeyDefinition3Base<T extends KeyDefinition> = {
  [name in T["name"]]: TypeFromAttributeType<T["type"]>;
};

type AttributeFromKeyDefinition<T extends KeyDefinition | undefined> =
  AttributeFromKeyDefinition3Base<NonNullable<T>>;

type AccessPattern<
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined,
> = DynamodbItem &
  AttributeFromKeyDefinition<PartitionKey> &
  AttributeFromKeyDefinition<SortKey>;

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
  sortKey: keyof T | undefined;
  itemType: T;
  stream: StreamViewType | never;
}

type Materialize<T extends TableProperties<any, any, any, any>> = {
  partitionKey: T["partitionKey"]["name"];
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
  type p1 = Materialize<
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

  type p2 = Materialize<
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

  type p3 = Materialize<
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

  type p7 = Materialize<
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
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined = undefined,
  ItemType extends AccessPattern<PartitionKey, SortKey> = AccessPattern<
    PartitionKey,
    SortKey
  >,
  Stream extends StreamViewType | undefined = undefined,
> extends BaseTable {
  /**
   * Name of the dynamodb table.
   *
   * @attribute
   */
  public declare readonly tableName: TableName<
    Materialize<TableProperties<PartitionKey, SortKey, ItemType, Stream>>
  >;

  public constructor(
    scope: Construct,
    id: string,
    properties: Function.Narrow<
      TableProperties<PartitionKey, SortKey, ItemType, Stream>
    >,
  ) {
    super(scope, id, properties as unknown as TableProps);
  }
}
