import { IFunction as IBaseFunction } from "aws-cdk-lib/aws-lambda"
import {
  DynamoEventSource as BaseDynamoEventSource,
  DynamoEventSourceProps,
} from "aws-cdk-lib/aws-lambda-event-sources"

import { DynamodbItem, Table } from "../aws-dynamodb/table.js"
import { BaseEventSource, IFunction } from "../aws-lambda/function.js"

export interface DynamoEventSourceProperties extends DynamoEventSourceProps {}

export class DynamoEventSource<
  Item extends DynamodbItem,
> extends BaseEventSource<Item> {
  private readonly source: BaseDynamoEventSource

  constructor(table: Table<Item>, properties: DynamoEventSourceProperties) {
    super()
    this.source = new BaseDynamoEventSource(table, properties)
  }

  bind(target: IFunction<Item, any>): void {
    this.source.bind(target as IBaseFunction)
  }
}
