import { Command } from "../Command.js";
import { Document } from "../../domain/Document.js";

export class DeleteCommand implements Command {
  constructor(private readonly id: string) {}
  execute(document: Document): string {
    const shape = document.delete(this.id);
    return `${shape.label} deleted`;
  }
}
