import { Document } from "../domain/Document.js";
import { Numbers } from "../domain/Numbers.js";
import { FileStore } from "../ports/FileStore.js";
import { DocumentCodec } from "../ports/DocumentCodec.js";
import { Command } from "./Command.js";
import { HistoryEntry } from "./HistoryEntry.js";
export class Editor {
  private current?: Document;
  private path?: string;
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private blocked = true;
  constructor(
    private readonly files: FileStore,
    private readonly codec: DocumentCodec,
  ) {}
  document(): Document {
    if (!this.current)
      throw new Error("no document. use 'init' or 'read' first");
    return this.current.clone();
  }
  private barrier(): void {
    this.past = [];
    this.future = [];
    this.blocked = true;
  }
  init(w = 800, h = 600): string {
    const doc = new Document(w, h);
    this.current = doc;
    this.path = undefined;
    this.barrier();
    return `canvas ${w}x${h} created`;
  }
  read(path: string): string {
    const source = this.files.read(path);
    const { document, warnings } = this.codec.decode(source);
    this.current = document;
    this.path = path;
    this.barrier();
    return [
      ...warnings,
      `read ${path} (${document.all().length} elements)`,
    ].join("\n");
  }
  save(path?: string): string {
    const doc = this.document();
    const target = path ?? this.path;
    if (!target) throw new Error("no file path. use save <file.svg>");
    this.files.write(target, this.codec.encode(doc));
    this.path = target;
    this.barrier();
    return `saved to ${target} (${doc.all().length} elements)`;
  }
  canvas(args: readonly string[]): string {
    const doc = this.document();
    if (args.length === 0) return `canvas ${doc.width}x${doc.height}`;
    if (args.length !== 2) throw new Error("usage: canvas [w h]");
    doc.resize(Numbers.parse(args[0]!), Numbers.parse(args[1]!));
    this.current = doc;
    this.barrier();
    return `canvas resized to ${doc.width}x${doc.height}`;
  }
  execute(command: Command): string {
    const before = this.document(),
      after = before.clone();
    const message = command.execute(after);
    this.past.push(new HistoryEntry(before, after.clone(), message));
    this.current = after;
    this.future = [];
    this.blocked = false;
    return message;
  }
  undo(): string {
    if (this.blocked) throw new Error("undo not allowed after io command");
    const entry = this.past.at(-1);
    if (!entry) throw new Error("nothing to undo");
    this.current = entry.undo();
    this.past.pop();
    this.future.push(entry);
    return `undone: ${entry.description}`;
  }
  redo(): string {
    if (this.blocked) throw new Error("undo not allowed after io command");
    const entry = this.future.at(-1);
    if (!entry) throw new Error("nothing to redo");
    this.current = entry.redo();
    this.future.pop();
    this.past.push(entry);
    return `redone: ${entry.description}`;
  }
}
