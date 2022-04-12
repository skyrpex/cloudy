import { IFunction as IBaseFunction } from "aws-cdk-lib/aws-lambda"
import {
  SnsEventSource as BaseSnsEventSource,
  SnsEventSourceProps as BaseProperties,
} from "aws-cdk-lib/aws-lambda-event-sources"
import { Construct } from "constructs"
import { Union } from "ts-toolbelt"

import { JsonEncoded } from "@cloudy-ts/json-codec"

import { BaseEventSource, IFunction } from "../aws-lambda/index.js"
import { Topic } from "../aws-sns/topic.js"
import { staticTest } from "../static-test.js"

export interface SnsEventSourceProperties extends BaseProperties {}

type AnyTopic = Topic<string, string, string, undefined, boolean>

type TopicMessageType<T extends AnyTopic> = T extends Topic<
  infer Message,
  string,
  string
>
  ? Message
  : never

export type SnsEventType<T extends AnyTopic> = {
  Message: TopicMessageType<T>
}

export class SnsEventSource<T extends AnyTopic> extends BaseEventSource<
  SnsEventType<T>
> {
  private readonly source: BaseSnsEventSource

  constructor(topic: T, properties?: SnsEventSourceProperties) {
    super()
    this.source = new BaseSnsEventSource(topic, properties)
  }

  bind(target: IFunction<SnsEventType<T>, any>): void {
    this.source.bind(target as IBaseFunction)
  }
}

staticTest((scope: Construct, id: string) => {
  const topic = new Topic(scope, id, {
    fifo: true,
  })
    // .withMessageGroupIdType<"default">()
    // .withMessageDeduplicationIdType<EventId>()
    .withMessageType<
      JsonEncoded<{
        streamId: string
        timestamp: number
      }>
    >()

  const eventSource = new SnsEventSource(topic)
})
