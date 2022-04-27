import { expect, test } from "vitest";

import { jsonEncode, jsonDecode } from "./index.js";

test("encodes correctly", (t) => {
  expect(
    jsonEncode({
      key: "value",
    }) as string,
  ).toBe('{"key":"value"}');
});

test("decodes correctly", (t) => {
  expect(
    jsonDecode(
      jsonEncode({
        key: "value",
      }),
    ),
  ).toEqual({
    key: "value",
  });
});
