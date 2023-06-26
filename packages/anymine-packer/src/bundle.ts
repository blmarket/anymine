import { RollupCache, rollup } from "rollup";
import { Options, rollupOptions, Item } from "./common";
import fg from 'fast-glob';

/**
 * Bundle target file and dependencies into a single js code without es modules.
 * 
 * @param srcGlob source file to bundle
 * @param opts options for build configuration
 * @returns [code, fileName] code is the bundled js code, fileName is the file name of the bundled file.
 */
export async function* bundle(srcGlob: string | string[], opts?: Options): AsyncGenerator<Item> {
  const srcFiles = await fg(srcGlob);

  let cache: RollupCache | undefined;
  for (const file of srcFiles) {
    const bundle = await rollup({ ...rollupOptions(file, opts), cache });
    const res = await bundle.generate({ esModule: false, sourcemap: 'inline' });
    for (const output of res.output) {
      if (output.type !== 'chunk') continue;
      yield ['bundle', output.code, output.fileName, output.map!];
    }
    cache = bundle.cache;
  }
  yield ['end'];
}
