import { aws_sqs } from "aws-cdk-lib"
import { Construct } from "constructs"

import { JsonEncoded } from "@cloudy-ts/json-codec"
import { StringEncoded } from "@cloudy-ts/string-codec"

import { MessageAttributesType } from "../aws-sns/topic.js"

export interface QueueProperties<Fifo extends boolean = false>
  extends aws_sqs.QueueProps {
  fifo?: Fifo
}

export class Queue<
  Message extends string = string,
  MessageGroupId extends string = string,
  MessageDeduplicationId extends string = string,
  MessageAttributes extends MessageAttributesType = undefined,
  Fifo extends boolean = boolean,
> extends aws_sqs.Queue {
  public constructor(
    scope: Construct,
    id: string,
    properties?: QueueProperties<Fifo>,
  ) {
    super(scope, id, properties)
  }
}

// interface QueueEventType<
//   Message extends string = string,
//   MessageGroupId extends string = string,
//   MessageDeduplicationId extends string = string,
//   MessageAttributes extends MessageAttributesType = undefined,
//   Fifo extends boolean = boolean,
//   RawMessageDelivery extends boolean = boolean,
// > {
//   Records: {
//     messageId: string
//     receiptHandle: string
//     body: RawMessageDelivery extends true
//       ? Message
//       : JsonEncoded<{
//           Message: Message
//           MessageId: string
//           SequenceNumber: StringEncoded<bigint>
//           Timestamp: "2022-04-11T16:25:46.848Z"
//           TopicArn: string
//           Type: "Notification"
//           UnsubscribeURL: string
//         }>
//     attributes: {
//       ApproximateReceiveCount: StringEncoded<number>
//       SentTimestamp: StringEncoded<number>
//       SequenceNumber: StringEncoded<bigint>
//       SenderId: string
//       ApproximateFirstReceiveTimestamp: StringEncoded<number>
//     } & (Fifo extends true
//       ? {
//           MessageGroupId: MessageGroupId
//           MessageDeduplicationId: MessageDeduplicationId
//         }
//       : {})
//     messageAttributes: MessageAttributes
//     md5OfBody: string
//     eventSource: "aws:sqs"
//     eventSourceARN: string
//     awsRegion: string
//   }[]
// }
