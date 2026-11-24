/**
 * Animated INPUT -> PROCESS -> OUTPUT workflow indicator (Workstream 2D).
 * Pure CSS transform + opacity keyframes (0 bytes client JS); preserves the
 * ASCII `<pre>` diagram contract while animating each stage and connector pulse.
 * Renders static under prefers-reduced-motion. Token colours only.
 */
export function ProcessFlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-process-flow=""
      className={`bg-panel border-green-dim max-w-full overflow-hidden border-2 font-mono [contain:layout_paint] ${className ?? ""}`}
    >
      <div className="border-green-dim text-green-dim flex items-center justify-between border-b-2 px-2 py-0.5 text-[10px]">
        <span>process.map</span>
        <span className="text-green">RUN</span>
      </div>
      <pre className="text-green px-1.5 py-1.5 text-[7px] leading-tight sm:px-2 sm:text-[9px]">
        {"+-------+    +---------+    +--------+\n"}
        <span className="pf-node pf-node-1 inline-block">| INPUT |</span>
        <span className="pf-pulse pf-pulse-1 text-amber inline-block">{"--->"}</span>
        <span className="pf-node pf-node-2 inline-block">| PROCESS |</span>
        <span className="pf-pulse pf-pulse-2 text-amber inline-block">{"--->"}</span>
        <span className="pf-node pf-node-3 inline-block">| OUTPUT |</span>
        {"\n+-------+    +---------+    +--------+"}
      </pre>
    </div>
  );
}
