import { IFunction as IBaseFunction } from "aws-cdk-lib/aws-lambda"
import {
  SqsEventSource as BaseSqsEventSource,
  SqsEventSourceProps as BaseProperties,
} from "aws-cdk-lib/aws-lambda-event-sources"
import { Construct } from "constructs"
import { Union } from "ts-toolbelt"

import { JsonEncoded } from "@cloudy-ts/json-codec"
import { StringEncoded } from "@cloudy-ts/string-codec"

import { BaseEventSource, IFunction } from "../aws-lambda/index.js"
import { MessageAttributesType } from "../aws-sns/topic.js"
import { Queue } from "../aws-sqs/queue.js"
import { staticTest } from "../static-test.js"

export interface SqsEventSourceProperties extends BaseProperties {}

type AnyQueue = Queue<string, string, string, any, boolean>

type TopicMessageType<T extends AnyQueue> = T extends Queue<
  infer Message,
  string,
  string
>
  ? Message
  : never

interface SqsEventTypeRaw<
  Message extends string = string,
  MessageGroupId extends string = string,
  MessageDeduplicationId extends string = string,
  MessageAttributes extends MessageAttributesType = undefined,
  Fifo extends boolean = boolean,
  RawMessageDelivery extends boolean = boolean,
> {
  Records: {
    messageId: string
    receiptHandle: string
    body: RawMessageDelivery extends true
      ? Message
      : JsonEncoded<{
          Message: Message
          MessageId: string
          SequenceNumber: StringEncoded<bigint>
          Timestamp: "2022-04-11T16:25:46.848Z"
          TopicArn: string
          Type: "Notification"
          UnsubscribeURL: string
        }>
    attributes: {
      ApproximateReceiveCount: StringEncoded<number>
      SentTimestamp: StringEncoded<number>
      SequenceNumber: StringEncoded<bigint>
      SenderId: string
      ApproximateFirstReceiveTimestamp: StringEncoded<number>
    } & (Fifo extends true
      ? {
          MessageGroupId: MessageGroupId
          MessageDeduplicationId: MessageDeduplicationId
        }
      : {})
    messageAttributes: MessageAttributes
    md5OfBody: string
    eventSource: "aws:sqs"
    eventSourceARN: string
    awsRegion: string
  }[]
}

export type SqsEventType<
  T extends AnyQueue,
  RawMessageDelivery extends boolean,
> = SqsEventTypeRaw<
  T extends Queue<infer Message> ? Message : never,
  T extends Queue<any, infer MessageGroupId> ? MessageGroupId : never,
  T extends Queue<any, any, infer MessageDeduplicationId>
    ? MessageDeduplicationId
    : never,
  T extends Queue<any, any, any, infer MessageAttributes>
    ? MessageAttributes
    : never,
  T extends Queue<any, any, any, any, infer Fifo> ? Fifo : never,
  RawMessageDelivery
>

export class SqsEventSource<
  T extends AnyQueue,
  // RawMessageDelivery extends boolean,
  // > extends BaseEventSource<SqsEventType<T, RawMessageDelivery>> {
> extends BaseEventSource<SqsEventType<T, true>> {
  private readonly source: BaseSqsEventSource

  constructor(topic: T, properties?: SqsEventSourceProperties) {
    super()
    this.source = new BaseSqsEventSource(topic, properties)
  }

  // bind(target: IFunction<SqsEventType<T, RawMessageDelivery>, any>): void {
  bind(target: IFunction<SqsEventType<T, true>, any>): void {
    this.source.bind(target as IBaseFunction)
  }
}

staticTest((scope: Construct, id: string) => {
  const queue = new Queue(scope, id, {
    fifo: true,
  })

  const eventSource = new SqsEventSource(queue)

  type X1 = SqsEventType<typeof queue, true>
  staticTest((event: X1) => {
    event.Records[0]?.body
  })
})
