import EventEmitter from "events";
import { Runtime } from "anymine-interface";
import Protocol from "devtools-protocol";

import { launch } from "./runchrome";
import { SessionClient } from "./session-client";

/**
 * Runtime for web extension, using Chrome Devtools Protocol to communicate with browser.
 */
export class WebExtRuntime implements Runtime {
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

  static async create(): Promise<WebExtRuntime> {
    const [client, cleanup] = await launch();

    const consoleEvent = new EventEmitter();

    client.on("Runtime.consoleAPICalled", (event: Protocol.Runtime.ConsoleAPICalledEvent) => {
      consoleEvent.emit("log", ...event.args.map((v) => WebExtRuntime.mapConsole(v)));
    });

    const resp = await client.Target.getTargets();
    const bgs = resp.targetInfos.filter(v => v.type === 'background_page');
    const bg = bgs[0];

    await client.Target.activateTarget({ targetId: bg.targetId });
    const targetSessionId = (await client.Target.attachToTarget({ targetId: bg.targetId, flatten: true })).sessionId;
    const sclient = new SessionClient(client, targetSessionId);
    await sclient.Runtime.enable();

    return new WebExtRuntime(sclient, consoleEvent, cleanup);
  }
}
