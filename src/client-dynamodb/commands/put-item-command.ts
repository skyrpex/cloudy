import {
  PutItemCommand as BaseCommand,
  PutItemCommandInput as BaseCommandInput,
  PutItemCommandOutput as BaseCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { AttributeType } from "aws-cdk-lib/aws-dynamodb";

import {
  MaterializedTableProps as MaterializedTableProps,
  Table,
  TableName,
} from "../../aws-dynamodb/table.js";
import { ValueType } from "../../core/value-type.js";
import { OpaqueType } from "../../opaque-type/index.js";
import { staticTest } from "../../static-test.js";
import { ToAttributeMap } from "../util/attribute-value.js";

export type PutItemCommandInput<
  T extends MaterializedTableProps = MaterializedTableProps,
> = Omit<BaseCommandInput, "TableName" | "Item"> & {
  TableName: TableName<T>;
  Item: ToAttributeMap<T["itemType"]>;
  // ReturnConsumedCapacity?: ReturnConsumedCapacity
  // ReturnItemCollectionMetrics?: ReturnItemCollectionMetrics
  // ConditionExpression?: string
  // ExpressionAttributeNames?: {
  //   [key: string]: string
  // }
  // ExpressionAttributeValues?: {
  //   [key: string]: AttributeValue
  // }
};

export interface PutItemCommandOutput extends BaseCommandOutput {}

export class PutItemCommand<T extends MaterializedTableProps> {
  constructor(input: PutItemCommandInput<T>) {
    return new BaseCommand(input);
  }
}

staticTest(() => {
  type MyString = OpaqueType<string, "MyString">;
  const table = new Table(undefined as any, "Table", {
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
    itemType: ValueType.as<{
      id: MyString;
    }>(),
  });
  new PutItemCommand({
    TableName: table.tableName,
    Item: {
      id: { S: "" as MyString },
      // @ts-expect-error: text is not defined in itemType.
      text: { S: "" },
    },
    // meh: {exact},
  });
});

staticTest(() => {
  const table = new Table(undefined as any, "Table", {
    partitionKey: {
      name: "id",
      type: AttributeType.STRING,
    },
  });
  new PutItemCommand({
    TableName: table.tableName,
    Item: { id: { S: "" }, o: { N: "1" } },
  });
});
