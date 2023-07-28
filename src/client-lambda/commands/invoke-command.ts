import {
  InvokeCommand as BaseCommand,
  InvokeCommandInput as BaseCommandInput,
  InvokeCommandOutput as BaseCommandOutput,
  LambdaClientResolvedConfig as ResolvedConfiguration,
} from "@aws-sdk/client-lambda";

import { Handler, MiddlewareStack } from "@aws-sdk/types";
import { Command } from "@smithy/smithy-client";
import {
  CallbackFunction,
  FunctionName,
} from "../../aws-lambda/callback-function.js";
import {
  JsonEncoded,
  JsonSerializable,
  jsonEncode,
} from "../../codec-json/index.js";
import { staticTest } from "../../static-test.js";
import {
  LambdaClient,
  ServiceInputTypes,
  ServiceOutputTypes,
} from "../lambda-client.js";

export type InvokeCommandInput<
  InputType extends JsonSerializable = JsonSerializable,
  OutputType = any,
> = Omit<BaseCommandInput, "FunctionName" | "Payload"> & {
  FunctionName: FunctionName<InputType, OutputType>;
  Payload: JsonEncoded<InputType>;
};

export interface InvokeCommandOutput extends BaseCommandOutput {}

export class InvokeCommand<InputType extends JsonSerializable, OutputType>
  implements
    Command<BaseCommandInput, BaseCommandOutput, ResolvedConfiguration>
{
  declare input: any;
  declare middlewareStack: any;
  declare resolveMiddleware: any;
  constructor(input: InvokeCommandInput<InputType, OutputType>) {
    return new BaseCommand(input);
  }
}

staticTest(
  async (
    function_: CallbackFunction<{ name: string; age: number }, {}>,
    client: LambdaClient,
  ) => {
    await client.send(
      new InvokeCommand({
        FunctionName: function_.functionName,
        Payload: jsonEncode({
          name: "Cristian",
          age: 34,
        }),
      }),
    );
  },
);
