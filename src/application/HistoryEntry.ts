import { Document } from "../domain/Document.js";
export class HistoryEntry {
  constructor(
    private readonly before: Document,
    private readonly after: Document,
    readonly description: string,
  ) {}
  undo(): Document {
    return this.before.clone();
  }
  redo(): Document {
    return this.after.clone();
  }
}
