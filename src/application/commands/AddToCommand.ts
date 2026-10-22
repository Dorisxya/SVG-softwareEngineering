import { Command } from "../Command.js";
import { Document } from "../../domain/Document.js";

export class AddToCommand implements Command {
  constructor(
    private readonly gid: string,
    private readonly id: string,
  ) {}
  execute(document: Document): string {
    document.addTo(this.gid, this.id);
    return `${document.find(this.id).label} added to g#${this.gid}`;
  }
}
