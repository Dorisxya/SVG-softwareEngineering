import { Document } from "../domain/Document.js";
export interface Command {
  execute(document: Document): string;
}
