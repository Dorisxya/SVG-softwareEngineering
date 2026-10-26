import { Editor } from "../application/Editor.js";
import { TreeRenderer } from "../application/TreeRenderer.js";
import { Numbers } from "../domain/Numbers.js";
import { Tokenizer } from "./Tokenizer.js";
import { CreateCommand } from "../application/commands/CreateCommand.js";
import { DeleteCommand } from "../application/commands/DeleteCommand.js";
import { MoveCommand } from "../application/commands/MoveCommand.js";
import { ScaleCommand } from "../application/commands/ScaleCommand.js";
import { SetCommand } from "../application/commands/SetCommand.js";
import { GroupCommand } from "../application/commands/GroupCommand.js";
import { UngroupCommand } from "../application/commands/UngroupCommand.js";
import { AddToCommand } from "../application/commands/AddToCommand.js";
import { OrderCommand } from "../application/commands/OrderCommand.js";

export class CommandRouter {
  private readonly handlers = new Map<
    string,
    {
      syntax: string;
      min: number;
      max: number;
      run: (args: string[]) => string;
    }
  >();
  constructor(private readonly editor: Editor) {
    const register = (
      name: string,
      syntax: string,
      min: number,
      max: number,
      run: (args: string[]) => string,
    ) => this.handlers.set(name, { syntax, min, max, run });
    register("init", "init [w] [h]", 0, 2, (a) =>
      editor.init(
        a[0] === undefined ? 800 : Numbers.parse(a[0]),
        a[1] === undefined ? 600 : Numbers.parse(a[1]),
      ),
    );
    register("read", "read <file.svg>", 1, 1, (a) => editor.read(a[0]!));
    register("save", "save [file.svg]", 0, 1, (a) => editor.save(a[0]));
    register("canvas", "canvas [w h]", 0, 2, (a) => editor.canvas(a));
    register(
      "create",
      "create <rect|circle|ellipse|line|text|g> <id> [params] [in <containerId>]",
      2,
      Infinity,
      (a) => {
        const params = a.slice(2);
        let parent: string | undefined;
        if (params.length >= 2 && params.at(-2) === "in") {
          parent = params.pop()!;
          params.pop();
        }
        return editor.execute(new CreateCommand(a[0]!, a[1]!, params, parent));
      },
    );
    register("delete", "delete <id>", 1, 1, (a) =>
      editor.execute(new DeleteCommand(a[0]!)),
    );
    register("move", "move <id> <dx> <dy>", 3, 3, (a) =>
      editor.execute(
        new MoveCommand(a[0]!, Numbers.parse(a[1]!), Numbers.parse(a[2]!)),
      ),
    );
    register("scale", "scale <id> <factor>", 2, 2, (a) =>
      editor.execute(new ScaleCommand(a[0]!, Numbers.parse(a[1]!))),
    );
    register("set", "set <id> <attr> <value>", 3, 3, (a) =>
      editor.execute(new SetCommand(a[0]!, a[1]!, a[2]!)),
    );
    register("group", "group <newGid> <id1> [id2 ...]", 2, Infinity, (a) =>
      editor.execute(new GroupCommand(a[0]!, a.slice(1))),
    );
    register("ungroup", "ungroup <gid>", 1, 1, (a) =>
      editor.execute(new UngroupCommand(a[0]!)),
    );
    register("addto", "addto <gid> <id>", 2, 2, (a) =>
      editor.execute(new AddToCommand(a[0]!, a[1]!)),
    );
    register("front", "front <id>", 1, 1, (a) =>
      editor.execute(new OrderCommand(a[0]!, true)),
    );
    register("back", "back <id>", 1, 1, (a) =>
      editor.execute(new OrderCommand(a[0]!, false)),
    );
    register("tree", "tree [id]", 0, 1, (a) =>
      new TreeRenderer().tree(editor.document(), a[0]),
    );
    register("show", "show <id>", 1, 1, (a) =>
      new TreeRenderer().show(editor.document(), a[0]!),
    );
    register("undo", "undo", 0, 0, () => {
      editor.document();
      return editor.undo();
    });
    register("redo", "redo", 0, 0, () => {
      editor.document();
      return editor.redo();
    });
    register(
      "help",
      "help",
      0,
      0,
      () =>
        [...this.handlers.values()].map((h) => h.syntax).join("\n") +
        '\nrect: x y w h [fill] | circle: cx cy r [fill] | ellipse: cx cy rx ry [fill]\nline: x1 y1 x2 y2 [stroke] | text: x y "content" | g: no parameters\nEOF (Ctrl-D) to exit. # at start of line is a comment.',
    );
  }
  run(line: string): string {
    try {
      const tokens = new Tokenizer().parse(line);
      if (!tokens.length) return "";
      const name = tokens.shift()!;
      const h = this.handlers.get(name);
      if (!h) throw new Error(`unknown command: ${name}`);
      if (!["help", "init", "read"].includes(name)) this.editor.document();
      if (tokens.length < h.min || tokens.length > h.max)
        throw new Error(`usage: ${h.syntax}`);
      return h.run(tokens);
    } catch (error) {
      return `error: ${error instanceof Error ? error.message.replace(/[\r\n]+/g, " ") : String(error)}`;
    }
  }
}
