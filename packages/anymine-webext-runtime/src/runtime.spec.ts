/// <reference types="jasmine" />

import { WebExtRuntime } from "./runtime";

describe('webext runtime', () => {
  let runtime: WebExtRuntime;

  beforeAll(async () => {
    runtime = await WebExtRuntime.create();
  });

  afterAll(async () => {
    await runtime.close();
  });

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
    expect(tmp.value).toEqual(["Hello world", 0, false, null, undefined, "[object Object]", "[object Array]"]);
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

  it('allows access to chrome.cookies API', async () => {
    await runtime.evaluate(`console.log(chrome.cookies);`);
    const tmp = await logs.next();
    expect(tmp.value).toEqual(["[object Object]"]);
  });

  it('allows read and write arbitrary cookies', async () => {
    await runtime.evaluate(`chrome.cookies.set({ url: "https://example.com", name: "test", value: "test" });`);
    await runtime.evaluate(`chrome.cookies.get({ url: "https://example.com", name: "test" }, (cookie) => console.log(cookie.value));`);
    const tmp = await logs.next();
    expect(tmp.value).toEqual(["test"]);
  });
});