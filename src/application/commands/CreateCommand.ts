import { Command } from "../Command.js";
import { Document } from "../../domain/Document.js";
import { ShapeFactory } from "../../domain/ShapeFactory.js";
export class CreateCommand implements Command {
  constructor(
    private readonly type: string,
    private readonly id: string,
    private readonly params: readonly string[],
    private readonly parent?: string,
  ) {}
  execute(document: Document): string {
    const shape = new ShapeFactory().create(this.type, this.id, this.params);
    document.insert(shape, this.parent);
    return `${shape.label} created${this.parent ? ` in g#${this.parent}` : ""}`;
  }
}
