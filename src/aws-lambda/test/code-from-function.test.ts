import { expect, test } from "vitest";

import { codeFromFunction } from "../code-from-function.js";

test("captures symbols correctly", async () => {
  const symbol = Symbol();
  const code = await codeFromFunction(() => {
    console.log({ symbol });
  });
  expect(code.sourceCode).toMatchSnapshot();
});
