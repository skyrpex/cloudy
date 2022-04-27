import {
  QueryCommand as BaseCommand,
  QueryCommandInput as BaseCommandInput,
  QueryCommandOutput as BaseCommandOutput,
  DynamoDBClientResolvedConfig as ResolvedConfiguration,
  ReturnConsumedCapacity,
  ReturnItemCollectionMetrics,
} from "@aws-sdk/client-dynamodb";
import { Command } from "@aws-sdk/smithy-client";
import { Handler, MiddlewareStack } from "@aws-sdk/types";

import {
  MaterializedTableProps as MaterializedTableProperties,
  TableName,
} from "../../aws-dynamodb/table.js";
import { ServiceInputTypes, ServiceOutputTypes } from "../dynamodb-client.js";
import {
  ExpressionAttributeNames,
  ExpressionAttributeValues,
} from "../util/expression-attributes.js";

export type QueryCommandInput<
  T extends MaterializedTableProperties = MaterializedTableProperties,
  FilterExpression extends string = string,
  KeyConditionExpression extends string = string,
  ProjectionExpression extends string = string,
> = BaseCommandInput & {
  TableName: TableName<T>;
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

// export class QueryCommand<
//   T extends MaterializedTableProps = MaterializedTableProps,
//   FilterExpression extends string = string,
//   KeyConditionExpression extends string = string,
//   ProjectionExpression extends string = string,
// > extends CommandProxy<
//   BaseCommandInput,
//   BaseCommandOutput,
//   DynamoDBClientResolvedConfig
// > {
//   constructor(
//     input: QueryCommandInput<
//       T,
//       FilterExpression,
//       KeyConditionExpression,
//       ProjectionExpression
//     >,
//   ) {
//     super(new BaseCommand(input as unknown as BaseCommandInput));
//   }
// }

export class QueryCommand<
  T extends MaterializedTableProperties = MaterializedTableProperties,
  FilterExpression extends string = string,
  KeyConditionExpression extends string = string,
  ProjectionExpression extends string = string,
> implements
    Command<BaseCommandInput, BaseCommandOutput, ResolvedConfiguration>
{
  private readonly command: BaseCommand;

  constructor(
    input: QueryCommandInput<
      T,
      FilterExpression,
      KeyConditionExpression,
      ProjectionExpression
    >,
  ) {
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
