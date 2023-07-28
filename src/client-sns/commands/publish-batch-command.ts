import {
  PublishBatchCommand as BaseCommand,
  PublishBatchCommandInput as BaseCommandInput,
  PublishBatchCommandOutput as BaseCommandOutput,
  SNSClientResolvedConfig as ResolvedConfiguration,
} from "@aws-sdk/client-sns";

import { Command } from "@smithy/smithy-client";
import { Handler, MiddlewareStack } from "@aws-sdk/types";
import { aws_sns, ValueType } from "../../index.js";
import { OpaqueType } from "../../opaque-type/index.js";
import { staticTest } from "../../static-test.js";
import { ServiceInputTypes, ServiceOutputTypes } from "../sns-client.js";

export type PublishBatchRequestEntry<T extends aws_sns.MaterializedTopicProps> =
  {
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
  input: any;
  middlewareStack: any;
  // @ts-expect-error
  resolveMiddleware: (
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: ResolvedConfiguration,
    options: any,
  ) => Handler<BaseCommandInput, BaseCommandOutput>;
  constructor(input: PublishBatchCommandInput<T>) {
    return new BaseCommand(input as unknown as BaseCommandInput);
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
