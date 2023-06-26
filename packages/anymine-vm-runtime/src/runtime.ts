import EventEmitter from 'events';
import vm from 'vm';
import { Runtime } from "anymine-interface";

export class NodeVmRuntime implements Runtime {
  private ctx: vm.Context;
  private consoleEvent: EventEmitter;

  constructor() {
    this.consoleEvent = new EventEmitter();

    this.ctx = vm.createContext({
      addEventListener: () => { },
      removeEventListener: () => { },
      setTimeout,
      clearTimeout,
      setInterval,
      clearInterval,
      console: {
        log: (...args: any[]) => {
          this.consoleEvent.emit("log", ...args);
        }
      }
    });
    this.ctx.window = this.ctx;

    // Polyfills
    vm.runInContext(
      `
      queueMicrotask=c=>Promise.resolve().then(c).catch(e=>{
        setTimeout(()=>{throw e},0);
      })`,
      this.ctx,
    );
  }

  /** @inheritdoc */
  async execute(code: string, filename?: string | undefined): Promise<void> {
    (new vm.Script(code, { filename })).runInContext(this.ctx);
  }

  /** @inheritdoc */
  async evaluate(expression: string): Promise<string | undefined> {
    return vm.runInContext(expression, this.ctx);
  }

  /** @inheritdoc */
  async close(): Promise<void> {
    // do nothing
  }

  /** @inheritdoc */
  logs(): AsyncIterableIterator<any[]> {
    return EventEmitter.on(this.consoleEvent, "log");
  }
}