import {
  PutItemCommand as BaseCommand,
  PutItemCommandInput as BaseCommandInput,
  PutItemCommandOutput as BaseCommandOutput,
  DynamoDBClientResolvedConfig as ResolvedConfiguration,
  ReturnConsumedCapacity,
  ReturnItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb";
import { Command } from "@aws-sdk/smithy-client";
import { Handler, MetadataBearer, MiddlewareStack } from "@aws-sdk/types";
import { aws_dynamodb, OpaqueType, ValueType } from "@cloudy-ts/cdk";
import {
  DynamodbItem,
  MaterializedTableProps,
} from "@cloudy-ts/cdk/src/aws-dynamodb/table.js";
import { CommandProxy } from "@cloudy-ts/util-command-proxy";
import { ToAttributeMap } from "@cloudy-ts/util-dynamodb";

import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js";

export type PutItemCommandInput<
  T extends MaterializedTableProps = MaterializedTableProps
> = Omit<BaseCommandInput, "Item"> & {
  TableName: aws_dynamodb.TableName<T>;
  Item: ToAttributeMap<T["itemType"]>;
  // meh: T;
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

// export class PutItemCommand<
//   T extends MaterializedTableProps,
// > extends CommandProxy<
//   BaseCommandInput,
//   BaseCommandOutput,
//   ResolvedConfiguration
// > {
//   constructor(input: PutItemCommandInput<T>) {
//     super(new BaseCommand(input as unknown as BaseCommandInput));
//   }
// }
export class PutItemCommand<T extends MaterializedTableProps>
  implements
    Command<BaseCommandInput, BaseCommandOutput, ResolvedConfiguration>
{
  private readonly command: BaseCommand;

  constructor(input: PutItemCommandInput<T>) {
    this.command = new BaseCommand(input as unknown as BaseCommandInput);
  }

  get input(): BaseCommandInput {
    return this.command.input;
  }

  get middlewareStack(): MiddlewareStack<BaseCommandInput, BaseCommandOutput> {
    return this.command.middlewareStack;
  }

  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: ResolvedConfiguration,
    options: any
  ): Handler<BaseCommandInput, BaseCommandOutput> {
    return this.command.resolveMiddleware(clientStack, configuration, options);
  }
}

() => {
  type MyString = OpaqueType<string, "MyString">;
  const table = new aws_dynamodb.Table(undefined as any, "Table", {
    partitionKey: {
      name: "id",
      type: aws_dynamodb.AttributeType.STRING,
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
};

() => {
  const table = new aws_dynamodb.Table(undefined as any, "Table", {
    partitionKey: {
      name: "id",
      type: aws_dynamodb.AttributeType.STRING,
    },
  });
  new PutItemCommand({
    TableName: table.tableName,
    Item: { id: { S: "" }, o: { N: "1" } },
  });
};
