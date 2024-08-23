import * as path from "node:path";
import * as fs from "node:fs";
import CDP, { SendError, StableDomains } from "chrome-remote-interface";
import ProtocolMappingApi from "devtools-protocol/types/protocol-mapping";
import ProtocolProxyApi from "devtools-protocol/types/protocol-proxy-api";

export class SessionClient implements Pick<StableDomains, 'Runtime'> {
  constructor(private client: Pick<CDP.Client, "send" | "on">, private sessionId: string) {
    this.Runtime = {
      enable: () => this.send('Runtime.enable'),
      disable: () => this.send('Runtime.disable'),
      evaluate: (params) => this.send('Runtime.evaluate', params),
      getProperties: (params) => this.send('Runtime.getProperties', params),
      releaseObject: (params) => this.send('Runtime.releaseObject', params),
      releaseObjectGroup: (params) => this.send('Runtime.releaseObjectGroup', params),
      runIfWaitingForDebugger: () => this.send('Runtime.runIfWaitingForDebugger'),
      runScript: (params) => this.send('Runtime.runScript', params),
      awaitPromise: (params) => this.send('Runtime.awaitPromise', params),
      callFunctionOn: (params) => this.send('Runtime.callFunctionOn', params),
      compileScript: (params) => this.send('Runtime.compileScript', params),
      discardConsoleEntries: () => this.send('Runtime.discardConsoleEntries'),
      getIsolateId: () => this.send('Runtime.getIsolateId'),
      getHeapUsage: () => this.send('Runtime.getHeapUsage'),
      globalLexicalScopeNames: (params) => this.send('Runtime.globalLexicalScopeNames', params),
      setCustomObjectFormatterEnabled: (params) => this.send('Runtime.setCustomObjectFormatterEnabled', params),
      queryObjects: (params) => this.send('Runtime.queryObjects', params),
      setAsyncCallStackDepth: (params) => this.send('Runtime.setAsyncCallStackDepth', params),
      setMaxCallStackSizeToCapture: (params) => this.send('Runtime.setMaxCallStackSizeToCapture', params),
      addBinding: (params) => this.send('Runtime.addBinding', params),
      removeBinding: (params) => this.send('Runtime.removeBinding', params),
      terminateExecution: () => this.send('Runtime.terminateExecution'),
      // getExceptionDetails: (params) => this.send('Runtime.getExceptionDetails', params),
      on: (event, listener) => this.client.on(event, (resp: any, sessionId) => {
        if (sessionId !== this.sessionId) return;
        listener(resp);
      }),
    };
  }
  Runtime: ProtocolProxyApi.RuntimeApi;

  send<T extends keyof ProtocolMappingApi.Commands>(method: T, ...params: ProtocolMappingApi.Commands[T]['paramsType']): Promise<ProtocolMappingApi.Commands[T]['returnType']> {
    return new Promise((resolve, reject) => {
      this.client.send(method, ...params, this.sessionId, (...[err, resp]: [true, SendError] | [false, ProtocolMappingApi.Commands[T]['returnType']] | [Error, undefined]) => {
        if (err == true) {
          reject(resp);
          return;
        }
        if (err) {
          reject(err);
          return;
        }
        resolve(resp);
      });
    });
  }

  // Helper functions
  async compileAndRun(filePath: string): Promise<Awaited<ReturnType<ProtocolProxyApi.RuntimeApi["runScript"]>>> {
    const script = await this.Runtime.compileScript({
      expression: fs.readFileSync(filePath, "utf8"),
      sourceURL: path.basename(filePath),
      persistScript: true,
    });

    if (!script.scriptId) {
      throw new Error("Script compilation failed");
    }

    return await this.Runtime.runScript({
      scriptId: script.scriptId,
    });
  }
}
