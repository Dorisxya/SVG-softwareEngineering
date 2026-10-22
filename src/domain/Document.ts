import { Shape } from "./Shape.js";
import { Group } from "./Group.js";
import { Numbers } from "./Numbers.js";
export class Document {
  private root: Group = new Group("__canvas__");
  private w: number;
  private h: number;
  private box: string;
  constructor(width = 800, height = 600, viewBox?: string) {
    this.w = Numbers.positive(width);
    this.h = Numbers.positive(height);
    this.box = viewBox ?? `0 0 ${width} ${height}`;
  }
  get width(): number {
    return this.w;
  }
  get height(): number {
    return this.h;
  }
  get viewBox(): string {
    return this.box;
  }
  get children(): readonly Shape[] {
    return this.root.children;
  }
  resize(w: number, h: number): void {
    Numbers.positive(w);
    Numbers.positive(h);
    this.w = w;
    this.h = h;
    this.box = `0 0 ${w} ${h}`;
  }
  all(): Shape[] {
    const result: Shape[] = [];
    const visit = (items: readonly Shape[]) => {
      for (const s of items) {
        result.push(s);
        visit(s.children);
      }
    };
    visit(this.children);
    return result;
  }
  find(id: string): Shape {
    const s = this.all().find((s) => s.id === id);
    if (!s) throw new Error(`no such shape: ${id}`);
    return s;
  }
  ensureNew(id: string): void {
    if (this.all().some((s) => s.id === id))
      throw new Error(`id already exists: ${id}`);
  }
  container(id?: string): Group {
    if (id === undefined) return this.root;
    const s = this.all().find((s) => s.id === id);
    if (!s) throw new Error(`no such container: ${id}`);
    if (!(s instanceof Group)) throw new Error(`not a container: ${id}`);
    return s;
  }
  parent(id: string): Group {
    const seek = (g: Group): Group | undefined => {
      for (const s of g.children) {
        if (s.id === id) return g;
        if (s instanceof Group) {
          const p = seek(s);
          if (p) return p;
        }
      }
    };
    const p = seek(this.root);
    if (!p) throw new Error(`no such shape: ${id}`);
    return p;
  }
  parentLabel(id: string): string {
    const p = this.parent(id);
    return p === this.root ? "svg" : p.label;
  }
  insert(shape: Shape, parentId?: string): void {
    const ids = new Set<string>();
    const check = (s: Shape) => {
      this.ensureNew(s.id);
      if (ids.has(s.id)) throw new Error(`id already exists: ${s.id}`);
      ids.add(s.id);
      s.children.forEach(check);
    };
    check(shape);
    this.container(parentId).insert(shape);
  }
  delete(id: string): Shape {
    const s = this.find(id);
    this.parent(id).remove(s);
    return s;
  }
  group(id: string, ids: readonly string[]): void {
    this.ensureNew(id);
    if (!ids.length) throw new Error("group requires at least one shape");
    if (new Set(ids).size !== ids.length)
      throw new Error("duplicate group member");
    const shapes = ids.map((id) => this.find(id));
    for (const s of shapes)
      if (shapes.some((other) => other !== s && s.contains(other.id)))
        throw new Error(
          `cannot group a container into its own descendant: ${s.id}`,
        );
    // Preserve document preorder, independent of the order of command arguments.
    const ordered = this.all().filter((s) => shapes.includes(s));
    const parents = ordered.map((s) => this.parent(s.id));
    const sameParent = parents.every((p) => p === parents[0]);
    const common = sameParent ? parents[0]! : this.root;
    const index = sameParent
      ? common.children.indexOf(ordered[0]!)
      : common.children.length;
    const g = new Group(id);
    for (const s of ordered) {
      this.parent(s.id).remove(s);
      g.insert(s);
    }
    common.insert(g, index);
  }
  ungroup(id: string): void {
    const g = this.container(id);
    const parent = this.parent(id);
    if (parent === this.root)
      throw new Error(`cannot ungroup top-level container: ${id}`);
    const index = parent.remove(g);
    g.children.forEach((s, i) => {
      g.remove(s);
      parent.insert(s, index + i);
    });
  }
  addTo(gid: string, id: string): void {
    const g = this.container(gid),
      s = this.find(id);
    if (s.contains(gid))
      throw new Error(
        `cannot group a container into its own descendant: ${id}`,
      );
    this.parent(id).remove(s);
    g.insert(s);
  }
  reorder(id: string, front: boolean): void {
    const s = this.find(id),
      p = this.parent(id);
    p.remove(s);
    p.insert(s, front ? p.children.length : 0);
  }
  clone(): Document {
    const d = new Document(this.w, this.h, this.box);
    d.root = this.root.clone();
    return d;
  }
}
