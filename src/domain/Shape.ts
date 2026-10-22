import { Numbers } from "./Numbers.js";
export abstract class Shape {
  private properties: Map<string, string> = new Map();
  constructor(
    readonly id: string,
    readonly tag: string,
    private readonly geometry: readonly string[],
    private readonly xKeys: readonly string[],
    private readonly yKeys: readonly string[],
    private readonly sizes: readonly string[] = [],
  ) {
    if (!id || /\s/.test(id))
      throw new Error("id must be nonempty and contain no whitespace");
    for (const key of geometry) this.properties.set(key, "0");
  }
  get label(): string {
    return `${this.tag}#${this.id}`;
  }
  get children(): readonly Shape[] {
    return [];
  }
  attributes(): ReadonlyMap<string, string> {
    return new Map(this.properties);
  }
  get(key: string): string {
    return this.properties.get(key) ?? "";
  }
  set(key: string, value: string): void {
    if (![...this.geometry, "fill", "stroke", "stroke-width"].includes(key))
      throw new Error(`unknown attribute: ${key}`);
    if (this.geometry.includes(key) || key === "stroke-width") {
      const n = Numbers.parse(value);
      if ((this.sizes.includes(key) || key === "stroke-width") && n < 0)
        throw new Error(`${key} must be non-negative`);
      value = String(n);
    }
    this.properties.set(key, value);
  }
  // Import-only presentation attributes remain immutable through the CLI whitelist.
  importPresentation(key: string, value: string): void {
    this.properties.set(key, value);
  }
  move(dx: number, dy: number): void {
    for (const key of this.xKeys)
      this.set(key, String(Numbers.finite(Number(this.get(key)) + dx)));
    for (const key of this.yKeys)
      this.set(key, String(Numbers.finite(Number(this.get(key)) + dy)));
  }
  scale(factor: number): void {
    Numbers.positive(factor, "scale factor");
    for (const key of this.geometry)
      this.set(key, String(Numbers.finite(Number(this.get(key)) * factor)));
  }
  protected presentationSummary(): string {
    return [...this.attributes()]
      .filter(([key]) => !this.geometry.includes(key))
      .map(([key, value]) => ` ${key}=${value}`)
      .join("");
  }
  details(): string {
    return [...this.attributes()]
      .map(([key, value]) => `${key}=${value}`)
      .join(" ");
  }
  summary(): string {
    return `${this.label}${[...this.properties].map(([k, v]) => ` ${k}=${v}`).join("")}`;
  }
  contains(id: string): boolean {
    return this.id === id || this.children.some((child) => child.contains(id));
  }
  protected copyProperties(target: Shape): void {
    target.properties = new Map(this.properties);
  }
  abstract clone(): Shape;
}
