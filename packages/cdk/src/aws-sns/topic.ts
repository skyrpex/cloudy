import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { F } from "ts-toolbelt";

import { ITopicSubscription } from "./subscription.js";
import { ValueType } from "../value-type.js";

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

export interface MaterializedTopicProperties {
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

export type TopicArn<T extends MaterializedTopicProperties> = string & {
  readonly t: T;
};
// export type TopicArn<T extends MaterializedTopicProperties> = OpaqueType<
//   string,
//   T
// >;

// type MapValueType<T, Fallback = never> = T extends ValueType<infer V>
//   ? V
//   : Fallback;
type RecursivelyMapValueType<T> = T extends ValueType<infer V>
  ? V
  : T extends { [name: string]: any }
  ? { [name in keyof T]: RecursivelyMapValueType<T[name]> }
  : T;

// export type MaterializeTopicProperties<T extends TopicProperties> = {
//   message: MapValueType<T["messageType"], string>;
//   messageGroupId: T["fifo"] extends true
//     ? MapValueType<T["messageGroupIdType"], string>
//     : never;
//   messageDeduplicationId: T["fifo"] extends true
//     ? MapValueType<T["messageDeduplicationIdType"], string>
//     : never;
//   // messageAttributes: T["messageAttributesType"] extends undefined ? "a" : "b";
//   messageAttributes: T["messageAttributesType"] extends { [name: string]: MessageAttribute }
//     ? RecursivelyMapValueType<T["messageAttributesType"]>
//     : never;
// };
// type DefaultTo<T, Default> = T extends never ? Default : T;
// type DefaultTo<T, Default> = unknown extends T ? Default : T;
// type DefaultTo<T, Default> = T extends ValueType<infer U>
//   ? unknown extends U
//     ? Default
//     : U
//   : Default;
type DefaultTo<T, Default> = T extends ValueType<infer U>
  ? unknown extends U
    ? Default
    : T
  : Default;
export type MaterializeTopicProperties<T extends TopicProperties> =
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
// type y1 = DefaultTo<ValueType<string>, number>;
// type y2 = DefaultTo<ValueType<OpaqueType<string, "hi">>, number>;

// type x1 = MaterializeTopicProperties<{}>;
// type x1_0 = MaterializeTopicProperties<{ fifo: true }>;
// type x1_1 = MaterializeTopicProperties<{
//   fifo: true;
//   // messageType: ValueType<OpaqueType<string, "MyString">>;
//   messageType: ValueType<"a">;
//   messageGroupIdType: ValueType<"a">;
// }>;
// // type x1_2 = MaterializeTopicProperties<{
// //   messageAttributesType: {
// //     userId: {
// //       DataType: "String";
// //       StringValue: ValueType<"hi">;
// //     };
// //     bin: {
// //       DataType: "Binary";
// //       BinaryValue: ValueType<Uint8Array>;
// //     };
// //   };
// // }>;
// // type x2_2 = MaterializeTopicProperties<{
// //   fifo: true;
// //   // messageGroupIdType: ValueType<OpaqueType<string>>,
// //   messageAttributesType: {
// //     userId: {
// //       DataType: "String";
// //       StringValue: ValueType<string>;
// //     };
// //     bin: {
// //       DataType: "Binary";
// //       BinaryValue: ValueType<Uint8Array>;
// //     };
// //   };
// // }>;
// // type x2 = MaterializeTopicProperties<{ fifo: true }>;
// type Mystring = OpaqueType<string, "hi">;
// type x2_1 = MaterializeTopicProperties<{
//   fifo: true;
//   messageType: ValueType<Mystring>;
//   messageGroupIdType: ValueType<Mystring>;
// }>;
// // type x3 = x1_2["messageAttributes"] extends never ? "y" : "n";

export class Topic<T extends TopicProperties> extends cdk.aws_sns.Topic {
  public declare readonly topicArn: TopicArn<MaterializeTopicProperties<T>>;

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
