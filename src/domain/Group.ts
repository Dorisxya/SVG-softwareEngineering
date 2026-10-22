import { Shape } from "./Shape.js";
export class Group extends Shape {
  private items: Shape[] = [];
  constructor(id: string) {
    super(id, "g", [], [], []);
  }
  override get children(): readonly Shape[] {
    return [...this.items];
  }
  insert(shape: Shape, index = this.items.length): void {
    const containsSelf = (node: Shape): boolean =>
      node === this || node.children.some(containsSelf);
    if (containsSelf(shape))
      throw new Error(
        `cannot group a container into its own descendant: ${shape.id}`,
      );
    this.items.splice(index, 0, shape);
  }
  remove(shape: Shape): number {
    const i = this.items.indexOf(shape);
    if (i < 0) throw new Error(`no such shape: ${shape.id}`);
    this.items.splice(i, 1);
    return i;
  }
  override move(dx: number, dy: number): void {
    for (const child of this.items) child.move(dx, dy);
  }
  override scale(factor: number): void {
    super.scale(factor);
    for (const child of this.items) child.scale(factor);
  }
  clone(): Group {
    const result = new Group(this.id);
    this.copyProperties(result);
    for (const child of this.items) result.insert(child.clone());
    return result;
  }
}
