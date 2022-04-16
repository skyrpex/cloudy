import { IFunction as IBaseFunction } from "aws-cdk-lib/aws-lambda";
import {
  SqsEventSource as BaseSqsEventSource,
  SqsEventSourceProps as BaseProperties,
} from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";
import { Union } from "ts-toolbelt";

import { JsonEncoded } from "@cloudy-ts/json-codec";
import { StringEncoded } from "@cloudy-ts/string-codec";

import { BaseEventSource, IFunction } from "../aws-lambda/index.js";
import {
  MaterializedQueueProperties,
  MaterializeQueueProperties,
  Queue,
} from "../aws-sqs/queue.js";
import { staticTest } from "../static-test.js";

export interface SqsEventSourceProperties extends BaseProperties {}

type TopicMessageType<T extends Queue> = T extends Queue<infer P>
  ? MaterializeQueueProperties<P>["message"]
  : never;

interface SqsEventTypeRaw<
  T extends MaterializedQueueProperties,
  RawMessageDelivery extends boolean = boolean,
> {
  Records: {
    messageId: string;
    receiptHandle: string;
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

// type x = MaterializeQueueProperties<T>

export type SqsEventType<
  T extends Queue,
  RawMessageDelivery extends boolean,
> = SqsEventTypeRaw<MaterializeQueueProperties<T>, RawMessageDelivery>;

export class SqsEventSource<
  T extends Queue,
  // RawMessageDelivery extends boolean,
  // > extends BaseEventSource<SqsEventType<T, RawMessageDelivery>> {
> extends BaseEventSource<SqsEventType<T, true>> {
  private readonly source: BaseSqsEventSource;

  constructor(queue: T, properties?: SqsEventSourceProperties) {
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
  });

  const eventSource = new SqsEventSource(queue);

  type X1 = SqsEventType<typeof queue, true>;
  staticTest((event: X1) => {
    event.Records[0]?.body;
  });
});
