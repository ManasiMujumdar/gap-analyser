// pdfjs-dist needs its standard font metrics servable as static files for
// PDFs that use standard (non-embedded) fonts - common in resumes exported
// from Word/Google Docs. Copied into public/ on every install so it stays
// in sync with whatever pdfjs-dist version is actually installed, rather
// than a one-off manual copy that could silently go stale.
import { cpSync, existsSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

// Resolve via the package's own manifest rather than assuming a fixed
// node_modules layout - in this npm workspace, pdfjs-dist is hoisted to the
// repo root, not frontend/node_modules.
const pdfjsPackageJson = fileURLToPath(import.meta.resolve("pdfjs-dist/package.json"));
const pdfjsRoot = path.dirname(pdfjsPackageJson);
const src = path.join(pdfjsRoot, "standard_fonts");
const dest = path.join(root, "..", "public", "standard_fonts");

if (!existsSync(src)) {
  console.warn("pdfjs-dist standard_fonts not found - skipping copy (is pdfjs-dist installed?)");
  process.exit(0);
}

if (existsSync(dest)) rmSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied pdfjs-dist standard_fonts to ${path.relative(process.cwd(), dest)}`);
