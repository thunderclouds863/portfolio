import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const CONTENT_BRANCH_RE = /^content\/[a-z0-9][a-z0-9/_-]*$/i;
const ALLOWED_CONTENT_FILE_RE =
  /^content\/(?:[a-z0-9][a-z0-9._-]*\/)*[a-z0-9][a-z0-9._-]*\.(?:ya?ml|mdoc)$/i;
const ALLOWED_IMAGE_FILE_RE =
  /^public\/images\/(?:[a-z0-9][a-z0-9._-]*\/)*[a-z0-9][a-z0-9._-]*\.(?:png|jpe?g|webp|avif)$/i;
const FORBIDDEN_SEGMENT_RE = /(^|\/)(\.\.|\.|[^/]*\.env(\.|$))/i;
const ALLOWED_STATUSES = new Set(["A", "M"]);

/**
 * Evaluates whether a CMS content branch/PR is eligible for automated PR
 * creation and GitHub auto-merge (Workstream 7C). Fails closed on any ambiguity:
 * - Only `content/*` -> `main`
 * - Only Added (`A`) or Modified (`M`) regular non-executable files (`100644`)
 * - Rejects deletions (`D`), renames/moves (`R`), type changes (`T`), symlinks (`120000`),
 *   executables (`100755`), submodules (`160000`), dotfiles, path traversal, and SVGs.
 */
export function evaluateCmsPrScope({ headRef, baseRef, files }) {
  const reasons = [];

  if (baseRef !== "main") {
    reasons.push(`target branch must be 'main' (got '${baseRef}')`);
  }
  if (!headRef || !CONTENT_BRANCH_RE.test(headRef)) {
    reasons.push(`source branch must match 'content/*' (got '${headRef}')`);
  }
  if (!Array.isArray(files) || files.length === 0) {
    reasons.push("no changed files detected");
    return { eligible: false, reasons };
  }

  for (const file of files) {
    const filePath = typeof file === "string" ? file : file?.path;
    const status = typeof file === "string" ? "M" : String(file?.status ?? "").toUpperCase();
    const mode = typeof file === "string" ? "100644" : String(file?.mode ?? "100644");

    if (!filePath || FORBIDDEN_SEGMENT_RE.test(filePath)) {
      reasons.push(`forbidden path or dotfile segment: '${filePath}'`);
      continue;
    }
    if (!ALLOWED_STATUSES.has(status)) {
      reasons.push(`disallowed change status '${status}' (only A/M allowed): '${filePath}'`);
    }
    if (mode !== "100644") {
      reasons.push(
        `disallowed git file mode '${mode}' (only regular 100644 allowed): '${filePath}'`,
      );
    }
    const isAllowed =
      ALLOWED_CONTENT_FILE_RE.test(filePath) || ALLOWED_IMAGE_FILE_RE.test(filePath);
    if (!isAllowed) {
      reasons.push(
        `outside approved CMS paths/extensions (content/*.yaml|mdoc, public/images/*.png|jpg|webp|avif): '${filePath}'`,
      );
    }
  }

  return { eligible: reasons.length === 0, reasons };
}

/** Parses `git diff --raw --no-renames` lines into { status, mode, path }. */
export function parseRawGitDiff(raw) {
  if (!raw || !raw.trim()) return [];
  return raw
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      // Format: :<oldmode> <newmode> <oldsha> <newsha> <status>\t<path>
      const [meta, ...paths] = line.split("\t");
      const parts = (meta ?? "").replace(/^:/, "").trim().split(/\s+/);
      const newMode = parts[1] ?? "";
      const status = (parts[4] ?? "").charAt(0).toUpperCase();
      return { status, mode: newMode, path: paths.at(-1) ?? "" };
    });
}

function runCli() {
  const headRef = process.env.HEAD_REF || process.argv[2] || "";
  const baseRef = process.env.BASE_REF || process.argv[3] || "main";
  const diffRange = process.env.DIFF_RANGE || `origin/${baseRef}...HEAD`;

  const raw = execFileSync("git", ["diff", "--raw", "--no-renames", diffRange], {
    encoding: "utf8",
  });
  const files = parseRawGitDiff(raw);

  const result = evaluateCmsPrScope({ headRef, baseRef, files });
  console.log(JSON.stringify({ headRef, baseRef, fileCount: files.length, ...result }, null, 2));
  if (!result.eligible) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  runCli();
}
