import {
  InvokeCommand as BaseCommand,
  InvokeCommandInput as BaseCommandInput,
  InvokeCommandOutput as BaseCommandOutput,
  LambdaClientResolvedConfig as ResolvedConfiguration,
} from "@aws-sdk/client-lambda";

import { Command } from "@smithy/smithy-client";
import { FunctionName } from "../../aws-lambda/callback-function.js";
import { JsonEncoded, JsonSerializable } from "../../codec-json/index.js";

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
