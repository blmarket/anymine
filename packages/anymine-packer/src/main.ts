import { watch } from "./watch";
import { bundle } from "./bundle";

(async () => {
  for await (const evt of bundle("./src/**/*.spec.ts")) {
    console.log(evt);
  }
})();
