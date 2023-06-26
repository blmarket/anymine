import { WebExtRuntime } from './runtime';

WebExtRuntime.create().then(async (v) => {
  try {
    await v.evaluate(`
      console.log("Hello world", 0, false, null, undefined, {"asdf":"news", "value": 1}, [1,null,3]);
    `);
  } finally {
    v.close();
  }
}).catch(console.error);