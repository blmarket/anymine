import * as ChromeLauncher from 'chrome-launcher';
import CDP from 'chrome-remote-interface';
import { withTempExtension } from './temp-extension';

// FIXME: Browser extension is not loaded with headless browser
// TODO: https://bugs.chromium.org/p/chromium/issues/detail?id=706008#c36
const headless = true;

const EXCLUDED_CHROME_FLAGS = ['--disable-extensions', '--mute-audio'];
const DEFAULT_CHROME_FLAGS =
  ChromeLauncher.Launcher.defaultFlags().filter(
    (flag) => !EXCLUDED_CHROME_FLAGS.includes(flag)
  );

export async function launch(): Promise<[Omit<CDP.Client, "close">, () => Promise<void>]> {
  return new Promise((resolveClient) => {
    withTempExtension((extDir: string) => new Promise(async (cleanupExtension) => {
      let chromeFlags = [...DEFAULT_CHROME_FLAGS, `--load-extension=${extDir}`];
      if (headless) {
        chromeFlags.push('--headless=new', '--disable-gpu');
      }

      const chrome = await ChromeLauncher.launch({
        chromeFlags,
        ignoreDefaultFlags: true,
      });

      console.log(`Chrome debugging port running on ${chrome.port}`);
      const client = await CDP({ port: chrome.port });

      resolveClient([client, async () => {
        await client.close();
        await chrome.kill();
        cleanupExtension();
      }]);
    }));
  });
}
