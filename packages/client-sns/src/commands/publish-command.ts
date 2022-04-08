import {
  PublishCommand as BaseCommand,
  PublishCommandInput as BaseCommandInput,
  PublishCommandOutput as BaseCommandOutput,
  SNSClientResolvedConfig as ResolvedConfiguration,
} from "@aws-sdk/client-sns"
import { Command } from "@aws-sdk/smithy-client"
import { MiddlewareStack } from "@aws-sdk/types"

import { aws_sns } from "@cloudy-ts/cdk"
import { ServiceInputTypes, ServiceOutputTypes } from "../sns-client"

export type PublishCommandInput<TopicArnType = aws_sns.TopicArn> = Omit<
  BaseCommandInput,
  | "TopicArn"
  | "Message"
  | "MessageGroupId"
  | "MessageDeduplicationId"
  | "MessageAttributes"
> &
  TopicArnType extends aws_sns.TopicArn<
  infer Message,
  infer MessageGroupId,
  infer MessageDeduplicationId,
  infer MessageAttributes,
  infer Fifo
>
  ? {
      TopicArn: TopicArnType
      Message: Message
      // MessageAttributes: MessageAttributes
    } & (Fifo extends true
      ? {
          MessageGroupId: MessageGroupId
          MessageDeduplicationId: MessageDeduplicationId
        }
      : {}) &
      (MessageAttributes extends undefined
        ? {}
        : {
            MessageAttributes: MessageAttributes
          })
  : never

export interface PublishCommandOutput extends BaseCommandOutput {}

export class PublishCommand<
  TopicArnType extends aws_sns.TopicArn<string, string, string, any>,
> implements
    Command<BaseCommandInput, BaseCommandOutput, ResolvedConfiguration>
{
  private readonly command: BaseCommand

  constructor(readonly input: PublishCommandInput<TopicArnType>) {
    this.command = new BaseCommand(input as unknown as BaseCommandInput)
  }

  get middlewareStack(): MiddlewareStack<BaseCommandInput, BaseCommandOutput> {
    return this.command.middlewareStack as any
  }

  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: ResolvedConfiguration,
  ) {
    return this.command.resolveMiddleware(clientStack as any, configuration)
  }
}
