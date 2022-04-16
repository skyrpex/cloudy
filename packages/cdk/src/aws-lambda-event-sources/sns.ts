import { IFunction as IBaseFunction } from "aws-cdk-lib/aws-lambda";
import {
  SnsEventSource as BaseSnsEventSource,
  SnsEventSourceProps as BaseProperties,
} from "aws-cdk-lib/aws-lambda-event-sources";
import { Construct } from "constructs";
import { Union } from "ts-toolbelt";

import { JsonEncoded } from "@cloudy-ts/json-codec";

import { BaseEventSource, IFunction } from "../aws-lambda/index.js";
import { MaterializeTopicProperties, Topic } from "../aws-sns/topic.js";
import { staticTest } from "../static-test.js";

export interface SnsEventSourceProperties extends BaseProperties {}

type TopicMessageType<T extends Topic> = T extends Topic<infer P>
  ? MaterializeTopicProperties<P>["message"]
  : never;

export type SnsEventType<T extends Topic> = {
  Message: TopicMessageType<T>;
};

export class SnsEventSource<T extends Topic> extends BaseEventSource<
  SnsEventType<T>
> {
  private readonly source: BaseSnsEventSource;

  constructor(topic: T, properties?: SnsEventSourceProperties) {
    super();
    this.source = new BaseSnsEventSource(topic, properties);
  }

  bind(target: IFunction<SnsEventType<T>, any>): void {
    this.source.bind(target as IBaseFunction);
  }
}

// staticTest((scope: Construct, id: string) => {
//   const topic = new Topic(scope, id, {
//     fifo: true,
//   })
//     // .withMessageGroupIdType<"default">()
//     // .withMessageDeduplicationIdType<EventId>()
//     .withMessageType<
//       JsonEncoded<{
//         streamId: string
//         timestamp: number
//       }>
//     >()

//   const eventSource = new SnsEventSource(topic)
// })
