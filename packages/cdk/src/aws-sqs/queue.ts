import { aws_sqs } from "aws-cdk-lib";
import { Construct } from "constructs";
import { F } from "ts-toolbelt";

import { JsonEncoded } from "@cloudy-ts/json-codec";
import { StringEncoded } from "@cloudy-ts/string-codec";

import { ValueType } from "../value-type.js";
import { OpaqueType } from "@cloudy-ts/opaque-type";

type MessageAttribute =
  | {
      DataType: "String" | "Number" | "String.Array";
      StringValue: ValueType<string>;
    }
  | {
      DataType: "Binary";
      BinaryValue: ValueType<Uint8Array>;
    };

export interface QueueProperties extends aws_sqs.QueueProps {
  fifo?: boolean;
  messageType?: ValueType<string>;
  messageGroupIdType?: ValueType<string>;
  messageDeduplicationIdType?: ValueType<string>;
  messageAttributesType?: {
    [name: string]: MessageAttribute;
  };
}

export interface MaterializedQueueProperties {
  fifo: boolean;
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
export type MaterializeQueueProperties<T extends QueueProperties> =
  RecursivelyMapValueType<{
    fifo: DefaultTo<T["fifo"], false>;
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

export type QueueUrl<T extends MaterializedQueueProperties> = OpaqueType<
  string,
  T
>;

export class Queue<
  T extends QueueProperties = QueueProperties,
> extends aws_sqs.Queue {
  public declare readonly queueUrl: QueueUrl<MaterializeQueueProperties<T>>;

  public constructor(
    scope: Construct,
    id: string,
    properties?: F.Exact<T, QueueProperties>,
  ) {
    super(scope, id, properties as aws_sqs.QueueProps);
  }
}
