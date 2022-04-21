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
  /**
     * The function that Lambda calls. The function serialization captures any variables captured by the function body and serializes those values into the generated text along with the function body. This process is recursive, so that functions referenced by the body of the serialized function will themselves be serialized as well. This process also deeply serializes captured object values, including prototype chains and property descriptors, such that the semantics of the function when deserialized should match the original function.

     * There are several known limitations:

     * - If a native function is captured either directly or indirectly, closure serialization will return an error.
     * - Captured values will be serialized based on their values at the time that serializeFunction is called. Mutations to these values after that (but before the deserialized function is used) will not be observed by the deserialized function.
     */
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

const handler = "index.handler";

const runtime = Runtime.NODEJS_14_X;

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
      handler,
      runtime,
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
        handler,
        runtime,
      });

      resource.code = {
        s3Bucket: codeConfig.s3Location?.bucketName,
        s3Key: codeConfig.s3Location?.objectKey,
        s3ObjectVersion: codeConfig.s3Location?.objectVersion,
        zipFile: codeConfig.inlineCode,
        imageUri: codeConfig.image?.imageUri,
      };
      code.bindToResource(resource);

      for (const { construct, cfnToken, hash } of tokens) {
        this.node.addDependency(construct);
        this.addEnvironment(hash, cfnToken);
      }
    });
  }
}
