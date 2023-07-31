import {
  InvokeCommand as BaseCommand,
  InvokeCommandInput as BaseCommandInput,
  InvokeCommandOutput as BaseCommandOutput,
  LambdaClientResolvedConfig as ResolvedConfiguration,
} from "@aws-sdk/client-lambda";

import { Command } from "@smithy/smithy-client";
import { NoInfer } from "ts-toolbelt/out/Function/NoInfer.js";
import { FunctionName } from "../../aws-lambda/callback-function.js";
import { JsonEncoded, JsonSerializable } from "../../codec-json/index.js";

export type InvokeCommandInput<
  InputType extends JsonSerializable,
  OutputType extends JsonSerializable,
> = {
  FunctionName: FunctionName<InputType, OutputType>;
  Payload: JsonEncoded<NoInfer<InputType>>;
};

export interface InvokeCommandOutput extends BaseCommandOutput {}

export class InvokeCommand<
  InputType extends JsonSerializable,
  OutputType extends JsonSerializable,
> implements
    Command<BaseCommandInput, BaseCommandOutput, ResolvedConfiguration>
{
  declare input: any;
  declare middlewareStack: any;
  declare resolveMiddleware: any;
  constructor(input: InvokeCommandInput<InputType, OutputType>) {
    return new BaseCommand(input as unknown as any);
  }
}
