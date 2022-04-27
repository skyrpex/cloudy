import {
  UpdateItemCommand as BaseCommand,
  UpdateItemCommandInput as BaseCommandInput,
  UpdateItemCommandOutput as BaseCommandOutput,
  DynamoDBClientResolvedConfig as ResolvedConfiguration,
} from "@aws-sdk/client-dynamodb";
import { Command } from "@aws-sdk/smithy-client";
import { Handler, MiddlewareStack } from "@aws-sdk/types";

import {
  MaterializedTableProps as MaterializedTableProperties,
  TableName,
} from "../../aws-dynamodb/table.js";
import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js";
import { ToAttributeMap } from "../util/attribute-value.js";
import {
  ExpressionAttributeNames,
  ExpressionAttributeValues,
} from "../util/expression-attributes.js";

// type TableItem<T extends TableName<any, any>> = T extends TableName<infer Item, any> ? Item : never

type KeyOfItem<T extends MaterializedTableProperties> = {
  [name in T["partitionKey"] | T["sortKey"]]: T["itemType"][name];
};

export type UpdateItemCommandInput<
  T extends MaterializedTableProperties = MaterializedTableProperties,
  UpdateExpression extends string = string,
  ConditionExpression extends string = string,
> = Omit<BaseCommandInput, "Key"> & {
  TableName: TableName<T>;
  Key: ToAttributeMap<KeyOfItem<T>>;
  UpdateExpression: UpdateExpression;
  ConditionExpression: ConditionExpression;
  // Item: Item
  // ReturnConsumedCapacity?: ReturnConsumedCapacity
  // ReturnItemCollectionMetrics?: ReturnItemCollectionMetrics
  // ConditionExpression?: string
  // ExpressionAttributeNames?: {
  //   [key: string]: string
  // }
} & ExpressionAttributeValues<UpdateExpression> &
  ExpressionAttributeNames<UpdateExpression> &
  ExpressionAttributeValues<ConditionExpression> &
  ExpressionAttributeNames<ConditionExpression>;

export interface UpdateItemCommandOutput extends BaseCommandOutput {}

export class UpdateItemCommand<
  T extends MaterializedTableProperties,
  UpdateExpression extends string,
  ConditionExpression extends string,
> implements
    Command<BaseCommandInput, BaseCommandOutput, ResolvedConfiguration>
{
  // constructor(
  //   input: UpdateItemCommandInput<T, UpdateExpression, ConditionExpression>,
  // ) {
  //   super(new BaseCommand(input as unknown as BaseCommandInput));
  // }
  private readonly command: BaseCommand;

  constructor(input: UpdateItemCommandInput<T>) {
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
    options: any,
  ): Handler<BaseCommandInput, BaseCommandOutput> {
    return this.command.resolveMiddleware(clientStack, configuration, options);
  }
}
