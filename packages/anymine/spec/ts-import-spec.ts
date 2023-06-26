/// <reference types="chrome" />
/// <reference types="jasmine" />

// @ts-ignore: intentionally using js module
import { add } from "./util.mjs";
import { subtract } from "./ts-util";

describe("add", (): void => {
  it("adds two numbers", async (): Promise<void> => {
    expect(add(2, 3)).toBe(5);
  });
});

describe("subtract", () => {
  it("subtract two numbers", (): void => {
    expect(subtract(5, 2)).toBe(7);
  });
});
