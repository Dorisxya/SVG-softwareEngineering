import { Shape } from "./Shape.js";
export class Line extends Shape {
  constructor(id: string) {
    super(id, "line", ["x1", "y1", "x2", "y2"], ["x1", "x2"], ["y1", "y2"], []);
  }
  override summary(): string {
    return `${this.label} (${this.get("x1")},${this.get("y1")}) -> (${this.get("x2")},${this.get("y2")})${this.presentationSummary()}`;
  }
  clone(): Line {
    const result = new Line(this.id);
    this.copyProperties(result);
    return result;
  }
}
