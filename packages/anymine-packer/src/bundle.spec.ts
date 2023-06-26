import { bundle } from "./bundle";
import { SourceMapConsumer } from 'source-map';

describe("bundle", () => {
  it("enumerates globbed files only once", async () => {
    let cnt = 0;
    let files = [];
    let lastType = null;
    for await (const it of bundle("sample/*.spec.ts")) {
      cnt += 1;
      if (lastType === 'end') {
        fail("should not enumerate after 'end'");
      }
      lastType = it[0];
      if (it[0] === 'end') {
        continue;
      }
      files.push(it[2]);
    }

    expect(files.length).toBe(2);
    expect(files).toContain("sample.spec.js");
    expect(files).toContain("sample2.spec.js");
    expect(lastType).toBe("end");
    expect(cnt).toBe(3);
  });

  it("yields source map which properly parses", async () => {
    const iter = bundle("sample/sample.spec.ts");
    const [_, code, _filename, map] = (await iter.next()).value;
    await iter.return!(['end']);
    // NOTE: This part can be flaky due to different code transformation.
    await SourceMapConsumer.with(map, null, (consumer) => {
      expect(consumer.originalPositionFor({ line: 8, column: 20 })).toEqual({
        source: "sample/sample.spec.ts",
        line: 7,
        column: 15,
        name: null,
      });
    });
  });
});
