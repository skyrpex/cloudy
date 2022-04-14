import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { F } from "ts-toolbelt";

import { OpaqueType } from "@cloudy-ts/opaque-type/dist";

import { ITopicSubscription } from "./subscription.js";
import { ValueType } from "./value-type.js";

type MessageAttribute =
  | {
      DataType: "String" | "Number" | "String.Array";
      StringValue: ValueType<string>;
    }
  | {
      DataType: "Binary";
      BinaryValue: ValueType<Uint8Array>;
    };

export interface TopicProperties {
  fifo?: boolean;
  messageType?: ValueType<string>;
  messageGroupIdType?: ValueType<string>;
  messageDeduplicationIdType?: ValueType<string>;
  messageAttributesType?: {
    [name: string]: MessageAttribute;
  };
}

export type TopicArn<T extends TopicProperties> = string & { readonly t: T };

type MapValueType<T, Fallback = never> = T extends ValueType<infer V>
  ? V
  : Fallback;
type RecursivelyMapValueType<T> = T extends ValueType<infer V>
  ? V
  : T extends { [name: string]: any }
  ? { [name in keyof T]: RecursivelyMapValueType<T[name]> }
  : T;

export type MaterializeTopicProperties<T extends TopicProperties> = {
  message: MapValueType<T["messageType"], string>;
  messageGroupId: T["fifo"] extends true
    ? MapValueType<T["messageGroupIdType"], string>
    : never;
  messageDeduplicationId: T["fifo"] extends true
    ? MapValueType<T["messageDeduplicationIdType"], string>
    : never;
  // messageAttributes: T["messageAttributesType"] extends undefined ? "a" : "b";
  messageAttributes: T["messageAttributesType"] extends { [name: string]: any }
    ? RecursivelyMapValueType<T["messageAttributesType"]>
    : never;
};
type x1 = MaterializeTopicProperties<{}>;
type x1_1 = MaterializeTopicProperties<{
  messageType: ValueType<OpaqueType<string>>;
}>;
type x1_2 = MaterializeTopicProperties<{
  messageAttributesType: {
    userId: {
      DataType: "String";
      StringValue: ValueType<string>;
    };
  };
}>;
type x2 = MaterializeTopicProperties<{ fifo: true }>;
type x2_1 = MaterializeTopicProperties<{
  fifo: true;
  messageType: ValueType<OpaqueType<string>>;
  messageGroupIdType: ValueType<OpaqueType<string>>;
}>;
type x3 = x1_2["messageAttributes"] extends never ? "y" : "n";

export class Topic<T extends TopicProperties> extends cdk.aws_sns.Topic {
  public declare readonly topicArn: TopicArn<T>;

  public constructor(
    scope: Construct,
    id: string,
    properties?: F.Exact<T, TopicProperties>,
  ) {
    super(scope, id, {
      topicName: properties?.fifo ? buildFifoName(scope, id) : undefined,
      ...(properties as cdk.aws_sns.TopicProps),
    });
  }

  addSubscription(
    // subscription: ITopicSubscription<Message> | cdk.aws_sns.ITopicSubscription,
    // subscription: ITopicSubscription<Message>,
    // subscription: ITopicSubscription<MapValueType<T["messageType"], string>>,
    subscription: ITopicSubscription<MaterializeTopicProperties<T>["message"]>,
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
