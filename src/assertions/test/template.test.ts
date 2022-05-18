import * as cdk from "aws-cdk-lib";
import { test } from "vitest";

import { Function } from "../../aws-lambda/function.js";
import { Template } from "../template.js";

test("The [fromStack] method waits for dependencies", async () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Test");
  new Function(stack, "Function", {
    code: new Promise((resolve) =>
      setTimeout(
        () =>
          resolve(
            cdk.aws_lambda.Code.fromInline(
              "export function handler() { return 'HELLO WORLD'; }",
            ),
          ),
        1,
      ),
    ),
    handler: "index.handler",
    runtime: cdk.aws_lambda.Runtime.NODEJS_16_X,
  });

  const template = await Template.fromStack(stack);
  template.hasResourceProperties("AWS::Lambda::Function", {
    Code: {
      ZipFile: "export function handler() { return 'HELLO WORLD'; }",
    },
    Handler: "index.handler",
    Runtime: cdk.aws_lambda.Runtime.NODEJS_16_X.name,
  });
});
