import {
  PublishCommand as BaseCommand,
  PublishCommandInput as BaseCommandInput,
  PublishCommandOutput as BaseCommandOutput,
  SNSClientResolvedConfig as ResolvedConfiguration,
} from "@aws-sdk/client-sns";
import { Command } from "@aws-sdk/smithy-client";
import { MiddlewareStack } from "@aws-sdk/types";

import { aws_sns, OpaqueType } from "@cloudy-ts/cdk";

import { ServiceInputTypes, ServiceOutputTypes } from "../sns-client.js";
import { staticTest } from "../static-test.js";

// /**
//  * Returns the `T` in `ValueType<T>`, even if it's nested in a record.
//  */
// type MapValueType<T> = T extends aws_sns.ValueType<infer V>
//   ? V
//   : T extends { [name: string]: any }
//   ? { [name in keyof T]: MapValueType<T[name]> }
//   : T;

// /**
//  * Maps the value types of `Object[ObjectKey]` to
//  * `{ [DestinationKey]: Object[ObjectKey] }`, if the value of
//  * `Object[ObjectKey]` is not undefined. If it's undefined, the returned value
//  * will be `Fallback`.
//  */
// type MapValueTypeWithFallback<
//   DestinationKey extends string,
//   Object,
//   ObjectKey extends keyof Object,
//   Fallback = {},
// > = Object extends {
//   [name in ObjectKey]: infer Value;
// }
//   ? Value extends undefined
//     ? Fallback
//     : MapValueType<{ [name in DestinationKey]: Value }>
//   : Fallback;

export type PublishCommandInput<T extends aws_sns.MaterializedTopicProperties> =
  Omit<
    BaseCommandInput,
    | "TopicArn"
    | "Message"
    | "MessageGroupId"
    | "MessageDeduplicationId"
    | "MessageAttributes"
  > & {
    TopicArn: aws_sns.TopicArn<T>;
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

export class PublishCommand<T extends aws_sns.MaterializedTopicProperties>
  implements
    Command<BaseCommandInput, BaseCommandOutput, ResolvedConfiguration>
{
  private readonly command: BaseCommand;

  constructor(readonly input: PublishCommandInput<T>) {
    this.command = new BaseCommand(input as unknown as BaseCommandInput);
  }

  get middlewareStack(): MiddlewareStack<BaseCommandInput, BaseCommandOutput> {
    return this.command.middlewareStack as any;
  }

  resolveMiddleware(
    clientStack: MiddlewareStack<ServiceInputTypes, ServiceOutputTypes>,
    configuration: ResolvedConfiguration,
  ) {
    return this.command.resolveMiddleware(clientStack as any, configuration);
  }
}

staticTest((topic: aws_sns.Topic<{}>) => {
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

staticTest((topic: aws_sns.Topic<{ fifo: true }>) => {
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
staticTest(
  (topic: aws_sns.Topic<{ messageType: aws_sns.ValueType<MyString> }>) => {
    new PublishCommand({
      TopicArn: topic.topicArn,
      Message: "" as MyString,
    });
    new PublishCommand({
      TopicArn: topic.topicArn,
      // @ts-expect-error: Message must be of type MyString.
      Message: "",
    });
  },
);

staticTest(
  (
    topic: aws_sns.Topic<{
      messageAttributesType: {
        userId: { DataType: "String"; StringValue: aws_sns.ValueType<"test"> };
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
