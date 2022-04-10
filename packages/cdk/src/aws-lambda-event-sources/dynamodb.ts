import { IFunction as IBaseFunction } from "aws-cdk-lib/aws-lambda"
import {
  DynamoEventSource as BaseDynamoEventSource,
  DynamoEventSourceProps,
} from "aws-cdk-lib/aws-lambda-event-sources"
import { Construct } from "constructs"
import { Union } from "ts-toolbelt"

import {
  AttributeType,
  BillingMode,
  DynamodbItem,
  StreamViewType,
  Table,
  TableItemType,
} from "../aws-dynamodb/table.js"
import { BaseEventSource, IFunction } from "../aws-lambda/index.js"
import { staticTest } from "../static-test.js"

/**
 * Represents an empty object.
 *
 * Useful to merge types with nothing in it.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
type Empty = {}

/**
 * Returns the table stream view type.
 */
export type TableStreamViewType<T extends Table> = T extends Table<any, infer P>
  ? P["stream"] extends StreamViewType
    ? P["stream"]
    : never
  : never

/**
 * Represents a dynamodb stream event change record for lambda.
 */
type StreamEventDynamodbType<T extends Table> =
  TableStreamViewType<T> extends never
    ? never
    : Union.Merge<
        {
          ApproximateCreationDateTime: number
          // Keys?: TableAttributes
          SequenceNumber: string
          SizeBytes: number
          StreamViewType: TableStreamViewType<T>
        } & (TableStreamViewType<T> extends StreamViewType.NEW_IMAGE
          ? {
              NewImage: TableItemType<T> | undefined
            }
          : TableStreamViewType<T> extends StreamViewType.NEW_AND_OLD_IMAGES
          ? {
              NewImage: TableItemType<T> | undefined
            }
          : Empty) &
          (TableStreamViewType<T> extends StreamViewType.OLD_IMAGE
            ? {
                OldImage: TableItemType<T> | undefined
              }
            : TableStreamViewType<T> extends StreamViewType.NEW_AND_OLD_IMAGES
            ? {
                OldImage: TableItemType<T> | undefined
              }
            : Empty)
      >

/**
 * Represents a dynamodb stream event for lambda.
 */
export type DynamoStreamEventType<T extends Table> =
  TableStreamViewType<T> extends never
    ? never
    : {
        Records: {
          eventID: string
          eventName: "INSERT" | "MODIFY" | "REMOVE"
          eventVersion: string
          eventSource: "aws:dynamodb"
          awsRegion: string
          dynamodb: StreamEventDynamodbType<T>
          eventSourceARN: string
        }[]
      }

export interface DynamoEventSourceProperties extends DynamoEventSourceProps {}

export class DynamoEventSource<T extends Table> extends BaseEventSource<
  DynamoStreamEventType<T>
> {
  private readonly source: BaseDynamoEventSource

  constructor(table: T, properties: DynamoEventSourceProperties) {
    super()
    this.source = new BaseDynamoEventSource(table, properties)
  }

  bind(target: IFunction<DynamoStreamEventType<T>, any>): void {
    this.source.bind(target as IBaseFunction)
  }
}

staticTest(() => {
  type User = {
    pk: { S: string }
    sk: { N: string }
  }
  const table = new Table(undefined as unknown as Construct, "table", {
    partitionKey: {
      name: "pk",
      type: AttributeType.STRING,
    },
    sortKey: {
      name: "sk",
      type: AttributeType.NUMBER,
    },
    // stream: StreamViewType.OLD_IMAGE,
    // stream: StreamViewType.NEW_IMAGE,
    stream: StreamViewType.NEW_AND_OLD_IMAGES,
    billingMode: BillingMode.PAY_PER_REQUEST,
  })
  const table2 = table.withItemType<User>()
  type x = DynamoStreamEventType<typeof table2>
})
