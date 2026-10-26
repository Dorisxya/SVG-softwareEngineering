import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve, relative, join } from "node:path";
test("imports follow layer direction and each class owns its file", () => {
  const allowed: Record<string, string[]> = {
    domain: ["domain"],
    ports: ["ports", "domain"],
    application: ["application", "ports", "domain"],
    infrastructure: ["infrastructure", "ports", "domain"],
    cli: ["cli", "application", "domain", "infrastructure"],
  };
  const root = resolve("src");
  const visit = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(path);
        continue;
      }
      if (!path.endsWith(".ts")) continue;
      const code = readFileSync(path, "utf8");
      const layer = relative(root, path).split("/")[0]!;
      const classes = [
        ...code.matchAll(/export (?:abstract )?class (\w+)/g),
      ].map((m) => m[1]);
      assert.ok(classes.length <= 1, path);
      if (classes.length) assert.equal(entry.name, `${classes[0]}.ts`);
      for (const match of code.matchAll(/from ['"]([^'"]+)['"]/g)) {
        const dep = match[1]!;
        if (dep.startsWith(".")) {
          const target = relative(root, resolve(dir, dep)).split("/")[0]!;
          assert.ok(
            allowed[layer]?.includes(target),
            `${path} cannot import ${dep}`,
          );
        } else if (["domain", "application", "ports"].includes(layer)) {
          assert.fail(`${layer} depends on external package ${dep}`);
        }
      }
    }
  };
  visit(root);
});
