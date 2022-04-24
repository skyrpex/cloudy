import * as cdk from "aws-cdk-lib";
import { expect, test } from "vitest";

import { Function } from "../aws-lambda/function.js";
import { synth, waitForAsyncDependencies } from "./async-dependencies.js";

test("synthesizes correctly after waiting for [waitForAsyncDependencies]", async () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Stack");
  new Function(stack, "Function", {
    code: cdk.aws_lambda.Code.fromInline(
      "export function handler() { return 'HELLO WORLD'; }",
    ),
    handler: "index.handler",
    runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
  });

  await waitForAsyncDependencies(app);

  const template = cdk.assertions.Template.fromStack(stack);
  template.hasResourceProperties("AWS::Lambda::Function", {
    Code: {
      ZipFile: "export function handler() { return 'HELLO WORLD'; }",
    },
    Handler: "index.handler",
    Runtime: cdk.aws_lambda.Runtime.NODEJS_14_X.name,
  });
});

test("throws when attempting to synthesize before waiting for [waitForAsyncDependencies]", async () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Stack");
  new Function(stack, "Function", {
    code: cdk.aws_lambda.Code.fromInline(
      "export function handler() { return 'HELLO WORLD'; }",
    ),
    handler: "index.handler",
    runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
  });

  expect(() => {
    app.synth();
  }).toThrowError();
});

test("[waitForAsyncDependencies] throws if there are failed dependencies", async () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Test");
  new Function(stack, "RaceCondition", {
    code: Promise.reject("Couldn't build my code"),
    handler: "index.handler",
    runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
  });

  await expect(async () => {
    await waitForAsyncDependencies(app);
  }).rejects.toThrowError("Couldn't build my code");
});

test("synthesizes correctly even without calling to [waitForAsyncDependencies] directly", async () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Test");
  new Function(stack, "RaceCondition", {
    code: cdk.aws_lambda.Code.fromInline(
      "export function handler() { return 'HELLO WORLD'; }",
    ),
    handler: "index.handler",
    runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
  });

  await new Promise((resolve) => setTimeout(resolve, 1));

  const template = cdk.assertions.Template.fromStack(stack);
  template.hasResourceProperties("AWS::Lambda::Function", {
    Code: { ZipFile: "export function handler() { return 'HELLO WORLD'; }" },
    Handler: "index.handler",
    Runtime: cdk.aws_lambda.Runtime.NODEJS_14_X.name,
  });
});

test("[synth] waits and synthesizes", async () => {
  const app = new cdk.App();
  const stack = new cdk.Stack(app, "Test");
  new Function(stack, "RaceCondition", {
    code: cdk.aws_lambda.Code.fromInline(
      "export function handler() { return 'HELLO WORLD'; }",
    ),
    handler: "index.handler",
    runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
  });

  await synth(app);

  const template = cdk.assertions.Template.fromStack(stack);
  template.hasResourceProperties("AWS::Lambda::Function", {
    Code: { ZipFile: "export function handler() { return 'HELLO WORLD'; }" },
    Handler: "index.handler",
    Runtime: cdk.aws_lambda.Runtime.NODEJS_14_X.name,
  });
});
