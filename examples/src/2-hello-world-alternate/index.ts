// You can actually import Cloudy as the CDK object. It exports the same as AWS
// CDK from "aws-cdk-lib", including some additional constructs.
import * as cdk from "@cloudy-ts/cdk";

import { buildExampleStackName } from "../util.js";

const app = new cdk.App();
const stack = new cdk.Stack(app, buildExampleStackName(import.meta.url));

new cdk.aws_lambda.CallbackFunction(stack, "HelloWorld", {
  async handler(name: string) {
    console.log(`hello world, ${name}!`);
  },
});

// There's no need to manually call synth, but if you do, make sure to use the
// helper in `cloudy.synth(app)`. Otherwise, if you use `app.synth()` an
// exception will likely be thrown because some Cloudy constructs have async
// resources.
await cdk.synth(app);
