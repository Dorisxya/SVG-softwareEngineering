import { Command } from "../Command.js";
import { Document } from "../../domain/Document.js";

export class UngroupCommand implements Command {
  constructor(private readonly id: string) {}
  execute(document: Document): string {
    document.ungroup(this.id);
    return `g#${this.id} ungrouped`;
  }
}
