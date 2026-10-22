import { Document } from "../domain/Document.js";
export interface DocumentCodec {
  decode(source: string): { document: Document; warnings: string[] };
  encode(document: Document): string;
}
