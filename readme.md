# cloudy

Cloudy is a set of constructs for the [AWS Cloud Development Kit](https://github.com/aws/aws-cdk) that aim to improve the DX by providing a faster and type-safe code environment.

## Usage

```ts
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
```

## Explanation

The `cloudy.Function` is a CDK Lambda Function construct that uses [Pulumi's Function Serialization](https://www.pulumi.com/docs/intro/concepts/function-serialization/) to generate the asset code for the lambda.

The important part of the implementation lives in [`src/code-from-function.ts`](src/code-from-function.ts). It calls `pulumi.runtime.serializeFunction` to generate the serialized function code, while gathering all the CloudFormation tokens that are accessed (such as queue URLs, queue ARNs, table names, etc.). The CloudFormation tokens are then replaced by environment variables.

The [`src/function.ts`](src/function.ts) is just a copy&paste of the original `cdk.aws_lambda.Function` that resolves the asset code asynchronously. This is necessary due to `pulumi.runtime.serializeFunction` being an async function. It would be great if the original construct just allowed us to pass a `Promise<cdk.aws_lambda.AssetCode>` instead.

## Further improvements

The idea of this project is to leverage the [TypeScript](https://www.typescriptlang.org/) typing system and provide type-enhanced CDK constructs such as `cloudy.sns.Topic`, `cloudy.sqs.Queue`, `cloudy.dynamodb.Table`, etc. as well as type-enhanced [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html) client. In conjunction, it would allow a supreme developer experience.

Huge thanks to [Sam Goodwin](https://github.com/sam-goodwin) to promote this movement. See their projects:

- https://github.com/sam-goodwin/functionless
- https://github.com/sam-goodwin/typesafe-dynamodb
- https://github.com/sam-goodwin/punchcard (kind of deprecated, but inspiring nonetheless!)

## Try the playground

Go to the `playground` folder and follow the instructions in there.
