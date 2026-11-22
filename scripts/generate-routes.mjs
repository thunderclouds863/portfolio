// Writes lib/generated/project-slugs.json: the slugs of PUBLISHED case studies.
// proxy.ts uses it to answer unknown /projects/<slug> URLs with a real HTTP 404
// before streaming starts (Cache Components would otherwise send 200 + noindex).
// Runs before dev, build and typecheck (package.json). No dependencies.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const projectsDir = path.join(root, "content", "projects");
const outFile = path.join(root, "lib", "generated", "project-slugs.json");

function isPublished(file) {
  const source = readFileSync(file, "utf8");
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(source)?.[1] ?? "";
  return /^status:\s*["']?published["']?\s*$/m.test(frontmatter);
}

const slugs = existsSync(projectsDir)
  ? readdirSync(projectsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .filter((slug) => {
        const file = path.join(projectsDir, slug, "index.mdoc");
        return existsSync(file) && isPublished(file);
      })
      .sort()
  : [];

mkdirSync(path.dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(slugs, null, 2)}\n`);
console.log(`project-slugs.json: ${slugs.length} published project(s)`);
