import {
  QueryCommand as BaseCommand,
  QueryCommandInput as BaseCommandInput,
  QueryCommandOutput as BaseCommandOutput,
  // DynamoDBClientResolvedConfig as ResolvedConfiguration,
  DynamoDBClientResolvedConfig,
  ReturnConsumedCapacity,
  ReturnItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb";
import { Command } from "@aws-sdk/smithy-client";
import { MiddlewareStack } from "@aws-sdk/types";

import { aws_dynamodb } from "@cloudy-ts/cdk";
import { CommandProxy } from "@cloudy-ts/util-command-proxy";
import {
  ExpressionAttributeNames,
  ExpressionAttributeValues,
} from "@cloudy-ts/util-dynamodb";

import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js";

export type QueryCommandInput<
  T extends aws_dynamodb.MaterializedTableProperties = aws_dynamodb.MaterializedTableProperties,
  FilterExpression extends string = string,
  KeyConditionExpression extends string = string,
  ProjectionExpression extends string = string,
> = BaseCommandInput & {
  TableName: aws_dynamodb.TableName<T>;
  FilterExpression?: FilterExpression;
  KeyConditionExpression?: KeyConditionExpression;
  ProjectionExpression?: ProjectionExpression;
  // Item: Item
  // ReturnConsumedCapacity?: ReturnConsumedCapacity
  // ReturnItemCollectionMetrics?: ReturnItemCollectionMetrics
  // ConditionExpression?: string
  // ExpressionAttributeNames?: {
  //   [key: string]: string
  // }
  // ExpressionAttributeValues?: {
  //   [key: string]: AttributeValue
  // }
} & ExpressionAttributeValues<FilterExpression> &
  ExpressionAttributeNames<FilterExpression> &
  ExpressionAttributeValues<KeyConditionExpression> &
  ExpressionAttributeNames<KeyConditionExpression> &
  ExpressionAttributeValues<ProjectionExpression> &
  ExpressionAttributeNames<ProjectionExpression>;

export interface QueryCommandOutput extends BaseCommandOutput {}

export class QueryCommand<
  T extends aws_dynamodb.MaterializedTableProperties = aws_dynamodb.MaterializedTableProperties,
  FilterExpression extends string = string,
  KeyConditionExpression extends string = string,
  ProjectionExpression extends string = string,
> extends CommandProxy<
  BaseCommandInput,
  BaseCommandOutput,
  DynamoDBClientResolvedConfig
> {
  constructor(
    input: QueryCommandInput<
      T,
      FilterExpression,
      KeyConditionExpression,
      ProjectionExpression
    >,
  ) {
    super(new BaseCommand(input as unknown as BaseCommandInput));
  }
}
