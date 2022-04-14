import { OpaqueType } from "@cloudy-ts/opaque-type";
import { ToAttributeMap } from "@cloudy-ts/util-dynamodb";
import { ValueType } from "../value-type";
// import { DynamodbItem } from "./table";

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

interface TableProperties {
  // itemType?: ValueType<DynamodbItem> | ValueType<DynamodbItem>[];
  itemType?: ValueType<DynamodbItem>;
}

type RecursivelyMapValueType<T> = T extends ValueType<infer V>
  ? V
  : T extends { [name: string]: any }
  ? { [name in keyof T]: RecursivelyMapValueType<T[name]> }
  : T;
type DefaultTo<T, Default> = T extends ValueType<infer U>
  ? unknown extends U
    ? Default
    : T
  : Default;
type MaterializeTableProperties<T extends TableProperties> = {
  itemType: RecursivelyMapValueType<DefaultTo<T["itemType"], DynamodbItem>>;
};
// type MaterializeTableProperties<T extends TableProperties> =
//   RecursivelyMapValueType<{
//     itemType: DefaultTo<T["itemType"], DynamodbItem>;
//   }>;
interface MaterializedTableProperties {
  itemType: DynamodbItem;
}

type TableName<T extends MaterializedTableProperties> = OpaqueType<string, T>;

class Table<T extends TableProperties> {
  public declare readonly tableName: TableName<MaterializeTableProperties<T>>;

  constructor(properties: T) {}
}

function command<T extends MaterializedTableProperties>(input: {
  tableName: TableName<T>;
  item: ToAttributeMap<T["itemType"]>;
}) {}

const table = new Table({
  itemType: ValueType.as<
    | {
        id: `user#${number}`;
        name: string;
        age: number;
      }
    | {
        id: `email#${number}`;
        email: string;
      }
  >(),
});

command({
  tableName: table.tableName,
  item: {
    id: { S: "user#1" },
    name: { S: "s" },
    age: { N: "1" },
    // @ts-expect-error: Methods are forbidden.
    x() {},
  },
});

command({
  tableName: table.tableName,
  item: {
    id: { S: "email#1" },
    email: { S: "c" },
  },
});
