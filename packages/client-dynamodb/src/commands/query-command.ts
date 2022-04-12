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

import {
  AccessPattern,
  AttributeFromKeyDefinition,
  KeyDefinition,
  TableName,
} from "@cloudy-ts/cdk"

import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js"
import {
  ExpressionAttributeNames,
  ExpressionAttributeValues,
} from "../expression-attributes.js"

export type QueryCommandInput<
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined,
  AccessPatterns extends AccessPattern<PartitionKey, SortKey>,
  FilterExpression extends string = string,
  KeyConditionExpression extends string = string,
  ProjectionExpression extends string = string,
> = BaseCommandInput & {
  TableName: TableName<PartitionKey, SortKey, AccessPatterns, any>

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
  PartitionKey extends KeyDefinition,
  SortKey extends KeyDefinition | undefined,
  AccessPatterns extends AccessPattern<PartitionKey, SortKey>,
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
