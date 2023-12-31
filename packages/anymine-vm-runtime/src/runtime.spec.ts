/// <reference types="jasmine" />

import { Runtime } from "anymine-interface";
import { NodeVmRuntime } from "./runtime";

describe('NodeVmRuntime', () => {
  let runtime: Runtime;

  beforeAll(async () => {
    runtime = new NodeVmRuntime();
  });

  afterAll(async () => {
    await runtime.close();
  });

  describe("logs", () => {
    let logs: AsyncIterableIterator<any[]>;

    beforeEach(async () => {
      logs = runtime.logs();
    });

    afterEach(async () => {
      if (logs.return) {
        logs.return();
      }
    });

    it('captures logs as stringified', async () => {
      await runtime.evaluate(`
        console.log("Hello world", 0, false, null, undefined, {"asdf":"news", "value": 1}, [1,null,3]);
      `);

      const tmp = await logs.next();
      expect(tmp.done).toBeFalse();
      expect(tmp.value).toEqual(["Hello world", 0, false, null, undefined, { asdf: "news", value: 1 }, [1, null, 3]]);
    });

    it('stops listening logs after return', async () => {
      await runtime.evaluate(`console.log(1);`);
      expect(await logs.next()).toEqual({ done: false, value: [1] });
      expect(logs.return).toBeDefined();
      await logs.return!();
      expect(await logs.next()).toEqual({ done: true, value: undefined });
      await runtime.evaluate(`console.log(2);`);
      expect(await logs.next()).toEqual({ done: true, value: undefined });
    });
  });
});