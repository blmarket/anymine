import fs from 'fs';
import path from 'path';
import { SourceMapConsumer } from 'source-map';

import { bundle, watch } from "anymine-packer";
import { WebExtRuntime } from "anymine-webext-runtime";
import { NodeVmRuntime } from "anymine-vm-runtime";

interface Options {
  glob: string | string[];
  watch?: boolean;
  runtime?: 'webext' | 'nodevm';
}

const defaultOptions: Omit<Options, "glob"> = {
  watch: false,
  runtime: 'webext',
};

interface JasmineTestSpec {
  id: string;
  description: string;
  fullName: string;
  failedExpectations: any[];
  passedExpectations: any[];
  deprecationWarnings: unknown[];
  pendingReason: string;
  duration: number;
  properties: unknown;
  debugLogs: unknown;
  status: 'passed' | 'failed' | 'pending';
}

export async function* test(options: Options): AsyncIterableIterator<JasmineTestSpec[]> {
  const opts = { ...defaultOptions, ...options };
  const runtimePromise = opts.runtime === 'webext' ? WebExtRuntime.create() : Promise.resolve(new NodeVmRuntime());
  const testCodeGen = opts.watch ? watch(opts.glob) : bundle(opts.glob);
  const runtime = await runtimePromise;
  const regex = /^( +at.+)\((.*):([0-9]+):([0-9]+)/;
  try {
    (async () => {
      for await (const [...args] of runtime.logs()) {
        console.log('LOG:', ...args);
      }
    })();

    const compileAndRun = async (filePath: string) => {
      const scriptContent = fs.readFileSync(filePath, "utf8");
      const filename = path.basename(filePath);

      await runtime.execute(scriptContent, filename);
    };

    await compileAndRun("./node_modules/jasmine-core/lib/jasmine-core/jasmine.js");
    await compileAndRun("./node_modules/jasmine-core/lib/jasmine-core/jasmine-html.js");

    for await (const [...args] of testCodeGen) {
      if (args[0] === "end") {
        // TODO: End of the test suites. Need aggregation?
        yield []; // Use empty array as an 'end' indicator?
        continue;
      }
      await compileAndRun("./node_modules/jasmine-core/lib/jasmine-core/boot0.js");
      await runtime.evaluate(`
        jasmine.getEnv().addReporter(jsApiReporter);
        jasmine.getEnv().configure({"stopSpecOnExpectationFailure":false,"stopOnSpecFailure":false,"random":true});
      `);

      const [_, code, filename, map] = args;
      await runtime.execute(code, filename);

      await runtime.evaluate(`jasmine.getEnv().execute().then(v => '');`);
      const specs = JSON.parse((await runtime.evaluate(`JSON.stringify(jsApiReporter.specs())`))!);

      if (map) {
        yield await SourceMapConsumer.with(map, null, (consumer) => {
          return specs.map((spec: JasmineTestSpec) => {
            spec.failedExpectations = spec.failedExpectations.map((e: any) => {
              e.stack = e.stack.split("\n").map((line: string) => {
                const fields = line.match(regex);
                if (fields) {
                  const origPos = consumer.originalPositionFor({ line: Number(fields[3]), column: Number(fields[4]) });
                  return `${fields[1]}${origPos.name}(${origPos.source}:${origPos.line}:${origPos.column})`;
                } else {
                  return line;
                }
              }).join("\n");
              return e;
            });
            return spec;
          });
        });
      } else {
        yield specs;
      }

      // Reset jasmine after one test suite
      await runtime.evaluate(`
        jasmine.currentEnv_ = null; '';
      `);
    }
  } finally {
    runtime.close();
  }
}
