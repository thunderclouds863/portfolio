import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

const MS_PER_CHAR = 38;
const START_MS = 400; // after the hero typing line has begun
const GAP_MS = 180;

type Line = { text: string; tone?: "prompt" | "output" | "ok" };

/**
 * Decorative terminal log that types its lines one after another, once
 * (docs/decisions/0002-owner-overrides.md, override 3). CSS only: each line has a
 * panel-coloured cover that slides off in character steps (transform only), as in
 * TypingLine. The text is in the HTML from the start; under reduced motion the
 * covers are hidden, so everything shows at once. aria-hidden: it says nothing new.
 */
/** Each line starts when the previous one has finished typing. */
function timings(lines: readonly Line[]) {
  const out: { delay: number; duration: number }[] = [];
  let delay = START_MS;
  for (const line of lines) {
    const duration = line.text.length * MS_PER_CHAR;
    out.push({ delay, duration });
    delay += duration + GAP_MS;
  }
  return out;
}

function TypeLog({ lines, className }: { lines: readonly Line[]; className?: string }) {
  const steps = timings(lines);
  return (
    <div
      aria-hidden="true"
      className={cn("bg-panel border-green shadow-pixel border-2 font-mono", className)}
    >
      <div className="border-green-dim text-green-dim flex justify-between border-b-2 px-3 py-1 text-[10px]">
        <span>{"~/desi $ session.log"}</span>
        <span>[_][x]</span>
      </div>
      <div className="flex flex-col gap-1 px-3 py-2 text-[11px] leading-4">
        {lines.map((line, i) => {
          const style = {
            "--type-steps": line.text.length,
            "--type-duration": `${steps[i]!.duration}ms`,
            animationDelay: `${steps[i]!.delay}ms`,
          } as CSSProperties;
          return (
            <span
              key={i}
              className={cn(
                "relative block overflow-hidden whitespace-pre",
                line.tone === "ok"
                  ? "text-green"
                  : line.tone === "output"
                    ? "text-muted"
                    : "text-white",
              )}
            >
              {line.text}
              <span className="typing-cover bg-panel absolute inset-0" style={style} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export { TypeLog };
