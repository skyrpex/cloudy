/* eslint import/export: "warn" */
export * from "@aws-sdk/client-sns";

export {
  PublishBatchCommand,
  type PublishBatchCommandInput,
  type PublishBatchCommandOutput,
  type PublishBatchRequestEntry,
  PublishCommand,
  type PublishCommandInput,
  type PublishCommandOutput,
} from "./commands/index.js";

export {
  SNSClient,
  type ServiceInputTypes,
  type ServiceOutputTypes,
} from "./sns-client.js";
