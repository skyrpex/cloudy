/* eslint import/export: "warn" */
export * from "aws-cdk-lib/aws-sqs";

export {
  type MaterializeQueueProps,
  type MaterializedQueueProps,
  Queue,
  type QueueProps,
  type QueueUrl,
} from "./queue.js";
