import * as cdk from "aws-cdk-lib";

import * as cloudy from "@cloudy-ts/cdk";
import { SNSClient, PublishCommand } from "@cloudy-ts/client-sns";

import { buildExampleStackName } from "../util.js";

const app = new cdk.App();

const stack = new cdk.Stack(app, buildExampleStackName(import.meta.url));

const topic = new cloudy.aws_sns.Topic(stack, "Topic", {
  // Cloudy allows you to restrict the SNS Topic message types. In this
  // example, we will only allow messages with either "hello" or "world!".
  messageType: cloudy.aws_sns.MessageType.as<"hello" | "world!">(),
  // We can also indicate the message attributes type.
  messageAttributesType: cloudy.aws_sns.MessageAttributesType.as<{
    userId: {
      DataType: "Number";
      StringValue: string;
    };
  }>(),
});

// Cloudy has a SNSClient proxy that enforces type constraints, depending
// on the topic you're interacting with. The CallbackFunction will grab the
// client even if it's defined outside of the handler.
const sns = new SNSClient({});
const publishMessage = new cloudy.aws_lambda.CallbackFunction(
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
