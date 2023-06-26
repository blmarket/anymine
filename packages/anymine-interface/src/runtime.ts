/**
 * Javascript runtime executes a script. Caller should call close() after using the runtime.
 * lifecycle: execute(0 or more scripts) -> close()
 */
export interface Runtime {
  /**
   * Load and execute a javascript file.
   * Note: this ignores the execution result value. Use {@link evaluate} if you need the result.
   * 
   * @param script script content
   * @param filename filename in case we need a stack trace? (FIXME: can we use sourcemap instead?)
   */
  execute(script: string, filename?: string): Promise<void>;

  /**
   * Evaluate an expression, await if the result is promise, then get the response in string format.
   * 
   * @param expression to be evaluated. response should be JSON serializable
   * @returns response from the expression, with JSON serialized.
   */
  evaluate(expression: string): Promise<string | undefined>;

  /**
   * close the runtime
   */
  close(): Promise<void>;

  /**
   * Creates a new async iterable yields logs from the runtime.
   */
  logs(): AsyncIterableIterator<any[]>;
}
