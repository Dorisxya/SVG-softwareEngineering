import { Document } from "../domain/Document.js";
import { Shape } from "../domain/Shape.js";
export class TreeRenderer {
  tree(doc: Document, id?: string): string {
    const root = id ? doc.find(id) : undefined;
    const lines = [root ? root.summary() : `svg (${doc.width}x${doc.height})`];
    const visit = (children: readonly Shape[], prefix: string) =>
      children.forEach((child, i) => {
        const last = i === children.length - 1;
        lines.push(`${prefix}${last ? "└── " : "├── "}${child.summary()}`);
        visit(child.children, prefix + (last ? "    " : "│   "));
      });
    visit(root ? root.children : doc.children, "");
    return lines.join("\n");
  }
  show(doc: Document, id: string): string {
    const shape = doc.find(id);
    return `${shape.label}  parent=${doc.parentLabel(id)}\n  ${shape.details()}`;
  }
}
