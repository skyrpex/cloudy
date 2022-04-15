import { OpaqueType } from "@cloudy-ts/opaque-type";
import { ToAttributeMap } from "@cloudy-ts/util-dynamodb";
import {
  AttributeType,
  StreamViewType,
  TableProps,
} from "aws-cdk-lib/aws-dynamodb";
import { F } from "ts-toolbelt";
import { staticTest } from "../static-test.js";

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

interface DynamodbItem {
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

type RemoveUndefined<T> = T extends undefined ? never : T;

type AttributeFromKeyDefinition3Base<T extends KeyDefinition> = {
  [name in T["name"]]: TypeFromAttributeType<T["type"]>;
};

type AttributeFromKeyDefinition<T extends KeyDefinition | undefined> =
  AttributeFromKeyDefinition3Base<RemoveUndefined<T>>;

type AccessPattern<
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined,
> = DynamodbItem &
  AttributeFromKeyDefinition<PartitionKey> &
  AttributeFromKeyDefinition<SortKey>;

interface TableProperties<
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

interface MaterializedTableProperties<T extends DynamodbItem = DynamodbItem> {
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
      }
    >
  >(true);
});

type TableName<T extends MaterializedTableProperties> = OpaqueType<string, T>;

class Table<
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined = undefined,
  ItemType extends AccessPattern<PartitionKey, SortKey> = AccessPattern<
    PartitionKey,
    SortKey
  >,
  Stream extends StreamViewType | undefined = undefined,
> {
  public declare readonly tableName: TableName<
    Materialize<TableProperties<PartitionKey, SortKey, ItemType, Stream>>
  >;

  constructor(
    properties: F.Narrow<
      TableProperties<PartitionKey, SortKey, ItemType, Stream>
    >,
  ) {}
}

function command<T extends MaterializedTableProperties>(input: {
  tableName: TableName<T>;
  item: ToAttributeMap<T["itemType"]>;
}) {}

staticTest(() => {
  type MyString = OpaqueType<string, "MyString">;
  const table = new Table({
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
    itemType: ValueType.as<{
      id: MyString;
    }>(),
  });
  command({
    tableName: table.tableName,
    item: {
      id: { S: "id_1" as MyString },
    },
  });
  command({
    tableName: table.tableName,
    item: {
      // @ts-expect-error: id must be of type MyString.
      id: { S: "id_1" },
    },
  });
  command({
    tableName: table.tableName,
    // @ts-expect-error: id is missing.
    item: {},
  });
  command({
    tableName: table.tableName,
    item: {
      id: { S: "id_1" as MyString },
      // @ts-expect-error: age is not defined in table.
      age: { N: "1" },
    },
  });
  command({
    tableName: table.tableName,
    item: {
      id: { S: "id_1" as MyString },
      // @ts-expect-error: Methods are forbidden.
      x() {},
    },
  });
});

staticTest(() => {
  const table = new Table({
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
    itemType: ValueType.as<{
      id: string;
      age: number;
    }>(),
  });
  command({
    tableName: table.tableName,
    item: {
      id: { S: "id_1" },
      age: { N: "1" },
    },
  });
  command({
    tableName: table.tableName,
    // @ts-expect-error: age is missing.
    item: {
      id: { S: "id_1" },
    },
  });
  command({
    tableName: table.tableName,
    item: {
      id: { S: "id_1" },
      age: { N: "1" },
      // @ts-expect-error: x is not a known property.
      x: { S: "" },
    },
  });
});

staticTest(() => {
  const table = new Table({
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
    itemType: ValueType.as<{
      id: string;
      age: number;
    }>(),
  });
  command({
    tableName: table.tableName,
    item: {
      id: { S: "id_1" },
      age: { N: "1" },
    },
  });
  command({
    tableName: table.tableName,
    // @ts-expect-error: age is missing.
    item: {
      id: { S: "id_1" },
    },
  });
  command({
    tableName: table.tableName,
    item: {
      id: { S: "id_1" },
      age: { N: "1" },
      // @ts-expect-error: x is not a known property.
      x: { S: "" },
    },
  });
});

staticTest(() => {
  const table = new Table({
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
  });
  command({
    tableName: table.tableName,
    item: {
      id: { S: "id_1" },
      age: { N: "1" },
    },
  });
  command({
    tableName: table.tableName,
    item: {
      id: { S: "id_1" },
    },
  });
  command({
    tableName: table.tableName,
    item: {
      id: { S: "id_1" },
      // @ts-expect-error: c is not a valid DynamoDB attribute.
      c: "1",
    },
  });
});

staticTest(() => {
  new Table({
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
  });
  new Table({
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
    // @ts-expect-error: id is missing.
    itemType: ValueType.as<{}>(),
  });
  new Table({
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
    sortKey: {
      name: "sk",
      type: AttributeType.NUMBER,
    },
    // @ts-expect-error: id is missing.
    itemType: ValueType.as<{}>(),
  });
  new Table({
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
    // @ts-expect-error: id should be a string.
    itemType: ValueType.as<{
      id: number;
    }>(),
  });
  new Table({
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
    sortKey: {
      name: "sk",
      type: AttributeType.NUMBER,
    },
    itemType: ValueType.as<{
      id: string;
      sk: number;
    }>(),
  });
  new Table({
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
    sortKey: {
      name: "sk",
      type: AttributeType.NUMBER,
    },
    // @ts-expect-error: sk should be a number.
    itemType: ValueType.as<{
      id: string;
      sk: string;
    }>(),
  });
});

// staticTest(() => {
//   // eslint-disable-next-line unicorn/consistent-function-scoping
//   function command<T extends MaterializedTableProperties<any, any>>(input: {
//     tableName: TableName<T>;
//     item: ToAttributeMap<T["itemType"]>;
//   }) {}

// });

// staticTest(() => {
//   interface TableProperties2<
//     PartitionKey extends KeyDefinition,
//     SortKey extends KeyDefinition | undefined,
//     ItemType extends AccessPattern<PartitionKey, SortKey> | undefined,
//     Stream extends StreamViewType | undefined = StreamViewType | undefined,
//   > extends TableProps {
//     partitionKey: PartitionKey;
//     sortKey?: SortKey;
//     itemType?: ValueType<ItemType>;
//     stream?: Stream;
//   }

//   // interface MaterializedTableProperties2<ItemType extends DynamodbItem> {
//   //   partitionKey: keyof ItemType;
//   //   sortKey: keyof ItemType | never;
//   //   // itemType: ItemType;
//   //   stream: StreamViewType | never;
//   // }

//   type Materialize2<T extends TableProperties2<any, any, any>> = {
//     partitionKey: T["partitionKey"]["name"];
//     sortKey: T["sortKey"] extends infer SortKey
//       ? SortKey extends KeyDefinition
//         ? SortKey["name"]
//         : never
//       : never;
//     itemType: ResolveValueType<
//       T["itemType"] extends infer ItemType | undefined
//         ? ItemType
//         : T["itemType"]
//     > extends infer ItemType
//       ? unknown extends ItemType
//         ? AccessPattern<T["partitionKey"], T["sortKey"]>
//         : ItemType extends undefined
//         ? AccessPattern<T["partitionKey"], T["sortKey"]>
//         : ItemType
//       : AccessPattern<T["partitionKey"], T["sortKey"]>;
//     stream: T["stream"] extends infer Stream
//       ? Stream extends StreamViewType
//         ? Stream
//         : never
//       : never;
//   };

//   type t1 = Materialize2<
//     TableProperties2<
//       { name: "id"; type: AttributeType.STRING },
//       undefined,
//       undefined,
//       undefined
//     >
//   >;
//   type t2 = Materialize2<
//     TableProperties2<
//       { name: "id"; type: AttributeType.STRING },
//       { name: "sk"; type: AttributeType.STRING },
//       undefined,
//       undefined
//     >
//   >;
//   type t3 = Materialize2<
//     TableProperties2<
//       { name: "id"; type: AttributeType.STRING },
//       { name: "sk"; type: AttributeType.STRING },
//       undefined,
//       StreamViewType.NEW_IMAGE
//     >
//   >;
//   const t3: t3 = {
//     itemType: {
//       id: "",
//       // sk: 1,
//     },
//     partitionKey: "id",
//     sortKey: "sk",
//     stream: StreamViewType.NEW_IMAGE,
//   };
//   type t4 = Materialize2<
//     TableProperties2<
//       { name: "id"; type: AttributeType.STRING },
//       { name: "sk"; type: AttributeType.STRING },
//       { id: string; sk: string; age: number },
//       StreamViewType.NEW_IMAGE
//     >
//   >;
// });

staticTest(() => {
  type Event<T extends MaterializedTableProperties> = T["stream"] extends never
    ? never
    : {
        item: T["itemType"];
      };
  typeAssert<
    IsExact<
      never,
      Event<
        Materialize<
          TableProperties<
            { name: "id"; type: AttributeType.STRING },
            undefined,
            undefined,
            undefined
          >
        >
      >
    >
  >(true);

  typeAssert<
    IsExact<
      { item: { id: string } },
      Event<
        Materialize<
          TableProperties<
            { name: "id"; type: AttributeType.STRING },
            undefined,
            undefined,
            StreamViewType.NEW_IMAGE
          >
        >
      >
    >
  >(true);

  typeAssert<
    IsExact<
      { item: { pk: string; sk: string } },
      Event<
        Materialize<
          TableProperties<
            { name: "pk"; type: AttributeType.STRING },
            { name: "sk"; type: AttributeType.STRING },
            undefined,
            StreamViewType.NEW_IMAGE
          >
        >
      >
    >
  >(true);

  typeAssert<
    IsExact<
      { item: { pk: "pk"; sk: "sk"; age: number } },
      Event<
        Materialize<
          TableProperties<
            { name: "pk"; type: AttributeType.STRING },
            { name: "sk"; type: AttributeType.STRING },
            { pk: "pk"; sk: "sk"; age: number },
            StreamViewType.NEW_IMAGE
          >
        >
      >
    >
  >(true);
});

staticTest(() => {
  typeAssert<
    IsExact<
      Materialize<
        TableProperties<
          { name: "pk"; type: AttributeType.STRING },
          undefined,
          undefined,
          undefined
        >
      >,
      {
        partitionKey: "pk";
        sortKey: never;
        itemType: {
          pk: string;
        };
        stream: never;
      }
    >
  >(true);

  // // itemType: ResolveValueType<
  // //   T["itemType"] extends infer ItemType | undefined ? ItemType : T["itemType"]
  // // > extends infer ItemType
  // //   ? unknown extends ItemType
  // //     ? AccessPattern<T["partitionKey"], T["sortKey"]>
  // //     : ItemType extends undefined
  // //     ? AccessPattern<T["partitionKey"], T["sortKey"]>
  // //     : ItemType
  // //   : AccessPattern<T["partitionKey"], T["sortKey"]>;

  // type AttributeFromKeyDefinition2<T extends KeyDefinition | undefined> =
  //   T extends KeyDefinition
  //     ? {
  //         [name in T["name"]]: TypeFromAttributeType<T["type"]>;
  //       }
  //     : {};
  // typeAssert<
  //   IsExact<
  //     AttributeFromKeyDefinition2<{
  //       name: "pk";
  //       type: AttributeType.STRING;
  //     }>,
  //     {
  //       pk: string;
  //     }
  //   >
  // >(true);
  // typeAssert<
  //   IsExact<
  //     AttributeFromKeyDefinition2<{
  //       name: "pk";
  //       type: AttributeType.NUMBER;
  //     }>,
  //     {
  //       pk: number | bigint;
  //     }
  //   >
  // >(true);
  // typeAssert<IsExact<AttributeFromKeyDefinition2<undefined>, {}>>(true);

  // // type MatItem<T extends TableProperties<any, any, any, any>> = AccessPattern<
  // //   T["partitionKey"],
  // //   T["sortKey"]
  // // >;

  // type RemoveUndefined<T> = T extends undefined ? never : T;
  // type AttributeFromKeyDefinition3Base<T extends KeyDefinition> = {
  //   [name in T["name"]]: TypeFromAttributeType<T["type"]>;
  // };
  // type AttributeFromKeyDefinition3<T extends KeyDefinition | undefined> =
  //   AttributeFromKeyDefinition3Base<RemoveUndefined<T>>;

  // type MatItem<
  //   T extends TableProperties<
  //     KeyDefinition,
  //     KeyDefinition | undefined,
  //     any,
  //     any
  //   >,
  //   // > = AttributeFromKeyDefinition2<T["partitionKey"]> &
  //   //   (T["sortKey"] extends infer SortKey
  //   //     ? SortKey extends KeyDefinition
  //   //       ? AttributeFromKeyDefinition2<SortKey>
  //   //       : never
  //   //     : {});
  // > = AttributeFromKeyDefinition3<T["partitionKey"]> &
  //   AttributeFromKeyDefinition3<T["sortKey"]>;

  // type AccessPattern<
  //   PartitionKey extends KeyDefinition,
  //   SortKey extends KeyDefinition | undefined,
  // > = DynamodbItem &
  //   AttributeFromKeyDefinition3<PartitionKey> &
  //   AttributeFromKeyDefinition3<SortKey>;
  // type r1 = AccessPattern<
  //   { name: "pk"; type: AttributeType.STRING },
  //   undefined
  // >;

  // type r = MatItem<
  //   TableProperties<
  //     { name: "pk"; type: AttributeType.STRING },
  //     // { name: "sk"; type: AttributeType.STRING },
  //     undefined,
  //     undefined,
  //     undefined
  //   >
  // >;
  // typeAssert<
  //   IsExact<
  //     r,
  //     {
  //       pk: string;
  //       // sk: string;
  //     }
  //   >
  // >(true);
  // typeAssert<
  //   IsExact<
  //     MatItem<
  //       TableProperties<
  //         { name: "pk"; type: AttributeType.STRING },
  //         // { name: "sk"; type: AttributeType.STRING },
  //         undefined,
  //         undefined,
  //         undefined
  //       >
  //     >,
  //     {
  //       pk: string;
  //       // sk: string;
  //     }
  //   >
  // >(true);
  // typeAssert<
  //   IsExact<
  //     MatItem<
  //       TableProperties<
  //         { name: "pk"; type: AttributeType.STRING },
  //         { name: "sk"; type: AttributeType.STRING },
  //         undefined,
  //         undefined
  //       >
  //     >,
  //     {
  //       pk: string;
  //       sk: string;
  //     }
  //   >
  // >(true);
});
