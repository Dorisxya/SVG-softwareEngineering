import { Command } from "../Command.js";
import { Document } from "../../domain/Document.js";

export class SetCommand implements Command {
  constructor(
    private readonly id: string,
    private readonly attr: string,
    private readonly value: string,
  ) {}
  execute(document: Document): string {
    const shape = document.find(this.id);
    shape.set(this.attr, this.value);
    return `${shape.label} updated: ${this.attr}=${JSON.stringify(this.value)}`;
  }
}
