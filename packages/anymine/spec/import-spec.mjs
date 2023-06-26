import { add } from "./util.mjs";

describe("add2", () => {
  it("adds two numbers", () => {
    expect(add(1, 2)).toBe(3);
    expect(add(1, 4)).toBe(5);
  });
});
