import assert from "node:assert";

// import { Stack, App } from "aws-cdk-lib";
// import * as assertions from "aws-cdk-lib/assertions";
import * as cdk from "aws-cdk-lib";

import { waitForAsyncDependencies } from "../core/async-dependencies.js";

/**
 * Suite of assertions that can be run on a CDK stack.
 * Typically used, as part of unit tests, to validate that the rendered
 * CloudFormation template has expected resources and properties.
 *
 * @see {@link cdk.assertions.Template}
 */
// eslint-disable-next-line unicorn/no-static-only-class
export class Template {
  /**
   * Base your assertions on the CloudFormation template synthesized by a CDK `Stack`.
   * @param stack the CDK Stack to run assertions on
   * @see {@link cdk.assertions.Template}
   */
  static async fromStack(stack: cdk.Stack): Promise<cdk.assertions.Template> {
    const app = stack.node.root;
    assert(app instanceof cdk.App);
    await waitForAsyncDependencies(app);
    return cdk.assertions.Template.fromStack(stack);
  }

  /**
   * Base your assertions from an existing CloudFormation template formatted as an in-memory
   * JSON object.
   * @param template the CloudFormation template formatted as a nested set of records
   * @see {@link cdk.assertions.Template}
   */
  static fromJSON(template: { [key: string]: any }): cdk.assertions.Template {
    return cdk.assertions.Template.fromJSON(template);
  }

  /**
   * Base your assertions from an existing CloudFormation template formatted as a
   * JSON string.
   * @param template the CloudFormation template in
   * @see {@link cdk.assertions.Template}
   */
  static fromString(template: string): cdk.assertions.Template {
    return cdk.assertions.Template.fromString(template);
  }
}
