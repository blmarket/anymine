// @ts-ignore: this package uses experimental, whose types are not available by @types/node
import fs from "fs";
// @ts-ignore: this package uses experimental, whose types are not available by @types/node
import path from "path";
import { NodeVmRuntime as TestRuntime } from './runtime';

(async (v) => {
  // Currently no test code available
})(new TestRuntime()).catch(console.error);