# cloudy-ts

> These packages aren't yet published on npm. This is still highly experimental.

Cloudy is a set of constructs for the [AWS Cloud Development Kit](https://github.com/aws/aws-cdk) that aim to improve the DX by providing a faster and type-safe code environment.

## Design Goals

- Use ESM modules along with a subset of TypeScript that doesn't generate code and can be striped away. This will come in handy if the [Type Annotations Proposal](https://github.com/tc39/proposal-type-annotations) gets accepted.
- Consistency with the AWS CDK constructs: offer the same API for constructs, but enhanced with types
- Consistency with the AWS SDK v3: offer the same API for clients, but enhanced with types

## Example

### Publishing typed messages on a topic using an inline lambda function

```ts
import * as cdk from "aws-cdk-lib"
import * as cloudy from "@cloudy-ts/cdk"
import { SNSClient, PublishCommand } from "@cloudy-ts/client-sns"

const app = new cdk.App()

const stack = new cdk.Stack(app, "cloudy-playground")

const topic = new cloudy.aws_sns.Topic(stack, "topic").withMessageType<
  "Hello" | "World!"
>()

const sns = new SNSClient({})
const publishMessage = new cloudy.aws_lambda.Function(stack, "function", {
  async handler() {
    await sns.send(
      new PublishCommand({
        TopicArn: topic.topicArn,
        Message: "Hello",
      }),
    )
    await sns.send(
      new PublishCommand({
        TopicArn: topic.topicArn,
        Message: "World!",
      }),
    )
  },
})
topic.grantPublish(publishMessage)
```

## Explanation

The `cloudy.aws_lambda.Function` is a CDK Lambda Function construct that uses [Pulumi's Function Serialization](https://www.pulumi.com/docs/intro/concepts/function-serialization/) to generate the asset code for the lambda.

The important part of the implementation lives in [`packages/cdk/src/aws-lambda/code-from-function.ts`](packages/cdk/src/aws-lambda/code-from-function.ts). It calls `pulumi.runtime.serializeFunction` to generate the serialized function code, while gathering all the CloudFormation tokens that are accessed (such as queue URLs, queue ARNs, table names, etc.). The CloudFormation tokens are then replaced by environment variables.

The [`packages/cdk/src/aws-lambda/function.ts`](packages/cdk/src/aws-lambda/function.ts) is just a copy&paste of the original `cdk.aws_lambda.Function` that resolves the asset code asynchronously. This is necessary due to `pulumi.runtime.serializeFunction` being an async function. It would be great if the original construct just allowed us to pass a `Promise<cdk.aws_lambda.AssetCode>` instead.

## Further improvements

The idea of this project is to leverage the [TypeScript](https://www.typescriptlang.org/) typing system and provide type-enhanced CDK constructs such as `cloudy.aws_sns.Topic`, `cloudy.aws_sqs.Queue`, `cloudy.aws_dynamodb.Table`, etc. as well as type-enhanced [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html) client. In conjunction, it would allow a supreme developer experience.

Huge thanks to [Sam Goodwin](https://github.com/sam-goodwin) to promote this movement. See their projects:

- https://github.com/sam-goodwin/functionless
- https://github.com/sam-goodwin/typesafe-dynamodb
- https://github.com/sam-goodwin/punchcard (kind of deprecated, but inspiring nonetheless!)

## Try the playground

Install with pnpm:

```sh
pnpm install
```

Then, go to the `playground` folder and follow the instructions in there.

## Contributing

### Setup

Install dependencies:

```sh
pnpm install
```

Enable Git hooks:

```sh
pnpx husky install
```

### Lint

```sh
pnpx eslint --ext js,mjs,cjs,ts,mts,cts .
```

### Update Dependencies

```sh
pnpm up -r
```

Interactive, with the latest versions:

```sh
pnpm up -iLr
```
