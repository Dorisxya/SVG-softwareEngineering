export class Numbers {
  static parse(value: string): number {
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(value))
      throw new Error(`invalid number: ${value}`);
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`invalid number: ${value}`);
    return n;
  }
  static finite(n: number): number {
    if (!Number.isFinite(n)) throw new Error("numeric overflow");
    return n;
  }
  static positive(n: number, label = "dimension"): number {
    if (!(n > 0)) throw new Error(`${label} must be positive`);
    return this.finite(n);
  }
}
