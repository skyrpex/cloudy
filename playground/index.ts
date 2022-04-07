import * as cdk from "aws-cdk-lib"
import * as cloudy from "cloudy"
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns"

const app = new cdk.App()

const stack = new cdk.Stack(app, "cloudy-playground")

const topic = new cdk.aws_sns.Topic(stack, "topic")

const publishMessage = new cloudy.Function(stack, "function", {
  async handler() {
    console.log(`This is the topic's ARN: ${topic.topicArn}`)

    console.log("Now, we're going to publish a message")
    const sns = new SNSClient({})
    await sns.send(
      new PublishCommand({
        TopicArn: topic.topicArn,
        Message: "hello world!",
      }),
    )
  },
})

topic.grantPublish(publishMessage)
