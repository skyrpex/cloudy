import {
  AttributeType,
  BillingMode,
  StreamViewType,
} from "aws-cdk-lib/aws-dynamodb";
import { IFunction as IBaseFunction } from "aws-cdk-lib/aws-lambda";
import {
  DynamoEventSource as BaseDynamoEventSource,
  DynamoEventSourceProps as BaseDynamoEventSourceProps,
} from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";
import { Union } from "ts-toolbelt";

import {
  // AccessPatterns,
  // AttributeType,
  // BillingMode,
  // DynamodbItem,
  // MaterializedTableProps,
  MaterializeTableProps as MaterializeTableProps,
  // StreamViewType,
  Table,
  TableProps as TableProps,
  // TableItemType,
} from "../aws-dynamodb/table.js";
import { BaseEventSource, IFunction } from "../aws-lambda/index.js";
import { ToAttributeMap } from "../client-dynamodb/util/attribute-value.js";
import { staticTest } from "../static-test.js";

/**
 * Represents an empty object.
 *
 * Useful to merge types with nothing in it.
 */
// eslint-disable-next-line @typescript-eslint/ban-types
type Empty = {};

type AnyTable = Table<any, any, any, any>;

/**
 * Returns the table stream view type.
 */
export type TableStreamViewType<T> = T extends Table<
  any,
  any,
  any,
  infer StreamView
>
  ? StreamView
  : never;

// type TableItemType<T extends Table> = T extends Table<
//   any,
//   any,
//   infer ItemType,
//   any
// >
//   ? ItemType extends "any"
//     ? DynamodbItem
//     : ItemType extends object
//     ? ToAttributeMap<ItemType>
//     : never
//   : never;

type PropsOfTable<T extends AnyTable> = T extends Table<
  infer P,
  infer S,
  infer I,
  infer Stream
>
  ? TableProps<P, S, I, Stream>
  : never;

type TableItemType<T extends AnyTable> = MaterializeTableProps<
  PropsOfTable<T>
>["itemType"];

type StreamEventDynamodbImage<T extends AnyTable> = Union.Merge<
  (TableStreamViewType<T> extends StreamViewType.NEW_IMAGE
    ? {
        NewImage: ToAttributeMap<TableItemType<T>> | undefined;
      }
    : TableStreamViewType<T> extends StreamViewType.NEW_AND_OLD_IMAGES
    ? {
        NewImage: ToAttributeMap<TableItemType<T>> | undefined;
      }
    : {}) &
    (TableStreamViewType<T> extends StreamViewType.OLD_IMAGE
      ? {
          OldImage: ToAttributeMap<TableItemType<T>> | undefined;
        }
      : TableStreamViewType<T> extends StreamViewType.NEW_AND_OLD_IMAGES
      ? {
          OldImage: ToAttributeMap<TableItemType<T>> | undefined;
        }
      : {})
>;

// /**
//  * Represents a dynamodb stream event change record for lambda.
//  */
// type DynamoStreamEventRecordDynamodb<
//   T extends Table,
//   IncludeImage extends boolean,
// > = Union.Merge<
//   {
//     ApproximateCreationDateTime: number
//     // Keys?: TableAttributes
//     SequenceNumber: string
//     SizeBytes: number
//     StreamViewType: TableStreamViewType<T>
//   } & (IncludeImage extends true ? StreamEventDynamodbImage<T> : {
//     NewImage: undefined
//     OldImage: undefined
//   })
// >

// type DynamoStreamEventRecord<T extends Table> =
//   | {
//       eventID: string
//       eventName: "INSERT" | "MODIFY"
//       eventVersion: string
//       eventSource: "aws:dynamodb"
//       awsRegion: string
//       dynamodb: DynamoStreamEventRecordDynamodb<T, true>
//       eventSourceARN: string
//     }
//   | {
//       eventID: string
//       eventName: "REMOVE"
//       eventVersion: string
//       eventSource: "aws:dynamodb"
//       awsRegion: string
//       dynamodb: DynamoStreamEventRecordDynamodb<T, false>
//       eventSourceARN: string
//     }

// /**
//  * Represents a dynamodb stream event change record for lambda.
//  */
//  type DynamoStreamEventRecordDynamodb<
//  T extends Table,
//  IncludeImage extends boolean,
// > = Union.Merge<
//  {
//    ApproximateCreationDateTime: number
//    // Keys?: TableAttributes
//    SequenceNumber: string
//    SizeBytes: number
//    StreamViewType: TableStreamViewType<T>
//  } & (IncludeImage extends true ? StreamEventDynamodbImage<T> : {
//    NewImage: undefined
//    OldImage: undefined
//  })
// >

type DynamoStreamEventRecord<T extends AnyTable> = {
  eventID: string;
  eventName: "INSERT" | "MODIFY" | "REMOVE";
  eventVersion: string;
  eventSource: "aws:dynamodb";
  awsRegion: string;
  dynamodb: Union.Merge<
    {
      ApproximateCreationDateTime: number;
      // Keys?: TableAttributes
      SequenceNumber: string;
      SizeBytes: number;
      StreamViewType: TableStreamViewType<T>;
    } & StreamEventDynamodbImage<T>
  >;
  eventSourceARN: string;
};

/**
 * Represents a dynamodb stream event for lambda.
 */
export type DynamoStreamEventType<T extends AnyTable> =
  TableStreamViewType<T> extends never
    ? never
    : {
        Records: DynamoStreamEventRecord<T>[];
      };

export interface DynamoEventSourceProps extends BaseDynamoEventSourceProps {}

/**
 * Use an Amazon DynamoDB stream as an event source for AWS Lambda.
 */
export class DynamoEventSource<
  T extends Table<any, any, any, StreamViewType>,
> extends BaseEventSource<DynamoStreamEventType<T>> {
  private readonly source: BaseDynamoEventSource;

  constructor(table: T, properties: DynamoEventSourceProps) {
    super();
    this.source = new BaseDynamoEventSource(table, properties);
  }

  bind(target: IFunction<DynamoStreamEventType<T>, any>): void {
    this.source.bind(target as IBaseFunction);
  }
}

staticTest(() => {
  type User = {
    pk: string;
    sk: number;
  };
  const table = new Table(undefined as unknown as Construct, "table", {
    partitionKey: {
      name: "pk",
      type: AttributeType.STRING,
    },
    sortKey: {
      name: "sk",
      type: AttributeType.NUMBER,
    },
    stream: StreamViewType.NEW_AND_OLD_IMAGES,
    billingMode: BillingMode.PAY_PER_REQUEST,
  });
  // const table2 = table.withItemType<User>()
  type E = DynamoStreamEventType<typeof table>;
  type Y = TableStreamViewType<typeof table>;
  type I = TableItemType<typeof table>;
  type X = StreamEventDynamodbImage<typeof table>;
  staticTest((event: E) => {
    const record = event.Records[0];
    record?.dynamodb.NewImage;
    if (record?.eventName === "INSERT") {
      record.dynamodb.NewImage;
    } else if (record?.eventName === "REMOVE") {
      record.dynamodb.NewImage;
      record.dynamodb.OldImage;
    }
  });
});
