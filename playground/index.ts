import * as cdk from "aws-cdk-lib"
import * as cloudy from "@cloudy-ts/cdk"
import { SNSClient, PublishCommand } from "@cloudy-ts/client-sns"

const app = new cdk.App()

const stack = new cdk.Stack(app, "cloudy-playground")

const topic = new cloudy.aws_sns.Topic(stack, "topic")
  .withMessageType<"Hello" | "World!">()
  // .withMessageGroupIdType<"b">()
  // .withMessageDeduplicationIdType<"c">()
  .withMessageAttributesType<{
    userId: {
      DataType: "Number"
      StringValue: string
    }
  }>()

const sns = new SNSClient({})
const publishMessage = new cloudy.aws_lambda.Function(stack, "function", {
  async handler() {
    console.log(`This is the topic's ARN: ${topic.topicArn}`)

    console.log("Now, we're going to publish a message")
    await sns.send(
      new PublishCommand({
        TopicArn: topic.topicArn,
        Message: "Hello",
        MessageAttributes: {
          userId: {
            DataType: "Number",
            StringValue: "1",
          },
        },
      }),
    )
  },
})

topic.grantPublish(publishMessage)
