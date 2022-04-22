import { OpaqueType } from "@cloudy-ts/opaque-type";
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { F } from "ts-toolbelt";

import { ValueType } from "../core/value-type.js";
import { ITopicSubscription } from "./subscription.js";

type MessageAttribute =
  | {
      DataType: "String" | "Number" | "String.Array";
      StringValue: ValueType<string>;
    }
  | {
      DataType: "Binary";
      BinaryValue: ValueType<Uint8Array>;
    };

export interface TopicProps extends cdk.aws_sns.TopicProps {
  // fifo?: boolean;
  messageType?: ValueType<string>;
  messageGroupIdType?: ValueType<string>;
  messageDeduplicationIdType?: ValueType<string>;
  messageAttributesType?: {
    [name: string]: MessageAttribute;
  };
}

export interface MaterializedTopicProps {
  message: string;
  messageGroupId: string | never;
  messageDeduplicationId: string | never;
  messageAttributes:
    | {
        [name: string]:
          | {
              DataType: "String" | "Number" | "String.Array";
              StringValue: string;
            }
          | {
              DataType: "Binary";
              BinaryValue: Uint8Array;
            };
      }
    | never;
}

export type TopicArn<T extends MaterializedTopicProps> = OpaqueType<string, T>;

type RecursivelyMapValueType<T> = T extends ValueType<infer V>
  ? V
  : T extends { [name: string]: any }
  ? { [name in keyof T]: RecursivelyMapValueType<T[name]> }
  : T;

type DefaultTo<T, Default> = T extends ValueType<infer U>
  ? unknown extends U
    ? Default
    : T
  : Default;
export type MaterializeTopicProps<T extends TopicProps> =
  RecursivelyMapValueType<{
    message: DefaultTo<T["messageType"], string>;
    messageGroupId: T["fifo"] extends true
      ? DefaultTo<T["messageGroupIdType"], string>
      : never;
    messageDeduplicationId: T["fifo"] extends true
      ? DefaultTo<T["messageDeduplicationIdType"], string>
      : never;
    messageAttributes: T["messageAttributesType"] extends {
      [name: string]: MessageAttribute;
    }
      ? T["messageAttributesType"]
      : never;
  }>;

export class Topic<T extends TopicProps = TopicProps> extends cdk.aws_sns
  .Topic {
  public declare readonly topicArn: TopicArn<MaterializeTopicProps<T>>;

  public constructor(
    scope: Construct,
    id: string,
    private readonly properties?: F.Exact<T, TopicProps>,
  ) {
    super(scope, id, {
      topicName: properties?.fifo ? buildFifoName(scope, id) : undefined,
      ...(properties as cdk.aws_sns.TopicProps),
    });
  }

  public get messageType(): T["messageType"] {
    return this.properties?.messageType;
  }

  addSubscription(
    // subscription: ITopicSubscription<Message> | cdk.aws_sns.ITopicSubscription,
    // subscription: ITopicSubscription<Message>,
    // subscription: ITopicSubscription<MapValueType<T["messageType"], string>>,
    subscription: ITopicSubscription<MaterializeTopicProps<T>["message"]>,
  ) {
    return super.addSubscription(subscription);
  }
}

function buildFifoName(construct: Construct, id: string) {
  const uniqueId = cdk.Names.uniqueId(construct);
  const suffix = `${id}.fifo`;
  // Make sure that the name fits within the CFN's resource name character limit (must be between 1 and 256 characters long).
  return `${uniqueId.slice(0, Math.max(0, 255 - suffix.length))}${suffix}`;
}
