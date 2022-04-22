import * as cdk from "@cloudy-ts/cdk";
import { SNSClient, PublishCommand } from "@cloudy-ts/client-sns";

import { buildExampleStackName } from "../util.js";

const app = new cdk.App();
const stack = new cdk.Stack(app, buildExampleStackName(import.meta.url));

const topic = new cdk.aws_sns.Topic(stack, "Topic", {
  // Cloudy allows you to restrict the SNS Topic message types. In this
  // example, we will only allow messages with either "hello" or "world!".
  messageType: cdk.ValueType.string<"hello" | "world!">(),
  // We can also indicate the message attributes types.
  messageAttributesType: {
    userId: {
      DataType: "Number",
      StringValue: cdk.ValueType.string<`${number}`>(),
    },
  },
});

// Cloudy has a SNSClient proxy that enforces type constraints, depending
// on the topic you're interacting with. The CallbackFunction will grab the
// client even if it's defined outside of the handler.
const sns = new SNSClient({});
const publishMessage = new cdk.aws_lambda.CallbackFunction(
  stack,
  "PublishMessage",
  {
    async handler() {
      await sns.send(
        new PublishCommand({
          TopicArn: topic.topicArn,
          // If you try writing a different message, you'll get a type error.
          Message: "hello",
          // Same with the message attributes!
          MessageAttributes: {
            userId: {
              DataType: "Number",
              StringValue: "1",
            },
          },
        }),
      );
    },
  },
);
topic.grantPublish(publishMessage);
