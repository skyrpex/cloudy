import { serializeFunction } from "@functionless/nodejs-closure-serializer";
import { expect, test } from "vitest";

test("serializes functions correctly", async (t) => {
  expect(
    await serializeFunction(function sum(a: number, b: number) {
      return a + b;
    }),
  ).toMatchSnapshot();
});

test("serializes functions correctly 2", async (t) => {
  expect(
    await serializeFunction(function sum(a: any, b: any) {
      return { ...a, ...b };
    }),
  ).toMatchSnapshot();
});
