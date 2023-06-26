/// <reference types="chrome" />
/// <reference types="jasmine" />

describe('script with chrome', () => {
  it('works', async () => {
    console.log('chrome.storage', chrome.storage);
    expect(chrome.storage.local).toBeDefined();
  });
});