import {
  LambdaClient as BaseClient,
  LambdaClientConfig as BaseClientConfiguration,
  LambdaClientResolvedConfig as BaseClientResolvedConfiguration,
  ServiceInputTypes as BaseServiceInputTypes,
  ServiceOutputTypes as BaseServiceOutputTypes,
} from "@aws-sdk/client-lambda";
import { Command, HttpHandlerOptions, MiddlewareStack } from "@aws-sdk/types";
import { Client } from "@smithy/smithy-client";

import { InvokeCommandInput, InvokeCommandOutput } from "./commands/index.js";

export type ServiceInputTypes = InvokeCommandInput | BaseServiceInputTypes;
export type ServiceOutputTypes = InvokeCommandOutput | BaseServiceOutputTypes;

type IClient = Client<
  HttpHandlerOptions,
  ServiceInputTypes,
  ServiceOutputTypes,
  BaseClientResolvedConfiguration
>;

/**
 * A client for AWS Lambda.
 * @see {@link BaseClient LambdaClient from "@aws-sdk/client-lambda"}
 */
export class LambdaClient implements IClient {
  private client: IClient | undefined;

  constructor(readonly configuration: BaseClientConfiguration) {}

  private resolveClient() {
    this.client = this.client ?? new BaseClient(this.configuration);
    return this.client;
  }

  get config() {
    return this.resolveClient().config;
  }

  get middlewareStack(): MiddlewareStack<
    ServiceInputTypes,
    ServiceOutputTypes
  > {
    return this.resolveClient().middlewareStack;
  }

  send<
    InputType extends ServiceInputTypes,
    OutputType extends ServiceOutputTypes,
  >(
    command: Command<
      ServiceInputTypes,
      InputType,
      ServiceOutputTypes,
      OutputType,
      BaseClientResolvedConfiguration
    >,
    options?: HttpHandlerOptions,
  ): Promise<OutputType>;
  send<
    InputType extends ServiceInputTypes,
    OutputType extends ServiceOutputTypes,
  >(
    command: Command<
      ServiceInputTypes,
      InputType,
      ServiceOutputTypes,
      OutputType,
      BaseClientResolvedConfiguration
    >,
    callback: (error: any, data?: OutputType) => void,
  ): void;
  send<
    InputType extends ServiceInputTypes,
    OutputType extends ServiceOutputTypes,
  >(
    command: Command<
      ServiceInputTypes,
      InputType,
      ServiceOutputTypes,
      OutputType,
      BaseClientResolvedConfiguration
    >,
    options: HttpHandlerOptions,
    callback: (error: any, data?: OutputType) => void,
  ): void;
  send<
    InputType extends ServiceInputTypes,
    OutputType extends ServiceOutputTypes,
  >(command: any, options?: any, callback?: any): void | Promise<OutputType> {
    return this.resolveClient().send(command, options, callback);
  }

  destroy(): void {
    this.resolveClient().destroy();
  }
}
