/* eslint import/export: "warn" */
export * from "@aws-sdk/client-dynamodb";

export {
  PutItemCommand,
  type PutItemCommandInput,
  type PutItemCommandOutput,
  QueryCommand,
  type QueryCommandInput,
  type QueryCommandOutput,
  UpdateItemCommand,
  type UpdateItemCommandInput,
  type UpdateItemCommandOutput,
} from "./commands/index.js";

export {
  DynamoDBClient,
  type ServiceInputTypes,
  type ServiceOutputTypes,
} from "./dynamodb-client.js";
