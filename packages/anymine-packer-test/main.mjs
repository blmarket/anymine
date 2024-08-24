import { test } from "anymine";

(async () => {
  for await (const specs of test({
    glob: "src/**/*.{spec,test}.ts",
    watch: true,
    runtime: "webext",
  })) {
    let allPass = true;
    for (const spec of specs) {
      if (spec.status !== "failed") {
        continue;
      }
      allPass = false;
      console.log(spec.failedExpectations[0]);
    }
    if (allPass) {
      console.log("All tests passed");
    }
  }
})();
