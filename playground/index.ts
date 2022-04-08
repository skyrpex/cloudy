import * as cdk from "aws-cdk-lib"

import * as cloudy from "@cloudy-ts/cdk"
import { DynamoDBClient, PutItemCommand } from "@cloudy-ts/client-dynamodb"
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

const table = new cloudy.aws_dynamodb.Table(stack, "table", {
  partitionKey: { name: "pk", type: cdk.aws_dynamodb.AttributeType.STRING },
  billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
}).withItemType<{
  pk: { S: string }
  text: { S: string }
}>()

const sns = new SNSClient({})
const dynamodb = new DynamoDBClient({})
const publishMessage = new cloudy.aws_lambda.Function(stack, "function", {
  async handler() {
    console.log("We're going to publish a message to the topic")
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

    console.log("Now, we're going to put an item to the table")
    await dynamodb.send(
      new PutItemCommand({
        TableName: table.tableName,
        Item: {
          pk: { S: "message_1" },
          text: { S: "hello world!" },
        },
      }),
    )
  },
})
topic.grantPublish(publishMessage)
table.grantWriteData(publishMessage)
