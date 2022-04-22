import * as cdk from "aws-cdk-lib";
import { expect, test } from "vitest";

import * as cloudy from "../../src/index.js";

test("synthesizes correctly after waiting for the async dependencies", async () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Test");
  new cloudy.aws_lambda.Function(stack, "RaceCondition", {
    code: cdk.aws_lambda.Code.fromInline(
      "export function handler() { return 'HELLO WORLD'; }",
    ),
    handler: "index.handler",
    runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
  });

  await cloudy.waitForAsyncDependencies(app);

  const template = cdk.assertions.Template.fromStack(stack);
  template.hasResourceProperties("AWS::Lambda::Function", {
    Handler: "index.handler",
    Runtime: cdk.aws_lambda.Runtime.NODEJS_14_X.name,
  });
});

test("throws on attempting to synthesize before waiting for async dependencies", async () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Test");
  new cloudy.aws_lambda.Function(stack, "RaceCondition", {
    code: cdk.aws_lambda.Code.fromInline(
      "export function handler() { return 'HELLO WORLD'; }",
    ),
    handler: "index.handler",
    runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
  });

  expect(() => {
    app.synth();
  }).toThrowError(cloudy.AsyncDependenciesError);
});

test("throws on attempting to synthesize if there are failed dependencies", async () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Test");
  new cloudy.aws_lambda.Function(stack, "RaceCondition", {
    code: Promise.reject("Couldn't build my code"),
    handler: "index.handler",
    runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
  });

  await expect(async () => {
    await cloudy.waitForAsyncDependencies(app);
  }).rejects.toThrowError("Couldn't build my code");
});

test("synthesizes correctly even without calling to waitForAsyncDependencies directly", async () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Test");
  new cloudy.aws_lambda.Function(stack, "RaceCondition", {
    code: cdk.aws_lambda.Code.fromInline(
      "export function handler() { return 'HELLO WORLD'; }",
    ),
    handler: "index.handler",
    runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
  });

  await new Promise((resolve) => setTimeout(resolve, 1));

  const template = cdk.assertions.Template.fromStack(stack);
  template.hasResourceProperties("AWS::Lambda::Function", {
    Handler: "index.handler",
    Runtime: cdk.aws_lambda.Runtime.NODEJS_14_X.name,
  });
});
