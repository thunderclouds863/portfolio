import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

const MS_PER_CHAR = 38;
const START_MS = 400;
const GAP_MS = 180;

export type TypeLogLine = { text: string; tone?: "prompt" | "output" | "ok" };

function timings(lines: readonly TypeLogLine[]) {
  const out: { delay: number; duration: number }[] = [];
  let delay = START_MS;
  for (const line of lines) {
    const duration = line.text.length * MS_PER_CHAR;
    out.push({ delay, duration });
    delay += duration + GAP_MS;
  }
  return out;
}

/**
 * Repeating decorative terminal session log on the hero portrait (Workstream 2C).
 * Pure CSS (0 bytes client JS): each line's cover slides off in character steps,
 * pauses once complete, and loops continuously. Renders static under reduced motion.
 */
function TypeLog({
  lines,
  className,
}: {
  lines: readonly TypeLogLine[];
  sessions?: readonly (readonly TypeLogLine[])[];
  className?: string;
}) {
  const steps = timings(lines);
  return (
    <div
      aria-hidden="true"
      data-type-log=""
      className={cn(
        "bg-panel border-green shadow-pixel border-2 font-mono [contain:layout_paint]",
        className,
      )}
    >
      <div className="border-green-dim text-green-dim flex justify-between border-b-2 px-3 py-1 text-[10px]">
        <span>{"~/desi $ session.log"}</span>
        <span>[_][x]</span>
      </div>
      <div className="flex min-h-[6.25rem] flex-col gap-1 px-3 py-2 text-[11px] leading-4">
        {lines.map((line, i) => {
          const style = {
            "--type-steps": line.text.length || 1,
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
              {i === lines.length - 1 ? (
                <span className="text-amber animate-blink ml-0.5">{"_"}</span>
              ) : null}
              <span
                className="typing-cover typing-cover-loop bg-panel absolute inset-0"
                style={style}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
}

export { TypeLog };
