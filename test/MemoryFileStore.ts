import { FileStore } from "../src/ports/FileStore.js";
export class MemoryFileStore implements FileStore {
  private values = new Map<string, string>();
  read(path: string): string {
    const value = this.values.get(path);
    if (value === undefined) throw new Error(`cannot read file: ${path}`);
    return value;
  }
  write(path: string, value: string): void {
    if (path === "blocked.svg") throw new Error(`cannot write file: ${path}`);
    this.values.set(path, value);
  }
}
