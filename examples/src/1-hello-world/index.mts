import * as cloudy from "cloudy-cdk-lib";
import * as cdk from "aws-cdk-lib";

import { buildExampleStackName } from "../util.mjs";

const app = new cdk.App();
const stack = new cdk.Stack(app, buildExampleStackName(import.meta.url));

// The CallbackFunction is a NodeJS Lambda Function that uses ES2020 and it's
// handler is defined in the infrastructure code seamlessly.
new cloudy.aws_lambda.CallbackFunction(stack, "HelloWorld", {
  // You can define the function input and output. This will help when
  // interacting with other services such as other lambda functions, queues,
  // topics, DynamoDB streams, etc.
  async handler(name: string) {
    console.log(`hello world, ${name}!`);
    return `hello world, ${name}!`;
  },
});
