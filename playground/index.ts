import * as cdk from "aws-cdk-lib"

import * as cloudy from "@cloudy-ts/cdk"
import { stringEncode } from "@cloudy-ts/cdk"
import { DynamoDBClient, PutItemCommand } from "@cloudy-ts/client-dynamodb"
import { SNSClient, PublishCommand } from "@cloudy-ts/client-sns"
import { OpaqueType } from "@cloudy-ts/opaque-type"

const app = new cdk.App()

const stack = new cdk.Stack(app, "cloudy-playground")

const topic = new cloudy.aws_sns.Topic(stack, "topic", {
  messageType: cloudy.aws_sns.ValueType.string<"Hello" | "World!">(),
  messageAttributesType: {
    userId: {
      DataType: "Number",
      StringValue: cloudy.aws_sns.ValueType.string<`${number}`>(),
    },
  },
})

type CustomBigInt = OpaqueType<bigint, { readonly t: unique symbol }>

const table = new cloudy.aws_dynamodb.Table(stack, "table", {
  partitionKey: { name: "pk", type: cdk.aws_dynamodb.AttributeType.STRING },
  sortKey: { name: "sk", type: cdk.aws_dynamodb.AttributeType.STRING },
  accessPatterns: cloudy.aws_dynamodb.AccessPatterns.as<
    | {
        pk: `user#${string}`
        sk: "profile"
        userName: string
      }
    | {
        pk: `user#${string}`
        sk: "metadata"
        // age: MyBigInt
        number: number
        number2: number
        bigint: bigint
        bigint2: bigint
        CustomBigInt: CustomBigInt
      }
  >(),
  // accessPatterns: cloudy.aws_dynamodb.AccessPatterns.any(),
  billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
})

const sns = new SNSClient({})
const dynamodb = new DynamoDBClient({})
const publishMessage = new cloudy.aws_lambda.CallbackFunction(
  stack,
  "function",
  {
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
            pk: { S: "user#1" },
            sk: { S: "profile" },
            userName: { S: "Cristian" },
          },
        }),
      )

      await dynamodb.send(
        new PutItemCommand({
          TableName: table.tableName,
          Item: {
            pk: { S: "user#1" },
            sk: { S: "metadata" },
            number: { N: "1" },
            number2: { N: stringEncode(1) },
            bigint: { N: "1" },
            bigint2: { N: stringEncode(1n) },
            CustomBigInt: { N: stringEncode(1n as CustomBigInt) },
          },
        }),
      )
    },
  },
)
topic.grantPublish(publishMessage)
table.grantWriteData(publishMessage)
