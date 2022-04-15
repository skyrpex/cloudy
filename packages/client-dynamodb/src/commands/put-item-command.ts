import {
  PutItemCommand as BaseCommand,
  PutItemCommandInput as BaseCommandInput,
  PutItemCommandOutput as BaseCommandOutput,
  DynamoDBClientResolvedConfig as ResolvedConfiguration,
  ReturnConsumedCapacity,
  ReturnItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb";
import { Command } from "@aws-sdk/smithy-client";
import { MiddlewareStack } from "@aws-sdk/types";

import { aws_dynamodb, OpaqueType, ValueType } from "@cloudy-ts/cdk";
import {
  DynamodbItem,
  MaterializedTableProperties,
} from "@cloudy-ts/cdk/src/aws-dynamodb/table.js";
import { ToAttributeMap } from "@cloudy-ts/util-dynamodb";

import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js";

export type PutItemCommandInput<T extends MaterializedTableProperties> = Omit<
  BaseCommandInput,
  "Item"
> & {
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

export class PutItemCommand<T extends MaterializedTableProperties>
  implements
    Command<BaseCommandInput, BaseCommandOutput, ResolvedConfiguration>
{
  private readonly command: BaseCommand;

  // This is necessary for TypeScript to stop complaining about not providing
  // the input that the Command interface requires. We can do that since we
  // don't really use the input object: we only proxy it to the base command
  // implementation.
  //
  // Maybe we could create an abstract CommandProxy class that accepts a raw
  // command and defines all properties and methods that require our commands.
  readonly input!: BaseCommandInput;

  constructor(input: PutItemCommandInput<T>) {
    this.command = new BaseCommand(input as unknown as BaseCommandInput);
  }

  get middlewareStack(): MiddlewareStack<BaseCommandInput, BaseCommandOutput> {
    return this.command.middlewareStack;
  }

  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: ResolvedConfiguration,
  ) {
    return this.command.resolveMiddleware(clientStack, configuration);
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
    Item: { id: { S: "" as MyString } },
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
