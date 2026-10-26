import test from "node:test";
import assert from "node:assert/strict";
import { Editor } from "../src/application/Editor.js";
import { CommandRouter } from "../src/cli/CommandRouter.js";
import { SvgCodec } from "../src/infrastructure/SvgCodec.js";
import { MemoryFileStore } from "./MemoryFileStore.js";
const setup = () => {
  const files = new MemoryFileStore(),
    editor = new Editor(files, new SvgCodec()),
    cli = new CommandRouter(editor);
  const run = (s: string) => cli.run(s);
  return { files, editor, run };
};
const svg = (body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">${body}</svg>`;
test("before init every document-dependent command errors; help and comments work", () => {
  const { run } = setup();
  for (const line of [
    "create rect r 0 0 1 1",
    "save",
    "tree",
    "show r",
    "undo",
    "redo",
    "canvas",
    "move r 1 1",
  ])
    assert.equal(run(line), "error: no document. use 'init' or 'read' first");
  assert.match(run("help"), /create/);
  assert.equal(run(" # comment"), "");
});
test("all six types, optional colors, quoted Unicode, tail in", () => {
  const { run, editor } = setup();
  run("init");
  for (const line of [
    "create g g",
    "create rect r 1 2 3 4 #fff in g",
    "create circle c 4 5 6",
    "create ellipse e 1 2 3 4",
    "create line l 1 2 3 4 black",
    'create text t 4 5 "开始 hello" in g',
  ])
    assert.doesNotMatch(run(line), /^error:/);
  assert.equal(editor.document().all().length, 6);
  assert.equal(editor.document().find("t").get("text"), "开始 hello");
  assert.equal(editor.document().parentLabel("t"), "g#g");
  assert.equal(editor.document().find("e").get("fill"), "");
});
test("group preserves document order and original parent on undo", () => {
  const { run, editor } = setup();
  [
    "init",
    "create g root",
    "create rect a 0 0 1 1 in root",
    "create rect b 0 0 1 1 in root",
    "create rect c 0 0 1 1 in root",
  ].forEach(run);
  const before = run("tree");
  run("group pair c a");
  assert.deepEqual(
    editor
      .document()
      .find("pair")
      .children.map((s) => s.id),
    ["a", "c"],
  );
  assert.equal(editor.document().parentLabel("pair"), "g#root");
  run("undo");
  assert.equal(run("tree"), before);
  run("redo");
  run("ungroup pair");
  assert.deepEqual(
    editor
      .document()
      .find("root")
      .children.map((s) => s.id),
    ["a", "c", "b"],
  );
});
test("group across parents moves to root and undo is atomic", () => {
  const { run, editor } = setup();
  [
    "init",
    "create g ga",
    "create g gb",
    "create circle a 0 0 1 in ga",
    "create circle b 0 0 1 in gb",
  ].forEach(run);
  const before = run("tree");
  run("group joined b a");
  assert.equal(editor.document().parentLabel("joined"), "svg");
  assert.deepEqual(
    editor
      .document()
      .find("joined")
      .children.map((s) => s.id),
    ["a", "b"],
  );
  run("undo");
  assert.equal(run("tree"), before);
});
test("composite move and scale apply once to every descendant", () => {
  const { run, editor } = setup();
  [
    "init",
    "create g g",
    "create g inner in g",
    "create rect r 1 2 3 4 in inner",
    "create line l 1 2 3 4 in g",
    'create text t 1 2 "hello" in inner',
    "move g 10 -1",
    "scale g 2",
  ].forEach(run);
  const d = editor.document();
  assert.equal(d.find("r").get("x"), "22");
  assert.equal(d.find("r").get("y"), "2");
  assert.equal(d.find("r").get("width"), "6");
  assert.equal(d.find("l").get("x2"), "26");
  assert.equal(d.find("t").get("text"), "hello");
});
test("group set uses SVG inherited presentation and undo restores it", () => {
  const { run, editor } = setup();
  [
    "init",
    "create g g",
    "create rect r 0 0 1 1 in g",
    "set g fill red",
  ].forEach(run);
  assert.equal(editor.document().find("g").get("fill"), "red");
  assert.equal(editor.document().find("r").get("fill"), "");
  run("undo");
  assert.equal(editor.document().find("g").get("fill"), "");
});
test("delete subtree and restore whole subtree with one undo", () => {
  const { run } = setup();
  [
    "init",
    "create g g",
    "create g h in g",
    "create circle c 1 1 1 in h",
  ].forEach(run);
  const before = run("tree");
  run("delete g");
  assert.equal(run("tree"), "svg (800x600)");
  run("undo");
  assert.equal(run("tree"), before);
  run("redo");
  assert.equal(run("tree"), "svg (800x600)");
});
test("front is last SVG child, back is first, scope remains sibling only", () => {
  const { run, editor } = setup();
  [
    "init",
    "create g g",
    "create circle a 1 1 1 in g",
    "create circle b 1 1 1 in g",
    "front a",
  ].forEach(run);
  assert.deepEqual(
    editor
      .document()
      .find("g")
      .children.map((s) => s.id),
    ["b", "a"],
  );
  run("back a");
  assert.deepEqual(
    editor
      .document()
      .find("g")
      .children.map((s) => s.id),
    ["a", "b"],
  );
});
test("addto appends, cycles and parent-child grouping fail atomically", () => {
  const { run, editor } = setup();
  ["init", "create g g", "create g h in g", "create circle c 1 1 1"].forEach(
    run,
  );
  run("addto h c");
  assert.equal(editor.document().parentLabel("c"), "g#h");
  const before = run("tree");
  for (const cmd of [
    "addto h g",
    "addto g g",
    "group bad g c",
    "group bad c g",
    "group bad c c",
  ]) {
    assert.match(run(cmd), /^error:/);
    assert.equal(run("tree"), before);
  }
  run("undo");
  assert.equal(editor.document().parentLabel("c"), "svg");
});
test("top-level ungroup is forbidden, leaf ungroup errors", () => {
  const { run } = setup();
  ["init", "create g scene", "create circle c 1 1 1"].forEach(run);
  assert.equal(
    run("ungroup scene"),
    "error: cannot ungroup top-level container: scene",
  );
  assert.equal(run("ungroup c"), "error: not a container: c");
});
test("failure does not clear redo or mutate state, successful edit does", () => {
  const { run } = setup();
  ["init", "create rect r 1 2 3 4", "move r 10 0", "undo"].forEach(run);
  assert.match(run("set r width -1"), /^error:/);
  assert.match(run("redo"), /^redone:/);
  run("undo");
  run("set r fill blue");
  assert.equal(run("redo"), "error: nothing to redo");
});
for (const command of [
  "init 500 400",
  "save doc.svg",
  "canvas 500 400",
  "read valid.svg",
])
  test(`IO barrier: ${command}`, () => {
    const { run, files } = setup();
    files.write("valid.svg", svg(""));
    ["init", "create circle c 1 1 1"].forEach(run);
    assert.doesNotMatch(run(command), /^error:/);
    assert.equal(run("undo"), "error: undo not allowed after io command");
    assert.equal(run("redo"), "error: undo not allowed after io command");
    run("create g new");
    assert.match(run("undo"), /^undone:/);
    assert.equal(run("undo"), "error: nothing to undo");
  });
test("display commands and failed IO preserve undo history", () => {
  const { run, files } = setup();
  files.write("bad.svg", "<svg><rect></svg>");
  ["init", "create rect r 0 0 1 1"].forEach(run);
  for (const cmd of [
    "tree",
    "tree r",
    "show r",
    "help",
    "canvas",
    "save blocked.svg",
    "read absent.svg",
    "read bad.svg",
    "canvas -1 10",
  ])
    run(cmd);
  assert.match(run("undo"), /^undone:/);
  assert.equal(run("tree"), "svg (800x600)");
});
test("save default path tracks read/save; init clears path", () => {
  const { run, files } = setup();
  files.write("a.svg", svg(""));
  run("read a.svg");
  assert.match(run("save"), /^saved to a.svg/);
  run("save b.svg");
  assert.match(run("save"), /^saved to b.svg/);
  run("init");
  assert.match(run("save"), /^error: no file path/);
});
test("IDs are case sensitive and generated IDs reserve later explicit IDs", () => {
  const { run, files, editor } = setup();
  files.write(
    "ids.svg",
    svg('<rect/><rect id="rect1"/><g><circle/><circle id="circle1"/></g>'),
  );
  const output = run("read ids.svg");
  assert.match(output, /warning: assigned id rect2 to unnamed <rect>/);
  assert.match(output, /warning: assigned id circle2 to unnamed <circle>/);
  assert.equal(editor.document().all().length, 5);
  run("create g G");
  assert.doesNotMatch(run("create g g"), /^error:/);
  assert.equal(run("create g G"), "error: id already exists: G");
});
test("duplicate IDs in file reject whole read without replacing current document", () => {
  const { run, files } = setup();
  ["init", "create g before"].forEach(run);
  files.write("bad.svg", svg('<rect id="a"/><g><circle id="a"/></g>'));
  assert.equal(run("read bad.svg"), "error: id already exists: a");
  assert.match(run("tree"), /g#before/);
  assert.match(run("undo"), /^undone:/);
});
test("round trip retains all geometry, hierarchy, colors, XML escaping and whitespace", () => {
  const { run, editor, files } = setup();
  [
    "init 200 100",
    "create g root",
    "create rect r -1.5 2.1 10 20 #fff in root",
    'create text t 1 2 "  A & <B> \"引号\"  " in root',
    "set r stroke-width 2",
    "create ellipse e 2 3 4 5 red",
    "create line l 1 2 3 4 black",
  ].forEach(run);
  const before = run("tree");
  run("save round.svg");
  assert.match(files.read("round.svg"), /&amp;/);
  run("read round.svg");
  assert.equal(run("tree"), before);
  assert.equal(editor.document().width, 200);
});
test("unknown types including box remain outside phase 1", () => {
  const { run } = setup();
  run("init");
  assert.equal(
    run('create box n 0 0 1 1 "title"'),
    "error: unknown shape type: box (is the plugin loaded?)",
  );
});
for (const [cmd, message] of [
  ["create rect other 0 0 1 1 in missing", "no such container: missing"],
  ["create circle c 1 1 1 in r", "not a container: r"],
  ["delete missing", "no such shape: missing"],
  ["set r id new", "unknown attribute: id"],
  ["set r r 2", "unknown attribute: r"],
  ["scale r 0", "scale factor must be positive"],
  ["scale r -1", "scale factor must be positive"],
  ["set r width NaN", "invalid number: NaN"],
  ["set r x Infinity", "invalid number: Infinity"],
  ["create circle c 0 0 -1", "r must be non-negative"],
  ['create text t 0 0 "bad', "unterminated double quote"],
  ["move r 1 2 extra", "usage: move <id> <dx> <dy>"],
] as const)
  test(`validation: ${cmd}`, () => {
    const { run } = setup();
    ["init", "create rect r 0 0 1 1"].forEach(run);
    const before = run("tree");
    assert.equal(run(cmd), `error: ${message}`);
    assert.equal(run("tree"), before);
  });
test("numeric overflow during composite edit rolls back earlier changed child", () => {
  const { run } = setup();
  [
    "init",
    "create g g",
    "create rect a 1 1 1 1 in g",
    "create rect b 1e308 1 1 1 in g",
  ].forEach(run);
  const before = run("tree");
  assert.equal(run("scale g 2"), "error: numeric overflow");
  assert.equal(run("tree"), before);
});
test("explicit ID can equal implementation root name", () => {
  const { run } = setup();
  run("init");
  assert.doesNotMatch(run("create g __canvas__"), /^error:/);
});
test("tree subtree and show report parent and values", () => {
  const { run } = setup();
  ["init", "create g parent", "create circle c 50 60 20 red in parent"].forEach(
    run,
  );
  assert.match(run("tree c"), /^circle#c cx=50 cy=60 r=20 fill=red$/);
  assert.match(run("show c"), /parent=g#parent/);
});
test("import transform normalization, viewBox and presentation survive", () => {
  const { run, files, editor } = setup();
  files.write(
    "trans.svg",
    '<svg viewBox="10 20 400 300"><g id="g" transform="translate(60,40)"><g id="h" transform="translate(200,0) scale(0.8)"><rect id="r" width="120" height="60"/><text id="t" x="60" y="38" font-size="16">End</text></g></g></svg>',
  );
  assert.doesNotMatch(run("read trans.svg"), /^error:/);
  assert.equal(editor.document().find("r").get("x"), "260");
  assert.equal(editor.document().find("r").get("width"), "96");
  assert.equal(editor.document().find("t").get("font-size"), "12.8");
  run("save trans2.svg");
  assert.match(files.read("trans2.svg"), /viewBox="10 20 400 300"/);
});
for (const body of [
  "<!DOCTYPE svg><svg/>",
  "<svg><script/></svg>",
  '<svg><rect onclick="alert(1)"/></svg>',
  '<svg><rect transform="rotate(30)"/></svg>',
  "<svg><text><tspan>x</tspan></text></svg>",
  '<svg style="background:red"/>',
  '<svg><path d="M0 0"/></svg>',
])
  test(`unsupported input rejected: ${body}`, () => {
    assert.throws(() => new SvgCodec().decode(body));
  });

test("nested imported scales resolve inherited font and stroke widths once", () => {
  const { run, files, editor } = setup();
  files.write(
    "inherit.svg",
    svg(
      '<g id="outer" font-size="20" stroke-width="4" transform="scale(2)"><g id="inner" transform="scale(3)"><text id="t" x="1">A</text><line id="l" x2="1"/></g></g>',
    ),
  );
  assert.doesNotMatch(run("read inherit.svg"), /^error:/);
  const d = editor.document();
  assert.equal(d.find("t").get("font-size"), "120");
  assert.equal(d.find("t").get("stroke-width"), "24");
  assert.equal(d.find("t").get("x"), "6");
  assert.equal(d.find("l").get("stroke-width"), "24");
});
test("empty text, escaped quotes and hash colors survive tokenizer", () => {
  const { run, editor } = setup();
  [
    "init",
    'create text empty 0 0 ""',
    'create text quote 0 0 "a \\"b\\""',
    "create rect r 0 0 1 1 #aabbcc",
  ].forEach(run);
  assert.equal(editor.document().find("empty").get("text"), "");
  assert.equal(editor.document().find("quote").get("text"), 'a "b"');
  assert.equal(editor.document().find("r").get("fill"), "#aabbcc");
});
