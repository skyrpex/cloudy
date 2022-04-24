import {
  PublishBatchCommand as BaseCommand,
  PublishBatchCommandInput as BaseCommandInput,
  PublishBatchCommandOutput as BaseCommandOutput,
  SNSClientResolvedConfig as ResolvedConfiguration,
  // PublishBatchRequestEntry as BasePublishBatchRequestEntry,
} from "@aws-sdk/client-sns";
import { Command } from "@aws-sdk/smithy-client";
import { Handler, MiddlewareStack } from "@aws-sdk/types";
import { aws_sns, OpaqueType, ValueType } from "@cloudy-ts/cdk";
// import { CommandProxy } from "@cloudy-ts/util-command-proxy";

import { ServiceInputTypes, ServiceOutputTypes } from "../sns-client.js";
import { staticTest } from "../static-test.js";

export type PublishBatchRequestEntry<
  T extends aws_sns.MaterializedTopicProps,
  // > = BasePublishBatchRequestEntry & {
> = {
  Id: string;
  Message: T["message"];
} & (T["messageGroupId"] extends never
  ? {}
  : {
      MessageGroupId: T["messageGroupId"];
    }) &
  (T["messageDeduplicationId"] extends never
    ? {}
    : {
        MessageDeduplicationId: T["messageDeduplicationId"];
      }) &
  (T["messageAttributes"] extends never
    ? {}
    : {
        MessageAttributes: T["messageAttributes"];
      });

export type PublishBatchCommandInput<
  T extends aws_sns.MaterializedTopicProps = aws_sns.MaterializedTopicProps,
> = Omit<BaseCommandInput, "TopicArn" | "PublishBatchRequestEntries"> & {
  TopicArn: aws_sns.TopicArn<T>;
  PublishBatchRequestEntries: PublishBatchRequestEntry<T>[];
};

export interface PublishBatchCommandOutput extends BaseCommandOutput {}

export class PublishBatchCommand<T extends aws_sns.MaterializedTopicProps>
  implements
    Command<BaseCommandInput, BaseCommandOutput, ResolvedConfiguration>
{
  private readonly command: BaseCommand;

  constructor(input: PublishBatchCommandInput<T>) {
    this.command = new BaseCommand(input as unknown as BaseCommandInput);
  }

  get input(): BaseCommandInput {
    return this.command.input;
  }

  get middlewareStack(): MiddlewareStack<BaseCommandInput, BaseCommandOutput> {
    return this.command.middlewareStack;
  }

  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: ResolvedConfiguration,
    options: any,
  ): Handler<BaseCommandInput, BaseCommandOutput> {
    return this.command.resolveMiddleware(clientStack, configuration, options);
  }
}

staticTest((topic: aws_sns.Topic<{}>) => {
  new PublishBatchCommand({
    TopicArn: topic.topicArn,
    PublishBatchRequestEntries: [{ Id: "", Message: "" }],
  });
  new PublishBatchCommand({
    TopicArn: topic.topicArn,
    PublishBatchRequestEntries: [
      {
        Id: "",
        Message: "",
        // @ts-expect-error: MessageGroupId and MessageDeduplicationId are forbidden.
        MessageGroupId: "",
        MessageDeduplicationId: "",
      },
    ],
  });
});

staticTest((topic: aws_sns.Topic<{ fifo: true }>) => {
  new PublishBatchCommand({
    TopicArn: topic.topicArn,
    PublishBatchRequestEntries: [
      {
        Id: "",
        Message: "",
        MessageGroupId: "",
        MessageDeduplicationId: "",
      },
    ],
  });
  new PublishBatchCommand({
    TopicArn: topic.topicArn,
    PublishBatchRequestEntries: [
      // @ts-expect-error: MessageGroupId and MessageDeduplicationId are required.
      {
        Message: "",
      },
    ],
  });
});

type MyString = OpaqueType<string, { readonly t: unique symbol }>;
staticTest((topic: aws_sns.Topic<{ messageType: ValueType<MyString> }>) => {
  new PublishBatchCommand({
    TopicArn: topic.topicArn,
    PublishBatchRequestEntries: [{ Id: "", Message: "" as MyString }],
  });
  new PublishBatchCommand({
    TopicArn: topic.topicArn,
    // @ts-expect-error: Message must be of type MyString.
    PublishBatchRequestEntries: [{ Id: "", Message: "" }],
  });
});

staticTest(
  (
    topic: aws_sns.Topic<{
      messageAttributesType: {
        userId: { DataType: "String"; StringValue: ValueType<"test"> };
      };
    }>,
  ) => {
    new PublishBatchCommand({
      TopicArn: topic.topicArn,
      PublishBatchRequestEntries: [
        {
          Id: "",
          Message: "",
          MessageAttributes: {
            userId: { DataType: "String", StringValue: "test" },
          },
        },
      ],
    });
    new PublishBatchCommand({
      TopicArn: topic.topicArn,
      PublishBatchRequestEntries: [
        // @ts-expect-error: MessageAttributes are required.
        { Id: "", Message: "" },
      ],
    });
  },
);
