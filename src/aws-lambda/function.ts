import assert from "node:assert";

import {
  CfnFunction,
  Code,
  Function as BaseFunction,
  FunctionProps as BaseFunctionProps,
  Runtime,
  verifyCodeConfig,
} from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

import { AsyncDependenciesContext } from "../core/index.js";

export interface FunctionProps extends Omit<BaseFunctionProps, "code"> {
  /**
   * The source code of your Lambda function. You can point to a file in an
   * Amazon Simple Storage Service (Amazon S3) bucket or specify your source
   * code as inline text.
   */
  code: Code | Promise<Code>;
}

/**
 * Deploys a file from inside the construct library as a function.
 *
 * The supplied file is subject to the 4096 bytes limit of being embedded in a
 * CloudFormation template.
 *
 * The construct includes an associated role with the lambda.
 *
 * This construct does not yet reproduce all features from the underlying resource
 * library.
 */
export class Function extends BaseFunction {
  constructor(scope: Construct, id: string, properties: FunctionProps) {
    super(scope, id, {
      ...properties,
      // Use a dummy code object until we can get the code from the properties.
      code: Code.fromInline(" "),
      handler: "index.handler",
      runtime: Runtime.NODEJS_18_X,
    });

    const promise = Promise.resolve(properties.code).then((code) => {
      const codeConfig = code.bind(this);
      verifyCodeConfig(codeConfig, {
        ...properties,
        code,
      });

      const resource = this.node.children.find(
        (children): children is CfnFunction => children instanceof CfnFunction,
      );
      assert(resource, "Could not find resource [CfnFunction]");

      resource.code = {
        s3Bucket: codeConfig.s3Location?.bucketName,
        s3Key: codeConfig.s3Location?.objectKey,
        s3ObjectVersion: codeConfig.s3Location?.objectVersion,
        zipFile: codeConfig.inlineCode,
        imageUri: codeConfig.image?.imageUri,
      };
      code.bindToResource(resource);
    });

    const appDependencies = AsyncDependenciesContext.of(scope);
    appDependencies.addAsyncDependency(promise);

    let codeIsResolved = false;
    let codeFailure: unknown | undefined;
    promise
      .catch((error) => {
        codeFailure = error;
      })
      .finally(() => {
        codeIsResolved = true;
      });
    this.node.addValidation({
      validate() {
        if (!codeIsResolved) {
          return [
            "The code property must be resolved before the function can be deployed. Try calling `await cloudy.waitForAsyncDependencies(app)` before synthesizing, or `await cloudy.synth(app)`.",
          ];
        }

        if (codeFailure) {
          if (codeFailure instanceof Error) {
            return [codeFailure.message];
          }

          if (typeof codeFailure === "string") {
            return [codeFailure];
          }

          return ["Unknown error while resolving code."];
        }

        return [];
      },
    });
  }
}

// function isPromise<T, S>(value: PromiseLike<T> | S): value is PromiseLike<T> {
//   return !!value && (typeof value === 'object' || typeof value === 'function') && typeof (value as any).then === 'function';
// }

// function toPromise(value: Code | PromiseLike<Code>): Promise<Code> {
//   if (isPromise(value)) {
//     return value as Promise<Code>;
//   }

//   return Promise.resolve(value);
// }
