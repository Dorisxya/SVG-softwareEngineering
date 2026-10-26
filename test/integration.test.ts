import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { NodeFileStore } from "../src/infrastructure/NodeFileStore.js";
test("compiled CLI script replay saves valid SVG and continues after errors with exit code 1", () => {
  const dir = mkdtempSync(join(tmpdir(), "svg-editor-test-"));
  try {
    const file = join(dir, "diagram with spaces.svg");
    const result = spawnSync(process.execPath, ["dist/cli/main.js"], {
      encoding: "utf8",
      input: `init\ncreate rect r 10 20 30 40 red\nset r nope bad\nmove r 5 6\nsave "${file}"\n`,
    });
    assert.equal(result.status, 1);
    assert.match(result.stdout, /error: unknown attribute: nope/);
    assert.match(readFileSync(file, "utf8"), /x="15" y="26"/);
    assert.doesNotMatch(result.stdout, /svg>/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
test("filesystem errors have required prefixes", () => {
  const files = new NodeFileStore();
  assert.throws(
    () => files.read("/definitely/missing.svg"),
    /cannot read file:/,
  );
  assert.throws(
    () => files.write("/definitely/missing/diagram.svg", "x"),
    /cannot write file:/,
  );
});
