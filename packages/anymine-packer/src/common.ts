/**
 * @fileoverview Creates rollup configs.
 */

import { RollupOptions, SourceMap } from "rollup";
import fg from 'fast-glob';
import { swc, defineRollupSwcOption } from 'rollup-plugin-swc3';

export interface Options {
  target?: "es3" | "es5" | "es2015" | "es2016" | "es2017" | "es2018" | "es2019" | "es2020" | "es2021" | "es2022";
}

/**
 * Default options.
 */
const DEFAULT_OPTIONS: Options = {
  target: "es2022",
};

/**
 * Creates rollup options.
 * 
 * @param entryFile to bundle
 * @param opts options for build configuration
 * @returns Configuration object for Rollup
 */
export function rollupOptions(entryFile: string | string[], opts: Options = {}): RollupOptions {
  return {
    input: entryFile,
    plugins: [
      swc(defineRollupSwcOption({
        tsconfig: false,
        jsc: {
          target: opts.target || DEFAULT_OPTIONS.target,
        },
        sourceMaps: true,
      })),
    ],
  };
}

/**
 * 
 * @param glob to find entrypoint files.
 * @returns 
 */
export async function createRollupOptions(glob: string | string[], opts?: Options): Promise<RollupOptions[]> {
  const files = await fg(glob);

  const confs = files.map((file) => ({
    ...rollupOptions(file, opts),
    watch: {
      skipWrite: true,
    },
  }));

  return confs;
}

export type Item = ['bundle', string, string, SourceMap] | ['end'];
