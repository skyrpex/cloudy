/* eslint import/export: "warn" */
export * from "aws-cdk-lib/aws-lambda-event-sources";

import { DynamoStreamEventType } from "./dynamodb.js";
import { SnsEventType } from "./sns.js";
import { SqsEventType } from "./sqs.js";
import { Table } from "../aws-dynamodb/table.js";
import { Topic } from "../aws-sns/topic.js";
import { Queue } from "../aws-sqs/queue.js";

export {
  DynamoEventSource,
  type DynamoEventSourceProps,
  type DynamoStreamEventType,
  type TableStreamViewType,
} from "./dynamodb.js";
// export {
//   SnsEventSource,
//   type SnsEventSourceProps,
//   type SnsEventType,
// } from "./sns.js";
export {
  SqsEventSource,
  type SqsEventSourceProps,
  type SqsEventType,
} from "./sqs.js";

export type LambdaEventType<T> = /*T extends Topic
  ? SnsEventType<T>
  :*/ T extends Queue
  ? SqsEventType<T, true>
  : T extends Table<any, any, any, any>
    ? DynamoStreamEventType<T>
    : never;
