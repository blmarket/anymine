import { test } from "./run-test";

(async () => {
  for await (const specs of test({
    glob: "./spec/*spec.{js,mjs,ts}",
    watch: false,
    runtime: 'webext',
  })) {
    for (const spec of specs) {
      if (spec.failedExpectations.length === 0) {
        continue;
      }
      console.log(spec);
    }
  }
})();
