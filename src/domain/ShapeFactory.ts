import { Shape } from "./Shape.js";
import { Rect } from "./Rect.js";
import { Circle } from "./Circle.js";
import { Ellipse } from "./Ellipse.js";
import { Line } from "./Line.js";
import { Text } from "./Text.js";
import { Group } from "./Group.js";
export class ShapeFactory {
  private readonly types = new Map<
    string,
    { make: (id: string) => Shape; required: string[]; optional?: string }
  >([
    [
      "rect",
      {
        make: (id) => new Rect(id),
        required: ["x", "y", "width", "height"],
        optional: "fill",
      },
    ],
    [
      "circle",
      {
        make: (id) => new Circle(id),
        required: ["cx", "cy", "r"],
        optional: "fill",
      },
    ],
    [
      "ellipse",
      {
        make: (id) => new Ellipse(id),
        required: ["cx", "cy", "rx", "ry"],
        optional: "fill",
      },
    ],
    [
      "line",
      {
        make: (id) => new Line(id),
        required: ["x1", "y1", "x2", "y2"],
        optional: "stroke",
      },
    ],
    ["text", { make: (id) => new Text(id), required: ["x", "y", "text"] }],
    ["g", { make: (id) => new Group(id), required: [] }],
  ]);
  private definition(type: string) {
    const entry = this.types.get(type);
    if (!entry)
      throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);
    return entry;
  }
  blank(type: string, id: string): Shape {
    return this.definition(type).make(id);
  }
  create(type: string, id: string, args: readonly string[]): Shape {
    const def = this.definition(type);
    if (
      args.length < def.required.length ||
      args.length > def.required.length + (def.optional ? 1 : 0)
    )
      throw new Error(
        `invalid parameters for ${type}: expected ${def.required.join(" ")}${def.optional ? ` [${def.optional}]` : ""}`,
      );
    const shape = def.make(id);
    def.required.forEach((key, i) => shape.set(key, args[i]!));
    if (def.optional && args.length > def.required.length)
      shape.set(def.optional, args[def.required.length]!);
    return shape;
  }
}
