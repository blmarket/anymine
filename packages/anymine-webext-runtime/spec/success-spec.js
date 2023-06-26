describe("basic", () => {
  it("works", async () => {
    expect(1).toBe(1);
    console.log("start wait");
    await new Promise((resolve) => {
      console.log("wait 1");
      setTimeout(resolve, 100);
    });
    console.log("end wait");
    expect(2).toBe(2);
  });
});
