import { PutItemCommand, UpdateItemCommand } from "./commands/index.js";

import { DynamoDBClient } from "./dynamodb-client.js";
import { staticTest } from "../static-test.js";

staticTest(async (client: DynamoDBClient, command: PutItemCommand<any>) => {
  await client.send(command);
});

staticTest(
  async (client: DynamoDBClient, command: UpdateItemCommand<any, any, any>) => {
    const { Attributes } = await client.send(command);
  },
);
