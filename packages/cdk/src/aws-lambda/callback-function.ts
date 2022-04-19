import {
  CfnFunction,
  Code,
  Function,
  FunctionProps,
  Runtime,
  verifyCodeConfig,
} from "aws-cdk-lib/aws-lambda";
import { type Context } from "aws-lambda";
import { Construct } from "constructs";

import { codeFromFunction } from "./code-from-function.js";
import { IEventSource } from "./event-source.js";
import { IFunction } from "./function-base.js";

export interface CallbackFunctionProperties<InputType, OutputType>
  extends Omit<FunctionProps, "code" | "handler" | "runtime" | "events"> {
  handler: (input: InputType, context: Context) => Promise<OutputType>;

  /**
   * Event sources for this function.
   *
   * You can also add event sources using `addEventSource`.
   *
   * @default - No event sources.
   */
  events?: IEventSource<InputType>[];
}

export class CallbackFunction<InputType, OutputType>
  extends Function
  implements IFunction<InputType, OutputType>
{
  constructor(
    scope: Construct,
    id: string,
    properties: CallbackFunctionProperties<InputType, OutputType>,
  ) {
    super(scope, id, {
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

    codeFromFunction(properties.handler).then(({ code, tokens }) => {
      const codeConfig = code.bind(this);
      verifyCodeConfig(codeConfig, {
        ...properties,
        code,
        handler: "index.handler",
        runtime: Runtime.NODEJS_14_X,
      });

      resource.code = {
        s3Bucket: codeConfig.s3Location?.bucketName,
        s3Key: codeConfig.s3Location?.objectKey,
        s3ObjectVersion: codeConfig.s3Location?.objectVersion,
        // zipFile: codeConfig.inlineCode,
        // imageUri: codeConfig.image?.imageUri,
      };
      code.bindToResource(resource);

      for (const { construct, cfnToken, hash } of tokens) {
        this.node.addDependency(construct);
        this.addEnvironment(hash, cfnToken);
      }
    });
  }
}
