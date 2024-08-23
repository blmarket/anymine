import EventEmitter, { on } from "node:events";
import { RollupOptions, watch as rollupWatch } from "rollup";
import fg from 'fast-glob';
import { Item, Options, rollupOptions } from "./common";

/**
 * Watch files, and build bundles for them.
 * 
 * @param files to watch for build.
 * @returns Actually, this never ends until the process is killed.
 */
async function* createBundleEvent(confs: RollupOptions[]): AsyncIterableIterator<Item> {
  const watcher = rollupWatch(confs);

  const ret = new EventEmitter();

  watcher.on('event', async (e) => {
    switch (e.code) {
      case 'BUNDLE_END':
        const outs = (await e.result.generate({
          format: 'iife',
          esModule: false,
          sourcemap: 'inline',
          manualChunks: () => "app",
        })).output;
        for (const output of outs) {
          if (output.type !== 'chunk') continue;
          ret.emit('event', 'bundle', output.code, output.fileName, output.map);
        }
        e.result.close();
        break;
      case 'END':
        ret.emit('event', 'end');
        break;
    }
  });

  yield* (on(ret, 'event') as AsyncIterableIterator<any>);
}

export async function* watch(glob: string | string[], opts?: Options): AsyncIterableIterator<Item> {
  const files = await fg(glob);

  const confs = files.map((file) => ({
    ...rollupOptions(file, opts),
    watch: {
      skipWrite: true,
    },
  }));

  yield* createBundleEvent(confs);
}