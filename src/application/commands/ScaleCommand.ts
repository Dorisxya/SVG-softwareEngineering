import { Command } from "../Command.js";
import { Document } from "../../domain/Document.js";

export class ScaleCommand implements Command {
  constructor(
    private readonly id: string,
    private readonly factor: number,
  ) {}
  execute(document: Document): string {
    const shape = document.find(this.id);
    shape.scale(this.factor);
    return `${shape.label} scaled by ${this.factor}`;
  }
}
