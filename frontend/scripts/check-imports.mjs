import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "@babel/parser";

const root = fileURLToPath(new URL("../", import.meta.url));
const sourceRoot = path.join(root, "src");
const manifest = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const dependencies = new Set([
  ...Object.keys(manifest.dependencies),
  ...Object.keys(manifest.devDependencies),
]);
const errors = [];
let fileCount = 0;
let importCount = 0;

async function* sourceFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) yield* sourceFiles(fullPath);
    else if (/\.(js|jsx)$/.test(entry.name)) yield fullPath;
  }
}

function importsFrom(node, imports = []) {
  if (!node || typeof node !== "object") return imports;
  if (["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type) && node.source) {
    imports.push(node.source.value);
  }
  if (node.type === "CallExpression" && node.callee.type === "Import" && node.arguments[0]?.type === "StringLiteral") {
    imports.push(node.arguments[0].value);
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => importsFrom(child, imports));
    else if (value && typeof value === "object") importsFrom(value, imports);
  }
  return imports;
}

async function isFile(filename) {
  try {
    return (await stat(filename)).isFile();
  } catch {
    return false;
  }
}

for await (const filename of sourceFiles(sourceRoot)) {
  fileCount += 1;
  const relativeName = path.relative(root, filename);
  let ast;
  try {
    ast = parse(await readFile(filename, "utf8"), { sourceType: "module", plugins: ["jsx"] });
  } catch (error) {
    errors.push(`${relativeName}: ${error.message}`);
    continue;
  }
  for (const specifier of importsFrom(ast)) {
    importCount += 1;
    if (specifier.startsWith("@/") || specifier.startsWith(".")) {
      const target = specifier.startsWith("@/")
        ? path.join(sourceRoot, specifier.slice(2))
        : path.resolve(path.dirname(filename), specifier);
      const candidates = [target, `${target}.js`, `${target}.jsx`, `${target}.json`, path.join(target, "index.js"), path.join(target, "index.jsx")];
      if (!(await Promise.all(candidates.map(isFile))).some(Boolean)) {
        errors.push(`${relativeName}: unresolved import ${specifier}`);
      }
    } else {
      const packageName = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
      if (!dependencies.has(packageName)) errors.push(`${relativeName}: undeclared dependency ${packageName}`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Verified ${fileCount} source files and ${importCount} imports.`);
}
