import * as cdk from "aws-cdk-lib";

import * as cloudy from "@cloudy-ts/cdk";

import { buildExampleStackName } from "../util.js";

const app = new cdk.App();

const stack = new cdk.Stack(app, buildExampleStackName(import.meta.url));

const raceCondition = new cloudy.aws_lambda.Function(stack, "RaceCondition", {
  code: new Promise((resolve) => {
    setTimeout(
      () =>
        resolve(
          cdk.aws_lambda.Code.fromInline(
            "export function handler() { return 'HELLO WORLD'; }",
          ),
        ),
      5_000,
    );
  }),
  handler: "index.handler",
  runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
});

// Calling app.synth() manually will let the race condition happen. If left
// commented, the cdk process will somehow prevent it from happening  (that
// includes both "cdk synth" and "cdk deploy", but also the special watch and
// hotswap modes.
// app.synth();
