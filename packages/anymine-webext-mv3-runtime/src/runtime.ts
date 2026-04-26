import EventEmitter from "events";
import CDP from "chrome-remote-interface";
import { Runtime } from "anymine-interface";
import Protocol from "devtools-protocol";

import { launch } from "./runchrome";
import { SessionClient } from "./session-client";

const EXTENSION_PROTOCOL = "chrome-extension://";
const TARGET_WAIT_TIMEOUT_MS = 5000;
const TARGET_WAIT_INTERVAL_MS = 100;

/**
 * Runtime for MV3 web extensions, using Chrome Devtools Protocol to communicate with the background service worker.
 */
export class WebExtMv3Runtime implements Runtime {
  constructor(
    private client: SessionClient,
    private consoleEvent: EventEmitter,
    private cleanup: () => Promise<void>,
  ) {
  }

  /** @inheritdoc */
  async execute(scriptContent: string, filename: string): Promise<void> {
    const script = await this.client.Runtime.compileScript({
      expression: scriptContent,
      sourceURL: filename,
      persistScript: true,
    });

    if (!script.scriptId) {
      throw new Error("Script compilation failed");
    }

    await this.client.Runtime.runScript({
      scriptId: script.scriptId,
    });
  }

  /** @inheritdoc */
  async evaluate(expression: string): Promise<string | undefined> {
    const resp = await this.client.Runtime.evaluate({
      expression: expression,
      awaitPromise: true,
    });
    if (resp.result.type === 'object' && resp.result.subtype === 'error') {
      if (resp.result.className === 'TypeError') {
        throw new TypeError(resp.result.description);
      } else {
        throw new Error(resp.result.description);
      }
    }
    if (resp.result.type !== 'string' && resp.result.type !== 'undefined') {
      throw new Error(`Expected expression result to be string or undefined, got ${resp.result.type}`);
    }
    return resp.result.value;
  }

  /** @inheritdoc */
  async close(): Promise<void> {
    await this.cleanup();
  }

  /** @inheritdoc */
  logs(): AsyncIterableIterator<any[]> {
    return EventEmitter.on(this.consoleEvent, "log");
  }

  private static mapConsole(arg: Protocol.Runtime.RemoteObject): any {
    switch (arg.type) {
      case 'string':
      case 'number':
      case 'boolean':
        return arg.value;
      case 'undefined':
        return undefined;
      case 'object':
        if (arg.subtype === 'null') {
          return null;
        }
        return `[object ${arg.className}]`;
    }
    return `{unknown type: ${arg.type}}`;
  }

  private static async waitForBackgroundServiceWorker(client: Pick<CDP.Client, "Target">): Promise<Protocol.Target.TargetInfo> {
    const deadline = Date.now() + TARGET_WAIT_TIMEOUT_MS;

    while (Date.now() < deadline) {
      const resp = await client.Target.getTargets();
      const worker = resp.targetInfos.find((target) =>
        target.type === 'service_worker' && target.url.startsWith(EXTENSION_PROTOCOL)
      );
      if (worker) {
        return worker;
      }

      await new Promise((resolve) => setTimeout(resolve, TARGET_WAIT_INTERVAL_MS));
    }

    throw new Error("Timed out waiting for MV3 extension service worker target");
  }

  static async create(): Promise<WebExtMv3Runtime> {
    const [client, cleanup] = await launch();

    const consoleEvent = new EventEmitter();

    const bg = await WebExtMv3Runtime.waitForBackgroundServiceWorker(client);
    const targetSessionId = (await client.Target.attachToTarget({ targetId: bg.targetId, flatten: true })).sessionId;
    const sclient = new SessionClient(client, targetSessionId);
    client.on("Runtime.consoleAPICalled", (event: Protocol.Runtime.ConsoleAPICalledEvent) => {
      consoleEvent.emit("log", ...event.args.map((v) => WebExtMv3Runtime.mapConsole(v)));
    });
    await sclient.Runtime.enable();

    return new WebExtMv3Runtime(sclient, consoleEvent, cleanup);
  }
}
