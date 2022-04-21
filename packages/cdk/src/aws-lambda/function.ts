import {
  CfnFunction,
  Code,
  Function as BaseFunction,
  FunctionProps,
  Runtime,
  verifyCodeConfig,
} from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

export interface FunctionProperties extends Omit<FunctionProps, "code"> {
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
  constructor(scope: Construct, id: string, properties: FunctionProperties) {
    super(scope, id, {
      ...properties,
      code: Code.fromInline("export function handler() {}"),
      handler: "index.handler",
      runtime: Runtime.NODEJS_14_X,
    });

    const resource = this.node.children.find(
      (children): children is CfnFunction => children instanceof CfnFunction,
    );
    if (!resource) {
      throw new Error("Resource [CfnFunction] not found");
    }

    Promise.resolve(properties.code).then((code) => {
      const codeConfig = code.bind(this);
      verifyCodeConfig(codeConfig, {
        ...properties,
        code,
      });

      resource.code = {
        s3Bucket: codeConfig.s3Location?.bucketName,
        s3Key: codeConfig.s3Location?.objectKey,
        s3ObjectVersion: codeConfig.s3Location?.objectVersion,
        zipFile: codeConfig.inlineCode,
        imageUri: codeConfig.image?.imageUri,
      };
      code.bindToResource(resource);
    });
  }
}
