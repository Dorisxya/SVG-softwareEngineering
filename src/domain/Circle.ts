import { Shape } from "./Shape.js";
export class Circle extends Shape {
  constructor(id: string) {
    super(id, "circle", ["cx", "cy", "r"], ["cx"], ["cy"], ["r"]);
  }
  clone(): Circle {
    const result = new Circle(this.id);
    this.copyProperties(result);
    return result;
  }
}
