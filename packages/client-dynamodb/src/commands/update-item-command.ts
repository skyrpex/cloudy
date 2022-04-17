import {
  UpdateItemCommand as BaseCommand,
  UpdateItemCommandInput as BaseCommandInput,
  UpdateItemCommandOutput as BaseCommandOutput,
  DynamoDBClientResolvedConfig,
} from "@aws-sdk/client-dynamodb";
import { Command } from "@aws-sdk/smithy-client";
import { MiddlewareStack } from "@aws-sdk/types";

import { aws_dynamodb } from "@cloudy-ts/cdk";
import { MaterializedTableProperties } from "@cloudy-ts/cdk/src/aws-dynamodb";
import { CommandProxy } from "@cloudy-ts/util-command-proxy";
import {
  ExpressionAttributeNames,
  ExpressionAttributeValues,
  ToAttributeMap,
  ToAttributeValue,
} from "@cloudy-ts/util-dynamodb";

import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js";

// type TableItem<T extends aws_dynamodb.TableName<any, any>> = T extends aws_dynamodb.TableName<infer Item, any> ? Item : never

type KeyOfItem<T extends MaterializedTableProperties> = {
  [name in T["partitionKey"] | T["sortKey"]]: T["itemType"][name];
};

export type UpdateItemCommandInput<
  T extends aws_dynamodb.MaterializedTableProperties = aws_dynamodb.MaterializedTableProperties,
  UpdateExpression extends string = string,
  ConditionExpression extends string = string,
> = Omit<BaseCommandInput, "Key"> & {
  TableName: aws_dynamodb.TableName<T>;
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
  T extends aws_dynamodb.MaterializedTableProperties,
  UpdateExpression extends string,
  ConditionExpression extends string,
> extends CommandProxy<
  BaseCommandInput,
  BaseCommandOutput,
  DynamoDBClientResolvedConfig
> {
  constructor(
    input: UpdateItemCommandInput<T, UpdateExpression, ConditionExpression>,
  ) {
    super(new BaseCommand(input as unknown as BaseCommandInput));
  }
}
