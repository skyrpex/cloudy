import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import { F } from "ts-toolbelt"

import { ITopicSubscription } from "./subscription.js"
import { ValueType } from "./value-type.js"

type MessageAttribute =
  | {
      DataType: "String" | "Number" | "String.Array"
      StringValue: ValueType<string>
    }
  | {
      DataType: "Binary"
      BinaryValue: ValueType<Uint8Array>
    }

export interface TopicProperties {
  fifo?: boolean
  messageType?: ValueType<string>
  messageGroupIdType?: ValueType<string>
  messageDeduplicationIdType?: ValueType<string>
  messageAttributesType?: {
    [name: string]: MessageAttribute
  }
}

export type TopicArn<T extends TopicProperties> = string & { readonly t: T }

type MapValueType<T, Fallback> = T extends ValueType<infer V> ? V : Fallback

export class Topic<T extends TopicProperties> extends cdk.aws_sns.Topic {
  public declare readonly topicArn: TopicArn<T>

  public constructor(
    scope: Construct,
    id: string,
    properties?: F.Exact<T, TopicProperties>,
  ) {
    super(scope, id, {
      topicName: properties?.fifo ? buildFifoName(scope, id) : undefined,
      ...(properties as cdk.aws_sns.TopicProps),
    })
  }

  addSubscription(
    // subscription: ITopicSubscription<Message> | cdk.aws_sns.ITopicSubscription,
    // subscription: ITopicSubscription<Message>,
    subscription: ITopicSubscription<MapValueType<T["messageType"], string>>,
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
