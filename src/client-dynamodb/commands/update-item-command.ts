import {
  UpdateItemCommand as BaseCommand,
  UpdateItemCommandInput as BaseCommandInput,
  UpdateItemCommandOutput as BaseCommandOutput,
  DynamoDBClientResolvedConfig as ResolvedConfiguration,
} from "@aws-sdk/client-dynamodb";

import { Command } from "@aws-sdk/smithy-client";
import { Handler, MiddlewareStack } from "@aws-sdk/types";
import {
  MaterializedTableProps as MaterializedTableProps,
  TableName,
} from "../../aws-dynamodb/table.js";
import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js";
import { ToAttributeMap } from "../util/attribute-value.js";
import {
  ExpressionAttributeNames,
  ExpressionAttributeValues,
} from "../util/expression-attributes.js";

type KeyOfItem<T extends MaterializedTableProps> = {
  [name in T["partitionKey"] | T["sortKey"]]: T["itemType"][name];
};

export type UpdateItemCommandInput<
  T extends MaterializedTableProps = MaterializedTableProps,
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
  T extends MaterializedTableProps,
  UpdateExpression extends string,
  ConditionExpression extends string,
> implements
    Command<BaseCommandInput, BaseCommandOutput, ResolvedConfiguration>
{
  input: any;
  middlewareStack: any;
  // @ts-expect-error
  resolveMiddleware: (
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: ResolvedConfiguration,
    options: any,
  ) => Handler<BaseCommandInput, BaseCommandOutput>;
  constructor(
    input: UpdateItemCommandInput<T, UpdateExpression, ConditionExpression>,
  ) {
    return new BaseCommand(input as unknown as BaseCommandInput);
  }
}

// resolveMiddleware(
//   clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
//   configuration: ResolvedConfiguration,
//   options: any,
// ): Handler<BaseCommandInput, BaseCommandOutput>
