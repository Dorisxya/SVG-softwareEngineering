import { createInterface } from "node:readline";
import { Editor } from "../application/Editor.js";
import { NodeFileStore } from "../infrastructure/NodeFileStore.js";
import { SvgCodec } from "../infrastructure/SvgCodec.js";
import { CommandRouter } from "./CommandRouter.js";
const router = new CommandRouter(
  new Editor(new NodeFileStore(), new SvgCodec()),
);
const interactive = Boolean(process.stdin.isTTY);
const input = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: interactive,
});
if (interactive) {
  console.log("svg-editor 0.1 — type 'help' for commands");
  input.setPrompt("svg> ");
  input.prompt();
}
input.on("line", (line) => {
  const result = router.run(line);
  if (result) console.log(result);
  if (!interactive && result.startsWith("error:")) process.exitCode = 1;
  if (interactive) input.prompt();
});
