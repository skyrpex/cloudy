import {
  SNSClient as BaseClient,
  SNSClientConfig as BaseClientConfiguration,
  SNSClientResolvedConfig as BaseClientResolvedConfiguration,
  ServiceInputTypes as BaseServiceInputTypes,
  ServiceOutputTypes as BaseServiceOutputTypes,
} from "@aws-sdk/client-sns";
import { Client } from "@aws-sdk/smithy-client";
import { Command, HttpHandlerOptions } from "@aws-sdk/types";

import { PublishCommandInput, PublishCommandOutput } from "./commands/index.js";

export type ServiceInputTypes = PublishCommandInput | BaseServiceInputTypes;
export type ServiceOutputTypes = PublishCommandOutput | BaseServiceOutputTypes;

type IClient = Client<
  HttpHandlerOptions,
  ServiceInputTypes,
  ServiceOutputTypes,
  BaseClientResolvedConfiguration
>;

export class SNSClient implements IClient {
  private client: IClient | undefined;

  constructor(readonly configuration: BaseClientConfiguration) {}

  private resolveClient() {
    this.client = this.client ?? new BaseClient(this.configuration);
    return this.client;
  }

  get config() {
    return this.resolveClient().config;
  }

  get middlewareStack() {
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
