import { Command } from "../Command.js";
import { Document } from "../../domain/Document.js";

export class GroupCommand implements Command {
  constructor(
    private readonly id: string,
    private readonly members: readonly string[],
  ) {}
  execute(document: Document): string {
    document.group(this.id, this.members);
    return `g#${this.id} created with ${this.members.length} children`;
  }
}
