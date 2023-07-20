# Async Synth Hacks

In order to avoid race conditions with `cloudy.aws_lambda.Function` code promise resolutions, we must make the `app.synth()` call fail if these promises aren't fulfilled. In order to do, I can think of two ways:

- [Patch cdk.App](#patch-cdkapp)
- [Provide custom cloudy.App](#provide-custom-cloudyapp)

## Patch cdk.App

Patch the cdk.App.synth method whenever an async dependency is created. The synth method will crash unless all of the dependencies are resolved. Also, expose a method to wait for all of the dependencies.

When the app is patched, a dependency context is attached to it using a unique symbol.

Pros:

- Is not intrusive. It doesn't require any code changes (if `app.synth()` is not called manually)

Cons:

- Patching the `cdk.App`'s `synth` method (using `Object.assign(app, { synth() {...} })`) is hacky

Example:

```ts
import * as cloudy from "cloudy-cdk-lib";
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
  runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
});
// Must call the following before synth.
await cloudy.waitForAsyncDependencies(app);
app.synth();
// ...or maybe: await cloudy.synth(app);
```

## Provide custom cloudy.App

Provide `cloudy.App`, which extends `cdk.App`. The code will throw if a `cloudy.aws_lambda.Function` is created on an application that is not a `cloudy.App`.

Pros:

- Safer than patching the `cdk.App`

Cons:

- Requires the users to change the app type

Example:

```ts
import * as cloudy from "cloudy-cdk-lib";
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
  runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
});
// Either...
await app.waitForAsyncDependencies();
app.synth();
// ...or maybe: await cloudy.synth(app);
// ...or: await app.asyncSynth();
// ...or: await app.waitAndSynth();
// ...or: await app.synthAfterDependencies();
```

## Other Thoughts

Either way, we could also provide helpers for testing. For example, instead of:

```ts
import * as cdk from "aws-cdk-lib";
const app = new cdk.App();
const stack = new cdk.Stack(app, "Stack");
const template = cdk.assertions.Template.fromStack(stack);
template.hasResourceProperties("AWS::Lambda::Function", {
  Handler: "index.handler",
  Runtime: cdk.aws_lambda.Runtime.NODEJS_18_X.name,
});
```

We could use a promisified method:

```ts
import * as cloudy from "cloudy-cdk-lib";
import * as cdk from "aws-cdk-lib";
const app = new cdk.App();
const stack = new cdk.Stack(app, "Stack");
// Waits for dependencies and synthesizes.
const template = await cloudy.assertions.Template.fromStack(stack);
template.hasResourceProperties("AWS::Lambda::Function", {
  Handler: "index.handler",
  Runtime: cdk.aws_lambda.Runtime.NODEJS_18_X.name,
});
```
