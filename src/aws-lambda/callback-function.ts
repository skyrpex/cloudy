import { Runtime } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

/**
 * {@link Handler} context parameter.
 * See {@link https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html AWS documentation}.
 */
// Would prefer to use the "aws-lambda" package, but it fails to build the
// types when using unbuild.
export interface Context {
  callbackWaitsForEmptyEventLoop: boolean;
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;

  getRemainingTimeInMillis(): number;
}

import { codeFromFunction } from "./code-from-function.js";
import { IEventSource } from "./event-source.js";
import { IFunction } from "./function-base.js";
import { FunctionProps, Function } from "./function.js";
import { OpaqueType } from "../opaque-type/index.js";

export type FunctionName<InputType, OutputType> = OpaqueType<
  string,
  { readonly t: unique symbol; readonly i: InputType; readonly o: OutputType }
>;

export interface CallbackFunctionProps<InputType, OutputType>
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

const runtime = Runtime.NODEJS_18_X;

export class CallbackFunction<InputType, OutputType>
  extends Function
  implements IFunction<InputType, OutputType>
{
  /**
   * Name of this function.
   */
  public declare readonly functionName: FunctionName<InputType, OutputType>;

  constructor(
    scope: Construct,
    id: string,
    properties: CallbackFunctionProps<InputType, OutputType>,
  ) {
    const code = codeFromFunction(properties.handler);

    super(scope, id, {
      code: code.then((value) => value.code),
      handler,
      runtime,
    });

    code
      .then(({ tokens }) => {
        for (const { construct, cfnToken, hash } of tokens) {
          this.node.addDependency(construct);
          this.addEnvironment(hash, cfnToken);
        }
      })
      .catch((error) => {
        throw error;
      });
  }
}
