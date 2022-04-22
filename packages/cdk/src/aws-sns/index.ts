/* eslint import/export: "warn" */
export * from "aws-cdk-lib/aws-sns";

export {
  BaseTopicSubscription,
  type ITopicSubscription,
} from "./subscription.js";
export {
  type MaterializeTopicProps,
  type MaterializedTopicProps,
  Topic,
  type TopicArn,
  type TopicProps,
} from "./topic.js";
