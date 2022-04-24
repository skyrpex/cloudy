import { JsonEncoded } from "@cloudy-ts/json-codec";
import { StringEncoded } from "@cloudy-ts/string-codec";
import { IFunction as IBaseFunction } from "aws-cdk-lib/aws-lambda";
import {
  SqsEventSource as BaseSqsEventSource,
  SqsEventSourceProps as BaseProps,
} from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";
import { F } from "ts-toolbelt";

import { BaseEventSource, IFunction } from "../aws-lambda/index.js";
import {
  MaterializedQueueProps,
  MaterializeQueueProps,
  Queue,
} from "../aws-sqs/queue.js";
import { ValueType } from "../core/value-type.js";
import { staticTest } from "../static-test.js";

export interface SqsEventSourceProps extends BaseProps {}

type QueueMessageType<T extends Queue> = T extends Queue<infer P>
  ? MaterializeQueueProps<P>["message"]
  : never;

interface SqsEventTypeRaw<
  T extends MaterializedQueueProps,
  RawMessageDelivery extends boolean = boolean
> {
  Records: {
    messageId: string;
    receiptHandle: string;
    // body: QueueMessageType<T>;
    body: RawMessageDelivery extends true
      ? T["message"]
      : JsonEncoded<{
          Message: T["message"];
          MessageId: string;
          SequenceNumber: StringEncoded<bigint>;
          Timestamp: "2022-04-11T16:25:46.848Z";
          TopicArn: string;
          Type: "Notification";
          UnsubscribeURL: string;
        }>;
    // body: T["message"];
    attributes: {
      ApproximateReceiveCount: StringEncoded<number>;
      SentTimestamp: StringEncoded<number>;
      SequenceNumber: StringEncoded<bigint>;
      SenderId: string;
      ApproximateFirstReceiveTimestamp: StringEncoded<number>;
    } & (T["fifo"] extends true
      ? {
          MessageGroupId: T["messageGroupId"];
          MessageDeduplicationId: T["messageDeduplicationId"];
        }
      : {});
    messageAttributes: T["messageAttributes"];
    md5OfBody: string;
    eventSource: "aws:sqs";
    eventSourceARN: string;
    awsRegion: string;
  }[];
}

// type x = MaterializeQueueProps<T>

export type SqsEventType<
  T extends Queue,
  RawMessageDelivery extends boolean
> = T extends Queue<infer P>
  ? SqsEventTypeRaw<MaterializeQueueProps<P>, RawMessageDelivery>
  : never;
// > = F.Narrow<{
// > = T extends Queue<infer P>
//   ? MaterializeQueueProps<P> extends infer U
//     ? U extends MaterializedQueueProps
//       ? SqsEventTypeRaw<U, RawMessageDelivery>
//       : never
//     : never
//   : never;

export class SqsEventSource<
  T extends Queue
  // RawMessageDelivery extends boolean,
  // > extends BaseEventSource<SqsEventType<T, RawMessageDelivery>> {
> extends BaseEventSource<SqsEventType<T, true>> {
  private readonly source: BaseSqsEventSource;

  constructor(queue: T, properties?: SqsEventSourceProps) {
    super();
    this.source = new BaseSqsEventSource(queue, properties);
  }

  // bind(target: IFunction<SqsEventType<T, RawMessageDelivery>, any>): void {
  bind(target: IFunction<SqsEventType<T, true>, any>): void {
    this.source.bind(target as IBaseFunction);
  }
}

staticTest((scope: Construct, id: string) => {
  const queue = new Queue(scope, id, {
    fifo: true,
    messageType: ValueType.as<"hello world">(),
    messageAttributesType: {
      test: {
        DataType: "String",
        StringValue: ValueType.as<"testvalue">(),
      },
    },
  });

  type m = F.Narrow<MaterializeQueueProps<typeof queue>>;

  const eventSource = new SqsEventSource(queue);

  type X1 = SqsEventType<typeof queue, true>;
  staticTest((event: X1) => {
    event.Records[0]?.body;
    event.Records[0]?.messageAttributes.test.StringValue;
  });

  // type X<T extends MaterializedQueueProps> =
  //   MaterializeQueueProps<T>["message"];
  type x = QueueMessageType<typeof queue>;

  type QueueMessageType2<T extends Queue> = T extends Queue<infer P>
    ? {
        message: MaterializeQueueProps<P>["message"];
        messageAttributes: MaterializeQueueProps<P>["messageAttributes"];
      }
    : never;
  type y = QueueMessageType2<typeof queue>;
});
