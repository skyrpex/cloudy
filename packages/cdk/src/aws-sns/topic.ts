import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import { T } from "ts-toolbelt"

import { JsonSerializable, JsonEncoded } from "@cloudy-ts/json-codec"
import { OpaqueType } from "@cloudy-ts/opaque-type"

import { ITopicSubscription } from "./subscription.js"

export interface FifoType {
  fifo: boolean
}

type MessageAttributeType =
  | {
      DataType: "String" | "Number" | "String.Array"
      StringValue: string
    }
  | {
      DataType: "Binary"
      BinaryValue: Uint8Array
    }

export interface MessageAttributesBaseType {
  [key: string]: MessageAttributeType
}

export type TopicArn<
  Message extends string = string,
  MessageGroupId extends string = string,
  MessageDeduplicationId extends string = string,
  MessageAttributes extends MessageAttributesBaseType | undefined = undefined,
  Fifo extends boolean = boolean,
> = OpaqueType<
  string,
  {
    readonly t: unique symbol
    Message: Message
    MessageGroupId: MessageGroupId
    MessageDeduplicationId: MessageDeduplicationId
    MessageAttributes: MessageAttributes
    Fifo: Fifo
  }
>

export class MessageType<T extends string = string> {
  public static as<T extends string>() {
    return new MessageType<T>()
  }

  public static asJson<T extends JsonSerializable>() {
    return new MessageType<JsonEncoded<T>>()
  }
}

export class MessageAttributesType<
  T extends MessageAttributesBaseType | undefined,
> {
  public static as<T extends MessageAttributesBaseType>() {
    return new MessageAttributesType<T>()
  }
}

export interface TopicProperties<
  Message extends string = string,
  MessageGroupId extends string = string,
  MessageDeduplicationId extends string = string,
  MessageAttributes extends
    | MessageAttributesBaseType
    | undefined = MessageAttributesBaseType,
  Fifo extends boolean = boolean,
> extends cdk.aws_sns.TopicProps {
  fifo?: Fifo
  messageType?: MessageType<Message>
  messageGroupIdType?: MessageType<MessageGroupId>
  messageDeduplicationIdType?: MessageType<MessageDeduplicationId>
  messageAttributesType?: MessageAttributesType<MessageAttributes>
}

export class Topic<
  Message extends string = string,
  MessageGroupId extends string = string,
  MessageDeduplicationId extends string = string,
  // MessageAttributes extends MessageAttributesType = undefined,
  MessageAttributes extends MessageAttributesBaseType | undefined = undefined,
  Fifo extends boolean = false,
> extends cdk.aws_sns.Topic {
  public readonly topicArn!: TopicArn<
    Message,
    MessageGroupId,
    MessageDeduplicationId,
    MessageAttributes,
    Fifo
  >

  public constructor(
    scope: Construct,
    id: string,
    properties?: TopicProperties<
      Message,
      MessageGroupId,
      MessageDeduplicationId,
      MessageAttributes,
      Fifo
    >,
  ) {
    super(scope, id, {
      topicName: properties?.fifo ? buildFifoName(scope, id) : undefined,
      ...(properties as cdk.aws_sns.TopicProps),
    })
  }

  addSubscription(
    // subscription: ITopicSubscription<Message> | cdk.aws_sns.ITopicSubscription,
    subscription: ITopicSubscription<Message>,
  ) {
    return super.addSubscription(subscription)
  }
}

function buildFifoName(construct: Construct, id: string) {
  const uniqueId = cdk.Names.uniqueId(construct)
  const suffix = `${id}.fifo`
  // Make sure that the name fits within the CFN's resource name character limit (must be between 1 and 256 characters long).
  return `${uniqueId.slice(0, Math.max(0, 255 - suffix.length))}${suffix}`
}
