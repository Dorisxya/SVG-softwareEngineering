import { DOMParser, XMLSerializer, DOMImplementation } from "@xmldom/xmldom";
import { Document } from "../domain/Document.js";
import { Shape } from "../domain/Shape.js";
import { ShapeFactory } from "../domain/ShapeFactory.js";
import { Group } from "../domain/Group.js";
import { Text } from "../domain/Text.js";
import { Numbers } from "../domain/Numbers.js";
import { DocumentCodec } from "../ports/DocumentCodec.js";
export class SvgCodec implements DocumentCodec {
  private readonly namespace = "http://www.w3.org/2000/svg";
  private readonly presentation = new Set([
    "font-size",
    "font-family",
    "font-weight",
    "text-anchor",
    "dominant-baseline",
    "opacity",
    "fill-opacity",
    "stroke-opacity",
    "stroke-linecap",
    "stroke-linejoin",
    "stroke-dasharray",
    "visibility",
    "display",
    "data-kind",
  ]);
  encode(document: Document): string {
    const xml = new DOMImplementation().createDocument(
        this.namespace,
        "svg",
        null,
      ),
      root = xml.documentElement;
    root.setAttribute("xmlns", this.namespace);
    root.setAttribute("width", String(document.width));
    root.setAttribute("height", String(document.height));
    root.setAttribute("viewBox", document.viewBox);
    const append = (shape: Shape, parent: Element) => {
      const element = xml.createElementNS(this.namespace, shape.tag);
      element.setAttribute("id", shape.id);
      for (const [key, value] of shape.attributes())
        element.setAttribute(key, value);
      if (shape instanceof Text)
        element.appendChild(xml.createTextNode(shape.get("text")));
      for (const child of shape.children) append(child, element);
      parent.appendChild(element);
    };
    for (const shape of document.children) append(shape, root);
    return (
      '<?xml version="1.0" encoding="UTF-8"?>\n' +
      new XMLSerializer().serializeToString(xml) +
      "\n"
    );
  }
  decode(source: string): { document: Document; warnings: string[] } {
    if (/<!DOCTYPE|<!ENTITY/i.test(source))
      throw new Error("unsupported SVG: DTD and entities are not allowed");
    const errors: string[] = [];
    const xml = new DOMParser({
      errorHandler: {
        warning: (msg) => errors.push(msg),
        error: (msg) => errors.push(msg),
        fatalError: (msg) => errors.push(msg),
      },
    }).parseFromString(source, "image/svg+xml");
    if (errors.length || !xml.documentElement)
      throw new Error("invalid SVG XML");
    const root = xml.documentElement;
    if (
      root.localName !== "svg" ||
      (root.namespaceURI && root.namespaceURI !== this.namespace)
    )
      throw new Error("expected SVG root");
    const nodes = (parent: Element): Element[] => {
      const result: Element[] = [];
      for (let i = 0; i < parent.childNodes.length; i++) {
        const node = parent.childNodes.item(i)!;
        if (node.nodeType === 1) result.push(node as Element);
        else if (
          (node.nodeType === 3 || node.nodeType === 4) &&
          node.nodeValue?.trim()
        )
          throw new Error("unsupported text outside <text>");
      }
      return result;
    };
    const dimension = (name: string, fallback: number) =>
      root.hasAttribute(name)
        ? Numbers.parse(root.getAttribute(name)!.replace(/px$/, ""))
        : fallback;
    let viewBox: string | undefined;
    if (root.hasAttribute("viewBox")) {
      const values = root
        .getAttribute("viewBox")!
        .trim()
        .split(/[\s,]+/)
        .map((v) => Numbers.parse(v));
      if (values.length !== 4) throw new Error("invalid viewBox");
      Numbers.positive(values[2]!);
      Numbers.positive(values[3]!);
      viewBox = values.join(" ");
    }
    const view = viewBox?.split(" ").map(Number);
    const document = new Document(
      dimension("width", view?.[2] ?? 800),
      dimension("height", view?.[3] ?? 600),
      viewBox,
    );
    for (let i = 0; i < root.attributes.length; i++) {
      const key = root.attributes.item(i)!.name;
      if (
        !["xmlns", "width", "height", "viewBox", "version", "id"].includes(key)
      )
        throw new Error(`unsupported SVG root attribute: ${key}`);
    }
    const used = new Set<string>();
    const reserve = (element: Element) => {
      const id = element.getAttribute("id");
      if (id) {
        if (used.has(id)) throw new Error(`id already exists: ${id}`);
        used.add(id);
      }
      for (let i = 0; i < element.childNodes.length; i++) {
        const child = element.childNodes.item(i)!;
        if (child.nodeType === 1) reserve(child as Element);
      }
    };
    reserve(root);
    const warnings: string[] = [];
    const factory = new ShapeFactory();
    const parse = (
      element: Element,
      inherited: ReadonlyMap<string, string> = new Map(),
    ): Shape => {
      if (element.namespaceURI && element.namespaceURI !== this.namespace)
        throw new Error("unsupported element namespace");
      const type = element.localName;
      let id = element.getAttribute("id");
      if (!id) {
        let n = 1;
        while (used.has(`${type}${n}`)) n++;
        id = `${type}${n}`;
        used.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${type}>`);
      }
      const shape = factory.blank(type, id);
      for (let i = 0; i < element.attributes.length; i++) {
        const attr = element.attributes.item(i)!;
        if (["id", "transform", "xmlns"].includes(attr.name)) continue;
        if (this.presentation.has(attr.name)) {
          shape.importPresentation(attr.name, attr.value);
        } else shape.set(attr.name, attr.value);
      }
      const effective = new Map(inherited);
      for (const key of ["font-size", "stroke-width"])
        if (shape.attributes().has(key)) effective.set(key, shape.get(key));
      if (shape instanceof Text) {
        for (let i = 0; i < element.childNodes.length; i++)
          if (element.childNodes.item(i)!.nodeType === 1)
            throw new Error("unsupported nested element in <text>");
        shape.set("text", element.textContent ?? "");
      } else {
        const children = nodes(element);
        if (shape instanceof Group)
          for (const child of children) shape.insert(parse(child, effective));
        else if (children.length)
          throw new Error(`unsupported children in <${type}>`);
      }
      const transform = element.getAttribute("transform");
      if (transform) this.transform(shape, transform, inherited);
      return shape;
    };
    for (const child of nodes(root)) document.insert(parse(child));
    return { document, warnings };
  }
  private scalePresentation(
    shape: Shape,
    factor: number,
    inherited: ReadonlyMap<string, string>,
  ): void {
    const effective = new Map(inherited);
    for (const key of ["font-size", "stroke-width"])
      if (shape.attributes().has(key)) effective.set(key, shape.get(key));
    if (shape instanceof Group) {
      for (const child of shape.children)
        this.scalePresentation(child, factor, effective);
      return;
    }
    const width = Numbers.parse(
      (effective.get("stroke-width") ?? "1").replace(/px$/, ""),
    );
    shape.set("stroke-width", String(Numbers.finite(width * factor)));
    if (shape instanceof Text) {
      const size = Numbers.parse(
        (effective.get("font-size") ?? "16").replace(/px$/, ""),
      );
      shape.importPresentation(
        "font-size",
        String(Numbers.finite(size * factor)),
      );
    }
  }
  private transform(
    shape: Shape,
    source: string,
    inherited: ReadonlyMap<string, string>,
  ): void {
    // Normalize translate / positive uniform scale into geometry; SVG applies rightmost first.
    const operations: [string, number[]][] = [];
    const pattern = /([a-zA-Z]+)\s*\(([^)]*)\)/g;
    let end = 0;
    for (const match of source.matchAll(pattern)) {
      if (source.slice(end, match.index).replace(/[\s,]/g, ""))
        throw new Error("unsupported SVG transform");
      const name = match[1]!,
        args = match[2]!
          .trim()
          .split(/[\s,]+/)
          .filter(Boolean)
          .map((v) => Numbers.parse(v));
      if (
        !["translate", "scale"].includes(name) ||
        args.length < 1 ||
        args.length > 2
      )
        throw new Error("unsupported SVG transform");
      if (
        name === "scale" &&
        (args[0]! <= 0 || (args[1] !== undefined && args[1] !== args[0]))
      )
        throw new Error("only positive uniform SVG scale is supported");
      operations.push([name, args]);
      end = match.index! + match[0].length;
    }
    if (!operations.length || source.slice(end).trim())
      throw new Error("unsupported SVG transform");
    for (const [name, args] of operations.reverse()) {
      if (name === "translate") shape.move(args[0]!, args[1] ?? 0);
      else {
        shape.scale(args[0]!);
        this.scalePresentation(shape, args[0]!, inherited);
      }
    }
  }
}
