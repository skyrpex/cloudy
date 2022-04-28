// You can actually substitute the aws-cdk-lib import with cloudy. It exports
// the same objects, including some additional constructs.
import * as cdk from "cloudy-cdk-lib";

import { buildExampleStackName } from "../util.js";

const app = new cdk.App();
const stack = new cdk.Stack(app, buildExampleStackName(import.meta.url));

const helloWorld = new cdk.aws_lambda.CallbackFunction(stack, "HelloWorld", {
  async handler(input: unknown) {
    return `hello world, ${JSON.stringify(input, undefined, 2)}!`;
  },
});

// Create a function URL and output the URL to the console.
const functionUrl = helloWorld.addFunctionUrl({
  authType: cdk.aws_lambda.FunctionUrlAuthType.NONE,
});
new cdk.CfnOutput(functionUrl, "Url", { value: functionUrl.url });

// There's no need to manually call synth, but if you do, make sure to use the
// helper in `cloudy.synth(app)`. Otherwise, if you use `app.synth()` an
// exception will likely be thrown because some Cloudy constructs have async
// resources.
await cdk.synth(app);
