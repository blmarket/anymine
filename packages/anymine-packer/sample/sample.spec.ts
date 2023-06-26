/// <reference types="jasmine" />

import { add } from './sample-util';

describe('bgscript', () => {
  it('works', async () => {
    expect(add(1, 2)).toBe(3);
    expect(add(3, 2)).toBe(5);
  });
});