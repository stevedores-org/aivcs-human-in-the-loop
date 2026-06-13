import { expect, test } from "bun:test";
import App from "./App";

test("App is defined as a function", () => {
  expect(typeof App).toBe("function");
});
