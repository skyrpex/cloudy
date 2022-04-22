/* eslint-disable import/export */
export * from "aws-cdk-lib/aws-sns";

export {
  BaseTopicSubscription,
  type ITopicSubscription,
} from "./subscription.js";
export {
  type MaterializeTopicProperties,
  type MaterializedTopicProperties,
  Topic,
  type TopicArn,
  type TopicProperties,
} from "./topic.js";
