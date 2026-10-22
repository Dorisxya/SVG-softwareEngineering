import { Shape } from "./Shape.js";
export class Text extends Shape {
  private content = "";
  constructor(id: string) {
    super(id, "text", ["x", "y"], ["x"], ["y"]);
  }
  override get(key: string): string {
    return key === "text" ? this.content : super.get(key);
  }
  override set(key: string, value: string): void {
    if (key === "text") this.content = value;
    else super.set(key, value);
  }
  override summary(): string {
    return `${this.label} (${this.get("x")},${this.get("y")}) ${JSON.stringify(this.content)}${this.presentationSummary()}`;
  }
  override details(): string {
    return `${super.details()} text=${JSON.stringify(this.content)}`;
  }
  clone(): Text {
    const result = new Text(this.id);
    this.copyProperties(result);
    result.content = this.content;
    return result;
  }
}
