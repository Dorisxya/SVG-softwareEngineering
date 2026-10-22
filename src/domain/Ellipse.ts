import { Shape } from "./Shape.js";
export class Ellipse extends Shape {
  constructor(id: string) {
    super(
      id,
      "ellipse",
      ["cx", "cy", "rx", "ry"],
      ["cx"],
      ["cy"],
      ["rx", "ry"],
    );
  }
  clone(): Ellipse {
    const result = new Ellipse(this.id);
    this.copyProperties(result);
    return result;
  }
}
