# Cloudy

<p align="center">
<img src="docs/cloudy.svg" height="120">
</p>

> **⚠ WARNING: Work in progress!**  
> These packages aren't yet published on npm. This is still highly experimental.
> Need to figure out a few things before releasing the first version:
>
> - Define a good Github Actions workflow (linting, testing, auto releases, auto upgrades, etc)
> - Explore a few more typed constructs and clients
> - Move to a Github Organization
> - Add some more documentation

Cloudy is a set of constructs for the [AWS Cloud Development Kit](https://github.com/aws/aws-cdk) that aim to improve the DX by providing a faster and type-safe code environment.

## Design Goals

- Use ESM modules along with a subset of TypeScript that doesn't generate code and can be striped away. This will come in handy if the [Type Annotations Proposal](https://github.com/tc39/proposal-type-annotations) gets accepted.
- Consistency with the AWS CDK constructs: offer the same API for constructs, but enhanced with types
- Consistency with the AWS SDK v3: offer the same API for clients, but enhanced with types

## Example

### Publishing typed messages on a topic using an inline lambda function

```ts
import * as cdk from "aws-cdk-lib";
import * as cloudy from "@cloudy-ts/cdk";
import { SNSClient, PublishCommand } from "@cloudy-ts/client-sns";

const app = new cdk.App();

const stack = new cdk.Stack(app, "cloudy-playground");

const topic = new cloudy.aws_sns.Topic(stack, "topic", {
  messageType: cloudy.ValueType.as<"Hello" | "World!">(),
});

const sns = new SNSClient({});
const publishMessage = new cloudy.aws_lambda.Function(stack, "publishMessage", {
  async handler() {
    await sns.send(
      new PublishCommand({
        TopicArn: topic.topicArn,
        Message: "Hello",
      }),
    );
    await sns.send(
      new PublishCommand({
        TopicArn: topic.topicArn,
        Message: "World!",
      }),
    );
  },
});
topic.grantPublish(publishMessage);
```

## Further improvements

The idea of this project is to leverage the [TypeScript](https://www.typescriptlang.org/) typing system and provide type-enhanced CDK constructs such as `cloudy.aws_sns.Topic`, `cloudy.aws_sqs.Queue`, `cloudy.aws_dynamodb.Table`, etc. as well as type-enhanced [AWS SDK v3](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/index.html) client. In conjunction, it would allow a supreme developer experience.

Huge thanks to [Sam Goodwin](https://github.com/sam-goodwin) to promote this movement. See their projects:

- https://github.com/sam-goodwin/functionless
- https://github.com/sam-goodwin/typesafe-dynamodb
- https://github.com/sam-goodwin/punchcard (kind of deprecated, but inspiring nonetheless!)

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

Start testing:

```sh
pnpx ava --watch
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

### Release

```sh
pnpx turbo run lint test build
pnpx standard-version # --first-release
git push --folow-tags origin main
```

## Other

Temporary logo from <a href="https://www.vecteezy.com/free-vector/web">Web Vectors by Vecteezy</a>.
