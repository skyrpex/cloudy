import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"

import { OpaqueType } from "@cloudy-ts/opaque-type"

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

export type MessageAttributesType =
  | {
      [key: string]: MessageAttributeType
    }
  | undefined

export type MessageTypes = {
  Message: string
  MessageGroupId?: string
  MessageDeduplicationId?: string
  MessageAttributes?: MessageAttributesType
}

export type TopicArn<
  Message extends string = string,
  MessageGroupId extends string = string,
  MessageDeduplicationId extends string = string,
  MessageAttributes extends MessageAttributesType = undefined,
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

export class Topic<
  Message extends string,
  MessageGroupId extends string,
  MessageDeduplicationId extends string,
  MessageAttributes extends MessageAttributesType = undefined,
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
    properties?: { fifo: Fifo } & cdk.aws_sns.TopicProps,
  ) {
    super(scope, id, {
      topicName: properties?.fifo ? buildFifoName(scope, id) : undefined,
      ...(properties as cdk.aws_sns.TopicProps),
    })
  }

  public withMessageType<Message extends string>(): Topic<
    Message,
    MessageGroupId,
    MessageDeduplicationId,
    MessageAttributes,
    Fifo
  > {
    return this as any
  }

  public withMessageGroupIdType<MessageGroupId extends string>(): Topic<
    Message,
    MessageGroupId,
    MessageDeduplicationId,
    MessageAttributes,
    Fifo
  > {
    return this as any
  }

  public withMessageDeduplicationIdType<
    MessageDeduplicationId extends string,
  >(): Topic<
    Message,
    MessageGroupId,
    MessageDeduplicationId,
    MessageAttributes,
    Fifo
  > {
    return this as any
  }

  /**
   * Returns a topic that requires the given message attributes.
   *
   * @example
   * ```ts
   * const topic = new Topic(scope, id).withMessageAttributesType<{
   *   userId?: {
   *     DataType: "String"
   *     StringValue: string,
   *   },
   *   age: {
   *     DataType: "Number"
   *     StringValue: string,
   *   },
   *   somethingBinary: {
   *     DataType: "Binary"
   *     BinaryValue: Uint8Array,
   *   },
   * }>()
   * ```
   */
  public withMessageAttributesType<
    MessageAttributes extends MessageAttributesType,
  >(): Topic<
    Message,
    MessageGroupId,
    MessageDeduplicationId,
    MessageAttributes,
    Fifo
  > {
    return this as any
  }

  // /**
  //  * Returns a topic that requires a message attribute with the given properties.
  //  *
  //  * @example
  //  * ```ts
  //  * const topic = new Topic(scope, id)
  //  *   .withMessageAttributeType<"userId", "String">()
  //  *   .withMessageAttributeType<"age", "Number">()
  //  * ```
  //  */
  // public withMessageAttributeType<
  //   Name extends string,
  //   DataType extends MessageAttributeType["DataType"],
  //   Type extends MessageAttributeValueType<DataType> = MessageAttributeValueType<DataType>,
  // >(): Topic<
  //   {
  //     Message: Message["Message"]
  //     MessageGroupId: Message["MessageGroupId"]
  //     MessageDeduplicationId: Message["MessageDeduplicationId"]
  //     MessageAttributes: Union.Merge<
  //       Message["MessageAttributes"] &
  //         Record<Name, MessageAttributeValueType2<DataType, Type>>
  //     >
  //   },
  //   Fifo
  // > {
  //   return this as any
  // }
}

function buildFifoName(construct: Construct, id: string) {
  const uniqueId = cdk.Names.uniqueId(construct)
  const suffix = `${id}.fifo`
  // Make sure that the name fits within the CFN's resource name character limit (must be between 1 and 256 characters long).
  return `${uniqueId.slice(0, Math.max(0, 255 - suffix.length))}${suffix}`
}
