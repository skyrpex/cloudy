import { Table } from "../aws-dynamodb/table.js";
import { Topic } from "../aws-sns/topic.js";
import { Queue } from "../aws-sqs/queue.js";
import { DynamoStreamEventType } from "./dynamodb.js";
import { SnsEventType } from "./sns.js";
import { SqsEventType } from "./sqs.js";

export * from "./dynamodb.js";
export * from "./sns.js";
export * from "./sqs.js";

export type LambdaEventType<T> = T extends Topic
  ? SnsEventType<T>
  : T extends Queue
  ? SqsEventType<T, true>
  : T extends Table<any, any, any, any>
  ? DynamoStreamEventType<T>
  : never;
