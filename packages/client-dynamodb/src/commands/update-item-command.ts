import {
  UpdateItemCommand as BaseCommand,
  UpdateItemCommandInput as BaseCommandInput,
  UpdateItemCommandOutput as BaseCommandOutput,
  DynamoDBClientResolvedConfig,
} from "@aws-sdk/client-dynamodb";
import { Command } from "@aws-sdk/smithy-client";
import { MiddlewareStack } from "@aws-sdk/types";

import { aws_dynamodb } from "@cloudy-ts/cdk";
import {
  ExpressionAttributeNames,
  ExpressionAttributeValues,
  ToAttributeMap,
} from "@cloudy-ts/util-dynamodb";

import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js";

// type TableItem<T extends aws_dynamodb.TableName<any, any>> = T extends aws_dynamodb.TableName<infer Item, any> ? Item : never

export type UpdateItemCommandInput<
  T extends aws_dynamodb.MaterializedTableProperties = aws_dynamodb.MaterializedTableProperties,
  UpdateExpression extends string = string,
  ConditionExpression extends string = string,
> = BaseCommandInput & {
  TableName: aws_dynamodb.TableName<T>;
  Key: ToAttributeMap<T["itemType"]>;
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
> implements
    Command<BaseCommandInput, BaseCommandOutput, DynamoDBClientResolvedConfig>
{
  private readonly command: BaseCommand;

  constructor(
    readonly input: UpdateItemCommandInput<
      T,
      UpdateExpression,
      ConditionExpression
    >,
  ) {
    this.command = new BaseCommand(input as unknown as BaseCommandInput);
  }

  get middlewareStack(): MiddlewareStack<BaseCommandInput, BaseCommandOutput> {
    return this.command.middlewareStack as any;
  }

  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: DynamoDBClientResolvedConfig,
  ) {
    return this.command.resolveMiddleware(clientStack as any, configuration);
  }
}
