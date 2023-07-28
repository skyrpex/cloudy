import { PublishBatchCommand, PublishCommand } from "./commands/index.js";

import { SNSClient } from "./lambda-client.js";
import { staticTest } from "../static-test.js";

staticTest(async (client: SNSClient, command: PublishCommand<any>) => {
  const { SequenceNumber } = await client.send(command);
});

staticTest(async (client: SNSClient, command: PublishBatchCommand<any>) => {
  const { Successful } = await client.send(command);
});
