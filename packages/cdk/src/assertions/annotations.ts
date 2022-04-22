import assert from "node:assert";

import * as cdk from "aws-cdk-lib";

import * as cloudy from "../../src/index.js";

/**
 * Suite of assertions that can be run on a CDK Stack.
 * Focused on asserting annotations.
 *
 * @see {@link cdk.assertions.Annotations}
 */
// eslint-disable-next-line unicorn/no-static-only-class
export class Annotations {
  /**
   * Base your assertions on the messages returned by a synthesized CDK `Stack`.
   * @param stack the CDK Stack to run assertions on
   * @see {@link cdk.assertions.Annotations}
   */
  static async fromStack(
    stack: cdk.Stack,
  ): Promise<cdk.assertions.Annotations> {
    const app = stack.node.root;
    assert(app instanceof cdk.App);
    await cloudy.waitForAsyncDependencies(app);
    return cdk.assertions.Annotations.fromStack(stack);
  }
}
