/* eslint import/export: "warn" */
export * from "aws-cdk-lib/aws-dynamodb";

export {
  type DynamodbItem,
  type MaterializeTableProps,
  type MaterializedTableProps,
  Table,
  type TableName,
  type TableProps,
} from "./table.js";
