import test from "ava"

import { jsonEncode, jsonDecode } from "."

test("encodes correctly", (t) => {
  t.deepEqual(
    jsonEncode({
      key: "value",
    }) as string,
    '{"key":"value"}',
  )
})

test("decodes correctly", (t) => {
  t.deepEqual(
    jsonDecode(
      jsonEncode({
        key: "value",
      }),
    ),
    {
      key: "value",
    },
  )
})
