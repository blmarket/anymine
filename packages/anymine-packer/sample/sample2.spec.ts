/// <reference types="jasmine" />

import { add } from './sample-util';

describe('sample 2', () => {
  it('works', async () => {
    expect(add(3, 4)).toBe(7);
    expect(add(5, 6)).toBe(11);
  });
});