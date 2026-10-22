import { Command } from "../Command.js";
import { Document } from "../../domain/Document.js";

export class OrderCommand implements Command {
  constructor(
    private readonly id: string,
    private readonly front: boolean,
  ) {}
  execute(document: Document): string {
    document.reorder(this.id, this.front);
    return `${document.find(this.id).label} moved to ${this.front ? "front" : "back"}`;
  }
}
