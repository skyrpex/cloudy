import {
  QueryCommand as BaseCommand,
  QueryCommandInput as BaseCommandInput,
  QueryCommandOutput as BaseCommandOutput,
  // DynamoDBClientResolvedConfig as ResolvedConfiguration,
  DynamoDBClientResolvedConfig,
  ReturnConsumedCapacity,
  ReturnItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb"
import { Command } from "@aws-sdk/smithy-client"
import { MiddlewareStack } from "@aws-sdk/types"

import { aws_dynamodb } from "@cloudy-ts/cdk"
import {
  ExpressionAttributeNames,
  ExpressionAttributeValues,
} from "@cloudy-ts/util-dynamodb"

import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js"

export type QueryCommandInput<
  PartitionKey extends aws_dynamodb.KeyDefinition = aws_dynamodb.KeyDefinition,
  SortKey extends aws_dynamodb.KeyDefinition | undefined = undefined,
  AccessPatterns extends aws_dynamodb.AccessPattern<
    PartitionKey,
    SortKey
  > = aws_dynamodb.AccessPattern<PartitionKey, SortKey>,
  FilterExpression extends string = string,
  KeyConditionExpression extends string = string,
  ProjectionExpression extends string = string,
> = BaseCommandInput & {
  TableName: aws_dynamodb.TableName<PartitionKey, SortKey, AccessPatterns, any>

  FilterExpression?: FilterExpression
  KeyConditionExpression?: KeyConditionExpression
  ProjectionExpression?: ProjectionExpression
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
  ExpressionAttributeNames<ProjectionExpression>

export interface QueryCommandOutput extends BaseCommandOutput {}

export class QueryCommand<
  PartitionKey extends aws_dynamodb.KeyDefinition,
  SortKey extends aws_dynamodb.KeyDefinition | undefined,
  AccessPatterns extends aws_dynamodb.AccessPattern<PartitionKey, SortKey>,
  FilterExpression extends string = string,
  KeyConditionExpression extends string = string,
  ProjectionExpression extends string = string,
> implements
    Command<BaseCommandInput, BaseCommandOutput, DynamoDBClientResolvedConfig>
{
  private readonly command: BaseCommand

  constructor(
    readonly input: QueryCommandInput<
      PartitionKey,
      SortKey,
      AccessPatterns,
      FilterExpression,
      KeyConditionExpression,
      ProjectionExpression
    >,
  ) {
    this.command = new BaseCommand(input as unknown as BaseCommandInput)
  }

  get middlewareStack(): MiddlewareStack<BaseCommandInput, BaseCommandOutput> {
    return this.command.middlewareStack as any
  }

  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: DynamoDBClientResolvedConfig,
  ) {
    return this.command.resolveMiddleware(clientStack as any, configuration)
  }
}