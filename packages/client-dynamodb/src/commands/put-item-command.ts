import {
  PutItemCommand as BaseCommand,
  PutItemCommandInput as BaseCommandInput,
  PutItemCommandOutput as BaseCommandOutput,
  DynamoDBClientResolvedConfig as ResolvedConfiguration,
  ReturnConsumedCapacity,
  ReturnItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb"
import { Command } from "@aws-sdk/smithy-client"
import { MiddlewareStack } from "@aws-sdk/types"

import { aws_dynamodb } from "@cloudy-ts/cdk"
import { ToAttributeMap } from "@cloudy-ts/util-dynamodb"

import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js"

export type PutItemCommandInput<
  PartitionKey extends aws_dynamodb.KeyDefinition = aws_dynamodb.KeyDefinition,
  SortKey extends aws_dynamodb.KeyDefinition | undefined = undefined,
  AccessPatterns extends
    | aws_dynamodb.AccessPattern<PartitionKey, SortKey>
    | "any" = "any",
> = Omit<BaseCommandInput, "Item"> & {
  TableName: aws_dynamodb.TableName<PartitionKey, SortKey, AccessPatterns, any>
  Item: AccessPatterns extends "any"
    ? ToAttributeMap<aws_dynamodb.AccessPattern<PartitionKey, SortKey>>
    : ToAttributeMap<AccessPatterns extends object ? AccessPatterns : never>
  // ReturnConsumedCapacity?: ReturnConsumedCapacity
  // ReturnItemCollectionMetrics?: ReturnItemCollectionMetrics
  // ConditionExpression?: string
  // ExpressionAttributeNames?: {
  //   [key: string]: string
  // }
  // ExpressionAttributeValues?: {
  //   [key: string]: AttributeValue
  // }
}

export interface PutItemCommandOutput extends BaseCommandOutput {}

export class PutItemCommand<
  PartitionKey extends aws_dynamodb.KeyDefinition,
  SortKey extends aws_dynamodb.KeyDefinition | undefined,
  AccessPatterns extends
    | aws_dynamodb.AccessPattern<PartitionKey, SortKey>
    | "any",
> implements
    Command<BaseCommandInput, BaseCommandOutput, ResolvedConfiguration>
{
  private readonly command: BaseCommand

  // This is necessary for TypeScript to stop complaining about not providing
  // the input that the Command interface requires. We can do that since we
  // don't really use the input object: we only proxy it to the base command
  // implementation.
  //
  // Maybe we could create an abstract CommandProxy class that accepts a raw
  // command and defines all properties and methods that require our commands.
  readonly input!: BaseCommandInput

  constructor(
    input: PutItemCommandInput<PartitionKey, SortKey, AccessPatterns>,
  ) {
    this.command = new BaseCommand(input as unknown as BaseCommandInput)
  }

  get middlewareStack(): MiddlewareStack<BaseCommandInput, BaseCommandOutput> {
    return this.command.middlewareStack
  }

  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: ResolvedConfiguration,
  ) {
    return this.command.resolveMiddleware(clientStack, configuration)
  }
}
