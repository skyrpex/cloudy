/* eslint-disable import/export */
export * from "aws-cdk-lib/aws-sns-subscriptions";

import { aws_sns, aws_sns_subscriptions } from "aws-cdk-lib";

import { BaseTopicSubscription } from "../aws-sns/subscription.js";
import { Topic } from "../aws-sns/topic.js";
import { MaterializeQueueProperties, Queue } from "../aws-sqs/queue.js";
import { ValueType } from "../core/value-type.js";

export interface SqsSubscriptionProperties<RawMessageDelivery extends true>
  extends aws_sns_subscriptions.SqsSubscriptionProps {
  rawMessageDelivery: RawMessageDelivery;
}

type QueueMessage<T extends Queue> = T extends Queue<infer P>
  ? MaterializeQueueProperties<P>["message"]
  : never;

type TopicFromQueue<T extends Queue> = T extends Queue<infer P>
  ? Topic<{
      fifo: P["fifo"];
      // messageType: ValueType<Message>;
      messageType: P["messageType"];
      messageGroupIdType: P["messageGroupIdType"];
      messageDeduplicationIdType: P["messageDeduplicationIdType"];
      messageAttributesType: P["messageAttributesType"];
    }>
  : never;

export class SqsSubscription<T extends Queue, RawMessageDelivery extends true>
  extends BaseTopicSubscription<QueueMessage<T>>
  implements aws_sns.ITopicSubscription
{
  private readonly subscription: aws_sns_subscriptions.SqsSubscription;

  /**
   * Use an SQS queue as a subscription target
   */
  public constructor(
    queue: T,
    properties: SqsSubscriptionProperties<RawMessageDelivery>,
  ) {
    // super(queue, properties)
    super();
    this.subscription = new aws_sns_subscriptions.SqsSubscription(
      queue,
      properties,
    );
  }

  /**
   * Returns a configuration for an SQS queue to subscribe to an SNS topic
   * @param topic — topic for which subscription will be configured
   */
  bind(topic: TopicFromQueue<T>): aws_sns.TopicSubscriptionConfig {
    return this.subscription.bind(topic);
  }
}
