/* eslint import/export: "warn" */
export * from "@aws-sdk/client-lambda";

export {
  InvokeCommand,
  type InvokeCommandInput,
  type InvokeCommandOutput,
} from "./commands/index.js";

export {
  LambdaClient,
  type ServiceInputTypes,
  type ServiceOutputTypes,
} from "./lambda-client.js";
