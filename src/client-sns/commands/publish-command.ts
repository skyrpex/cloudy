import {
  PublishCommand as BaseCommand,
  PublishCommandInput as BaseCommandInput,
  PublishCommandOutput as BaseCommandOutput,
  SNSClientResolvedConfig as ResolvedConfiguration,
} from "@aws-sdk/client-sns";

import { Handler, MiddlewareStack } from "@aws-sdk/types";
import { Command } from "@smithy/smithy-client";
import {
  MaterializedTopicProps as MaterializedTopicProps,
  Topic,
  TopicArn,
} from "../../aws-sns/topic.js";
import { ValueType } from "../../core/value-type.js";
import { OpaqueType } from "../../opaque-type/index.js";
import { staticTest } from "../../static-test.js";
import { ServiceInputTypes, ServiceOutputTypes } from "../sns-client.js";

export type PublishCommandInput<
  T extends MaterializedTopicProps = MaterializedTopicProps,
> = Omit<
  BaseCommandInput,
  | "TopicArn"
  | "Message"
  | "MessageGroupId"
  | "MessageDeduplicationId"
  | "MessageAttributes"
> & {
  TopicArn: TopicArn<T>;
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

export interface PublishCommandOutput extends BaseCommandOutput {}

export class PublishCommand<T extends MaterializedTopicProps>
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
  constructor(input: PublishCommandInput<T>) {
    return new BaseCommand(input);
  }
}

staticTest((topic: Topic<{}>) => {
  new PublishCommand({
    TopicArn: topic.topicArn,
    Message: "",
  });
  new PublishCommand({
    TopicArn: topic.topicArn,
    Message: "",
    // @ts-expect-error: MessageGroupId and MessageDeduplicationId are forbidden.
    MessageGroupId: "",
    MessageDeduplicationId: "",
  });
});

staticTest((topic: Topic<{ fifo: true }>) => {
  new PublishCommand({
    TopicArn: topic.topicArn,
    Message: "",
    MessageGroupId: "",
    MessageDeduplicationId: "",
  });
  // @ts-expect-error: MessageGroupId and MessageDeduplicationId are required.
  new PublishCommand({
    TopicArn: topic.topicArn,
    Message: "",
  });
});

type MyString = OpaqueType<string, { readonly t: unique symbol }>;
staticTest((topic: Topic<{ messageType: ValueType<MyString> }>) => {
  new PublishCommand({
    TopicArn: topic.topicArn,
    Message: "" as MyString,
  });
  new PublishCommand({
    TopicArn: topic.topicArn,
    // @ts-expect-error: Message must be of type MyString.
    Message: "",
  });
});

staticTest(
  (
    topic: Topic<{
      messageAttributesType: {
        userId: { DataType: "String"; StringValue: ValueType<"test"> };
      };
    }>,
  ) => {
    new PublishCommand({
      TopicArn: topic.topicArn,
      Message: "",
      MessageAttributes: {
        userId: { DataType: "String", StringValue: "test" },
      },
    });
    // @ts-expect-error: MessageAttributes are required.
    new PublishCommand({
      TopicArn: topic.topicArn,
      Message: "",
    });
  },
);
