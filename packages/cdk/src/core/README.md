# Async Synth Hacks

## Patch cdk.App

Patch the cdk.App.synth method whenever an async dependency is created. The synth method will crash unless all of the dependencies are resolved. Also, expose a method to wait for all of the dependencies.

Pros:

- Is not intrusive. It doesn't require any code changes if `app.synth()` is not called manually

Cons:

- Patching the cdk.App (using `Object.assign(app, { synth() {...} })`) is hacky

Example:

```ts
import * as cloudy from "@cloudy-ts/cdk";
import * as cdk from "aws-cdk-lib";
const app = new cdk.App();
const stack = new cdk.Stack(app, "Test");
new cloudy.aws_lambda.Function(stack, "Function", {
  code: new Promise((resolve) => {
    setTimeout(
      () =>
        cdk.aws_lambda.Code.fromInline(
          "export function handler() { return 'HELLO WORLD'; }",
        ),
      1000,
    );
  }),
  handler: "index.handler",
  runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
});
await cloudy.waitForAsyncDependencies(app);
app.synth();
```

## Provide custom cloudy.App

Provide cloudy.App, which extends cdk.App. The code will crash if a cloudy.aws_lambda.Function is created on an application that is not a cloudy.App.

Pros:

- Safer than patching the cdk.App
- Could work on other languages through JSII

Cons:

- Intrusive. Requires the users to change the app type

Example:

```ts
import * as cloudy from "@cloudy-ts/cdk";
import * as cdk from "aws-cdk-lib";
const app = new cloudy.App();
const stack = new cdk.Stack(app, "Test");
new cloudy.aws_lambda.Function(stack, "Function", {
  code: new Promise((resolve) => {
    setTimeout(
      () =>
        cdk.aws_lambda.Code.fromInline(
          "export function handler() { return 'HELLO WORLD'; }",
        ),
      1000,
    );
  }),
  handler: "index.handler",
  runtime: cdk.aws_lambda.Runtime.NODEJS_14_X,
});
// Either...
await app.waitForAsyncDependencies();
app.synth();
// ...or: await app.asyncSynth();
// ...or: await app.waitAndSynth();
// ...or: await app.synthAfterDependencies();
```
