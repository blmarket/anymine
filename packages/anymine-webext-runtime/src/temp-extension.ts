/**
 * @fileoverview Creates a temporary chrome extension to be loaded.
 */

import fs from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

import tmp from 'tmp';

async function createExtension(dir: string): Promise<void> {
  const writeFile = promisify(fs.writeFile);
  const p1 = writeFile(path.join(dir, "manifest.json"), JSON.stringify({
    "name": "test",
    "description": "test extension",
    "version": "0.1.0",
    "manifest_version": 2,
    "permissions": ["storage"],
    "background": {
      "scripts": ["bg.js"]
    }
  }));
  const p2 = writeFile(path.join(dir, "bg.js"), `"use strict";`);

  await Promise.all([p1, p2]);
}

async function withTempDir<T>(inner: (dir: string) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    tmp.dir({ prefix: "anymine-webext", unsafeCleanup: true }, async (err, path, cleanup) => {
      try {
        if (err) {
          reject(err);
          return;
        }
        resolve(await inner(path));
      } catch (err) {
        reject(err);
      } finally {
        cleanup();
      }
    });
  });
}

export async function withTempExtension(inner: (dir: string) => Promise<void>): Promise<void> {
  await withTempDir(async (dir) => {
    await createExtension(dir);
    await inner(dir);
  });
}
