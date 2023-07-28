import { InvokeCommand } from "./commands/index.js";
import { LambdaClient } from "./lambda-client.js";
import { CallbackFunction } from "../aws-lambda/index.js";
import { jsonEncode } from "../codec-json/index.js";
import { staticTest } from "../static-test.js";

staticTest(
  async (
    function_: CallbackFunction<{ name: string; age: number }, {}>,
    client: LambdaClient,
  ) => {
    await client.send(
      new InvokeCommand({
        FunctionName: function_.functionName,
        Payload: jsonEncode({
          name: "Cristian",
          age: 34,
        }),
      }),
    );
  },
);
