import { Shape } from "./Shape.js";
export class Rect extends Shape {
  constructor(id: string) {
    super(
      id,
      "rect",
      ["x", "y", "width", "height"],
      ["x"],
      ["y"],
      ["width", "height"],
    );
  }
  override summary(): string {
    return `${this.label} x=${this.get("x")} y=${this.get("y")} w=${this.get("width")} h=${this.get("height")}${this.presentationSummary()}`;
  }
  clone(): Rect {
    const result = new Rect(this.id);
    this.copyProperties(result);
    return result;
  }
}
