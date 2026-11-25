"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import type { ApproachVisualKind, ResolvedApproachStage } from "@/lib/approach-story";
import { cn } from "@/lib/utils";

type ApproachStoryProps = {
  stages: readonly ResolvedApproachStage[];
};

type RevealState = "idle" | "pending" | "revealed" | "reduced";

/**
 * Interactive CMS-driven visual storytelling experience (Phase 6 / 7C / 9 / 10).
 * Renders a connected horizontal process path on desktop (lg+) with:
 * - Viewport-triggered entrance (connector rail draw + staggered 6-stage reveal + panel entry),
 * - Progressive node activation and smooth CSS transform/opacity transitions on stage change,
 * - Inline monochrome SVG diagrams and a touch-friendly stepped rail on mobile/tablet,
 * - Full prefers-reduced-motion and JS-disabled safety (SSR-visible by default).
 */
function ApproachStory({ stages }: ApproachStoryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealState, setRevealState] = useState<RevealState>("idle");
  const containerRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.approachRevealed = "reduced";
      return;
    }

    // Match Reveal's progressive pattern: content is SSR-visible; prime animation
    // only when the section is still below the viewport, then reveal once on entry.
    let first = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (first) {
          first = false;
          if (!entry.isIntersecting && entry.boundingClientRect.top >= 0) {
            setRevealState("pending");
            return;
          }
          // Already in view (e.g. direct /#approach load): play entrance once.
          setRevealState("pending");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => setRevealState("revealed"));
          });
          observer.disconnect();
          return;
        }
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
          setRevealState("revealed");
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const active = stages[activeIndex] ?? stages[0];
  if (!active) return null;

  const isPending = revealState === "pending";
  const progressScale = stages.length > 1 ? activeIndex / (stages.length - 1) : 1;
  const totalLabel = String(stages.length).padStart(2, "0");

  function selectStage(nextIndex: number, { focusTab = false } = {}) {
    const clamped = Math.max(0, Math.min(stages.length - 1, nextIndex));
    setActiveIndex(clamped);
    if (focusTab) tabRefs.current[clamped]?.focus();
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      selectStage((index + 1) % stages.length, { focusTab: true });
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      selectStage((index - 1 + stages.length) % stages.length, { focusTab: true });
    } else if (event.key === "Home") {
      event.preventDefault();
      selectStage(0, { focusTab: true });
    } else if (event.key === "End") {
      event.preventDefault();
      selectStage(stages.length - 1, { focusTab: true });
    }
  }

  return (
    <div
      ref={containerRef}
      data-approach-story=""
      data-approach-revealed={revealState}
      className="flex flex-col gap-6"
    >
      {/* Connected node pipeline (desktop lg+) & clean interactive rail (mobile/tablet) */}
      <div className="relative">
        {/* Continuous process track connecting stage 01 through the final node on desktop */}
        <div
          aria-hidden="true"
          data-approach-rail=""
          style={{
            transform: isPending ? "scaleX(0)" : "scaleX(1)",
          }}
          className="bg-green-dim/35 pointer-events-none absolute top-3.5 right-[8.333%] left-[8.333%] hidden h-0.5 origin-left transition-transform duration-500 ease-out motion-reduce:transition-none lg:block"
        >
          <div
            data-story-progress=""
            style={{ transform: `scaleX(${progressScale.toFixed(3)})` }}
            className="bg-amber h-full origin-left transition-transform duration-300 ease-out motion-reduce:transition-none"
          />
        </div>

        <div
          role="tablist"
          aria-label="Problem-solving approach stages"
          className="relative grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 lg:gap-0"
        >
          {stages.map((stage, index) => {
            const isSelected = index === activeIndex;
            const isCompleted = index < activeIndex;
            const stateLabel = isSelected ? "active" : isCompleted ? "completed" : "upcoming";
            const staggerDelayMs = revealState === "revealed" ? index * 70 : 0;
            return (
              <button
                key={stage.id}
                ref={(el) => {
                  tabRefs.current[index] = el;
                }}
                type="button"
                role="tab"
                id={`approach-tab-${stage.id}`}
                aria-selected={isSelected}
                aria-controls={`approach-panel-${stage.id}`}
                tabIndex={isSelected ? 0 : -1}
                data-stage-id={stage.id}
                data-stage-state={stateLabel}
                onClick={() => selectStage(index)}
                onKeyDown={(e) => onTabKeyDown(e, index)}
                style={{
                  transitionDelay: `${staggerDelayMs}ms`,
                }}
                className={cn(
                  "group/step flex min-h-11 cursor-pointer flex-col items-start gap-1.5 border-2 px-3 py-2.5 text-left transition-[opacity,transform,color,border-color] duration-300 ease-out motion-reduce:transition-none lg:items-center lg:border-0 lg:bg-transparent lg:px-2 lg:pt-0 lg:pb-2 lg:text-center",
                  isPending ? "translate-y-2.5 opacity-0" : "translate-y-0 opacity-100",
                  isSelected
                    ? "bg-panel border-amber text-amber"
                    : isCompleted
                      ? "bg-bg border-green text-green hover:border-amber"
                      : "bg-bg border-green-dim/60 text-muted hover:border-green hover:text-white",
                )}
              >
                {/* Node marker centered on desktop connector track */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "hidden size-7 items-center justify-center border-2 font-mono text-[10px] transition-[color,border-color,transform] duration-(--dur-fast) group-hover/step:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none lg:flex",
                    isSelected
                      ? "bg-amber border-amber text-bg font-bold"
                      : isCompleted
                        ? "bg-panel border-green text-green group-hover/step:border-amber"
                        : "bg-bg border-green-dim text-muted group-hover/step:border-green group-hover/step:text-white",
                  )}
                >
                  {stage.number}
                </span>

                <span className="font-mono text-[10px] tracking-wider uppercase lg:hidden">
                  {stage.number}
                  {isCompleted ? " · OK" : isSelected ? " · ACTIVE" : ""}
                </span>

                <span
                  className={cn(
                    "text-meta text-xs font-medium transition-colors duration-(--dur-fast) sm:text-sm",
                    isSelected
                      ? "text-amber"
                      : isCompleted
                        ? "text-green group-hover/step:text-amber"
                        : "text-muted group-hover/step:text-white",
                  )}
                >
                  {stage.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active stage narrative & central system diagram */}
      <div
        role="tabpanel"
        id={`approach-panel-${active.id}`}
        aria-labelledby={`approach-tab-${active.id}`}
        data-active-stage={active.id}
        style={{
          transitionDelay: revealState === "revealed" ? "160ms" : "0ms",
        }}
        className={cn(
          "bg-panel border-green-dim shadow-pixel grid gap-6 border-2 p-5 transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none md:p-7 lg:grid-cols-12 lg:items-center lg:gap-8",
          isPending ? "translate-y-3 opacity-0" : "translate-y-0 opacity-100",
        )}
      >
        <div
          key={`copy-${active.id}`}
          className="animate-fade-in flex flex-col gap-4 motion-reduce:animate-none lg:col-span-7"
        >
          <div className="flex flex-col gap-1.5">
            <p className="text-meta text-amber text-xs">
              STAGE {active.number} / {totalLabel}
            </p>
            <h3 className="text-display-2 text-white">{active.title}</h3>
          </div>

          {active.description ? (
            <p className="max-w-[62ch] text-base leading-relaxed">{active.description}</p>
          ) : null}

          {active.projects.length > 0 ? (
            <div className="border-green-dim/50 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-dashed pt-4 text-xs">
              <span className="text-meta text-green-dim">Applied in:</span>
              {active.projects.map((p) => (
                <Link
                  key={p.slug}
                  href={`/projects/${p.slug}`}
                  className="text-meta text-green hover:text-amber underline underline-offset-4 transition-colors duration-(--dur-fast)"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              disabled={activeIndex === 0}
              onClick={() => selectStage(activeIndex - 1)}
              className="border-green-dim text-meta text-green hover:border-amber hover:text-amber disabled:text-muted min-h-11 border-2 px-3 py-1.5 text-xs transition-colors duration-(--dur-fast) disabled:cursor-not-allowed disabled:opacity-50"
            >
              {"[ < previous ]"}
            </button>
            <button
              type="button"
              disabled={activeIndex === stages.length - 1}
              onClick={() => selectStage(activeIndex + 1)}
              className="border-green-dim text-meta text-green hover:border-amber hover:text-amber disabled:text-muted min-h-11 border-2 px-3 py-1.5 text-xs transition-colors duration-(--dur-fast) disabled:cursor-not-allowed disabled:opacity-50"
            >
              {"[ next > ]"}
            </button>
          </div>
        </div>

        {/* Central system diagram adapting meaningfully to the active CMS stage */}
        <figure className="bg-bg border-green-dim/70 flex flex-col gap-3 border-2 p-4 lg:col-span-5">
          <div className="border-green-dim/50 text-meta text-green-dim flex items-center justify-between border-b border-dashed pb-2 text-[10px]">
            <span>system-view.svg</span>
            <span className="text-amber">STAGE_{active.number}</span>
          </div>
          <div key={`svg-${active.id}`} className="animate-rise-in motion-reduce:animate-none">
            <StageDiagram visualKind={active.visualKind} title={active.title} />
          </div>
          <figcaption className="text-meta text-muted text-xs">{active.visualCaption}</figcaption>
        </figure>
      </div>
    </div>
  );
}

function svDelay(seconds: number): CSSProperties {
  return { "--sv-delay": `${seconds}s` } as CSSProperties;
}

function StageDiagram({ visualKind, title }: { visualKind: ApproachVisualKind; title: string }) {
  return (
    <svg
      viewBox="0 0 360 200"
      role="img"
      aria-label={`System diagram illustrating stage: ${title}`}
      data-approach-visual={visualKind}
      className="h-auto max-h-[180px] w-full md:max-h-[210px]"
    >
      {/* Subtle monochrome grid */}
      <g stroke="#1F9E3A" strokeOpacity="0.22" strokeWidth="1">
        <line x1="0" y1="50" x2="360" y2="50" />
        <line x1="0" y1="100" x2="360" y2="100" />
        <line x1="0" y1="150" x2="360" y2="150" />
        <line x1="90" y1="0" x2="90" y2="200" />
        <line x1="180" y1="0" x2="180" y2="200" />
        <line x1="270" y1="0" x2="270" y2="200" />
      </g>

      {visualKind === "understand" ? (
        <g fontFamily="monospace" fontSize="10">
          <g data-sv-node="" className="sv-node" style={svDelay(0)}>
            <rect
              x="18"
              y="24"
              width="84"
              height="28"
              fill="#0B140D"
              stroke="#1F9E3A"
              strokeWidth="1.5"
            />
            <text x="60" y="42" fill="#A3B8A8" textAnchor="middle">
              GOALS
            </text>
          </g>
          <g data-sv-node="" className="sv-node" style={svDelay(0.25)}>
            <rect
              x="18"
              y="86"
              width="84"
              height="28"
              fill="#0B140D"
              stroke="#1F9E3A"
              strokeWidth="1.5"
            />
            <text x="60" y="104" fill="#A3B8A8" textAnchor="middle">
              CONTEXT
            </text>
          </g>
          <g data-sv-node="" className="sv-node" style={svDelay(0.5)}>
            <rect
              x="18"
              y="148"
              width="84"
              height="28"
              fill="#0B140D"
              stroke="#1F9E3A"
              strokeWidth="1.5"
            />
            <text x="60" y="166" fill="#A3B8A8" textAnchor="middle">
              CONSTRAINTS
            </text>
          </g>
          <path
            d="M102 38 L168 92 M102 100 L168 100 M102 162 L168 108"
            stroke="#2CFF56"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            fill="none"
            data-sv-dash=""
            className="sv-dash-7"
          />
          <path
            d="M102 38 L168 92"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            fill="none"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(0.25)}
          />
          <path
            d="M102 100 L168 100"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            fill="none"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(0.5)}
          />
          <path
            d="M102 162 L168 108"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            fill="none"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(0.75)}
          />
          <g data-sv-node="" className="sv-node" style={svDelay(1.75)}>
            <rect
              x="172"
              y="64"
              width="166"
              height="72"
              fill="#0B140D"
              stroke="#FFB200"
              strokeWidth="2"
            />
            <text x="255" y="95" fill="#FFB200" textAnchor="middle" fontWeight="bold">
              FRAMED PROBLEM
            </text>
            <text x="255" y="114" fill="#FFFFFF" textAnchor="middle">
              scope · roles · goals
            </text>
          </g>
        </g>
      ) : null}

      {visualKind === "map-as-is" ? (
        <g fontFamily="monospace" fontSize="10">
          <g data-sv-node="" className="sv-node" style={svDelay(0)}>
            <rect
              x="20"
              y="38"
              width="78"
              height="44"
              fill="#0B140D"
              stroke="#2CFF56"
              strokeWidth="1.5"
            />
            <text x="59" y="57" fill="#2CFF56" textAnchor="middle">
              STEP 1
            </text>
            <text x="59" y="72" fill="#A3B8A8" textAnchor="middle">
              intake
            </text>
          </g>
          <line x1="98" y1="60" x2="132" y2="60" stroke="#1F9E3A" strokeWidth="1.5" />
          <line
            x1="98"
            y1="60"
            x2="132"
            y2="60"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(0.45)}
          />
          <g data-sv-node="" className="sv-node" style={svDelay(1.25)}>
            <rect
              x="134"
              y="38"
              width="92"
              height="44"
              fill="#0B140D"
              stroke="#FFB200"
              strokeWidth="2"
            />
            <text x="180" y="57" fill="#FFB200" textAnchor="middle" fontWeight="bold">
              HANDOFF
            </text>
            <text x="180" y="72" fill="#FFFFFF" textAnchor="middle">
              manual check
            </text>
          </g>
          <line x1="226" y1="60" x2="260" y2="60" stroke="#1F9E3A" strokeWidth="1.5" />
          <line
            x1="226"
            y1="60"
            x2="260"
            y2="60"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(1.75)}
          />
          <g data-sv-node="" className="sv-node" style={svDelay(2.65)}>
            <rect
              x="262"
              y="38"
              width="78"
              height="44"
              fill="#0B140D"
              stroke="#2CFF56"
              strokeWidth="1.5"
            />
            <text x="301" y="57" fill="#2CFF56" textAnchor="middle">
              STEP 3
            </text>
            <text x="301" y="72" fill="#A3B8A8" textAnchor="middle">
              output
            </text>
          </g>
          <g data-sv-node="" className="sv-node" style={svDelay(2.65)}>
            <rect
              x="64"
              y="120"
              width="232"
              height="46"
              fill="#0B140D"
              stroke="#1F9E3A"
              strokeWidth="1.5"
              strokeDasharray="4 3"
            />
            <text x="180" y="140" fill="#FFFFFF" textAnchor="middle">
              AS-IS BASELINE MAP
            </text>
            <text x="180" y="156" fill="#A3B8A8" textAnchor="middle">
              actors · systems · constraints
            </text>
          </g>
          <line
            x1="180"
            y1="82"
            x2="180"
            y2="120"
            stroke="#FFB200"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            data-sv-dash=""
            className="sv-dash-6"
          />
          <line
            x1="180"
            y1="82"
            x2="180"
            y2="120"
            pathLength={100}
            stroke="#FFB200"
            strokeWidth="2"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(1.75)}
          />
        </g>
      ) : null}

      {visualKind === "analyze" ? (
        <g fontFamily="monospace" fontSize="10">
          <g data-sv-node="" className="sv-node" style={svDelay(0)}>
            <rect
              x="20"
              y="26"
              width="54"
              height="24"
              fill="#0B140D"
              stroke="#1F9E3A"
              strokeWidth="1.5"
            />
            <text x="47" y="42" fill="#A3B8A8" textAnchor="middle">
              LOGS
            </text>
          </g>
          <g data-sv-node="" className="sv-node" style={svDelay(0.2)}>
            <rect
              x="20"
              y="68"
              width="54"
              height="24"
              fill="#0B140D"
              stroke="#1F9E3A"
              strokeWidth="1.5"
            />
            <text x="47" y="84" fill="#A3B8A8" textAnchor="middle">
              EXCEL
            </text>
          </g>
          <g data-sv-node="" className="sv-node" style={svDelay(0.4)}>
            <rect
              x="20"
              y="110"
              width="54"
              height="24"
              fill="#0B140D"
              stroke="#1F9E3A"
              strokeWidth="1.5"
            />
            <text x="47" y="126" fill="#A3B8A8" textAnchor="middle">
              CHATS
            </text>
          </g>
          <g data-sv-node="" className="sv-node" style={svDelay(0.6)}>
            <rect
              x="20"
              y="152"
              width="54"
              height="24"
              fill="#0B140D"
              stroke="#1F9E3A"
              strokeWidth="1.5"
            />
            <text x="47" y="168" fill="#A3B8A8" textAnchor="middle">
              GAPS
            </text>
          </g>
          <path
            d="M74 38 L138 96 M74 80 L138 99 M74 122 L138 102 M74 164 L138 105"
            stroke="#1F9E3A"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M74 38 L138 96"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            fill="none"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(0.3)}
          />
          <path
            d="M74 80 L138 99"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            fill="none"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(0.5)}
          />
          <path
            d="M74 122 L138 102"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            fill="none"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(0.7)}
          />
          <path
            d="M74 164 L138 105"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            fill="none"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(0.9)}
          />
          <g data-sv-node="" className="sv-node" style={svDelay(1.65)}>
            <polygon
              points="140,68 192,84 192,116 140,132"
              fill="#0B140D"
              stroke="#2CFF56"
              strokeWidth="2"
            />
            <text x="166" y="104" fill="#2CFF56" textAnchor="middle">
              RCA
            </text>
          </g>
          <line
            x1="192"
            y1="100"
            x2="226"
            y2="100"
            stroke="#FFB200"
            strokeOpacity="0.45"
            strokeWidth="2"
          />
          <line
            x1="192"
            y1="100"
            x2="226"
            y2="100"
            pathLength={100}
            stroke="#FFB200"
            strokeWidth="2"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(2.15)}
          />
          <g data-sv-node="" className="sv-node" style={svDelay(2.95)}>
            <rect
              x="228"
              y="68"
              width="112"
              height="64"
              fill="#0B140D"
              stroke="#FFB200"
              strokeWidth="2"
            />
            <text x="284" y="96" fill="#FFB200" textAnchor="middle" fontWeight="bold">
              ROOT CAUSE
            </text>
            <text x="284" y="114" fill="#FFFFFF" textAnchor="middle">
              verified gap
            </text>
          </g>
        </g>
      ) : null}

      {visualKind === "design-to-be" ? (
        <g fontFamily="monospace" fontSize="10">
          <g data-sv-node="" className="sv-node" style={svDelay(0)}>
            <rect
              x="18"
              y="72"
              width="70"
              height="56"
              fill="#0B140D"
              stroke="#2CFF56"
              strokeWidth="1.5"
            />
            <text x="53" y="96" fill="#2CFF56" textAnchor="middle">
              INPUT
            </text>
            <text x="53" y="112" fill="#A3B8A8" textAnchor="middle">
              forms/api
            </text>
          </g>
          <line x1="88" y1="100" x2="116" y2="100" stroke="#1F9E3A" strokeWidth="2" />
          <line
            x1="88"
            y1="100"
            x2="116"
            y2="100"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(0.4)}
          />
          <g data-sv-node="" className="sv-node" style={svDelay(1.15)}>
            <rect
              x="118"
              y="34"
              width="106"
              height="52"
              fill="#0B140D"
              stroke="#FFB200"
              strokeWidth="2"
            />
            <text x="171" y="57" fill="#FFB200" textAnchor="middle" fontWeight="bold">
              RULES ENGINE
            </text>
            <text x="171" y="73" fill="#FFFFFF" textAnchor="middle">
              to-be logic
            </text>
          </g>
          <g data-sv-node="" className="sv-node" style={svDelay(2.1)}>
            <rect
              x="118"
              y="114"
              width="106"
              height="52"
              fill="#0B140D"
              stroke="#2CFF56"
              strokeWidth="1.5"
            />
            <text x="171" y="137" fill="#2CFF56" textAnchor="middle">
              DATA STORE
            </text>
            <text x="171" y="153" fill="#A3B8A8" textAnchor="middle">
              schema/ERD
            </text>
          </g>
          <line
            x1="171"
            y1="86"
            x2="171"
            y2="114"
            stroke="#2CFF56"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeDasharray="3 3"
            data-sv-dash=""
            className="sv-dash-6"
          />
          <line
            x1="171"
            y1="86"
            x2="171"
            y2="114"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(1.55)}
          />
          <line x1="224" y1="60" x2="256" y2="100" stroke="#1F9E3A" strokeWidth="2" />
          <line
            x1="224"
            y1="60"
            x2="256"
            y2="100"
            pathLength={100}
            stroke="#FFB200"
            strokeWidth="2"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(2.5)}
          />
          <line x1="224" y1="140" x2="256" y2="100" stroke="#1F9E3A" strokeWidth="2" />
          <line
            x1="224"
            y1="140"
            x2="256"
            y2="100"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(2.5)}
          />
          <g data-sv-node="" className="sv-node" style={svDelay(3.3)}>
            <rect
              x="258"
              y="72"
              width="84"
              height="56"
              fill="#0B140D"
              stroke="#2CFF56"
              strokeWidth="1.5"
            />
            <text x="300" y="96" fill="#FFFFFF" textAnchor="middle">
              OUTPUT
            </text>
            <text x="300" y="112" fill="#A3B8A8" textAnchor="middle">
              reports/UI
            </text>
          </g>
        </g>
      ) : null}

      {visualKind === "build" ? (
        <g fontFamily="monospace" fontSize="10">
          <g data-sv-node="" className="sv-node" style={svDelay(0)}>
            <rect
              x="26"
              y="42"
              width="90"
              height="44"
              fill="#0B140D"
              stroke="#2CFF56"
              strokeWidth="1.5"
            />
            <text x="71" y="68" fill="#FFFFFF" textAnchor="middle">
              BUILD v1
            </text>
          </g>
          <line x1="116" y1="64" x2="144" y2="64" stroke="#1F9E3A" strokeWidth="2" />
          <line
            x1="116"
            y1="64"
            x2="144"
            y2="64"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(0.4)}
          />
          <g data-sv-node="" className="sv-node" style={svDelay(1.15)}>
            <rect
              x="146"
              y="42"
              width="90"
              height="44"
              fill="#0B140D"
              stroke="#FFB200"
              strokeWidth="2"
            />
            <text x="191" y="68" fill="#FFB200" textAnchor="middle" fontWeight="bold">
              USER TEST
            </text>
          </g>
          <line x1="236" y1="64" x2="264" y2="64" stroke="#1F9E3A" strokeWidth="2" />
          <line
            x1="236"
            y1="64"
            x2="264"
            y2="64"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(2.1)}
          />
          <g data-sv-node="" className="sv-node" style={svDelay(2.95)}>
            <rect
              x="266"
              y="42"
              width="74"
              height="44"
              fill="#0B140D"
              stroke="#2CFF56"
              strokeWidth="1.5"
            />
            <text x="303" y="68" fill="#2CFF56" textAnchor="middle">
              SHIP
            </text>
          </g>
          <path
            d="M191 86 L191 146 L71 146 L71 90"
            stroke="#FFB200"
            strokeOpacity="0.45"
            strokeWidth="1.5"
            strokeDasharray="5 3"
            fill="none"
            data-sv-dash=""
            className="sv-dash-8"
          />
          <path
            d="M191 86 L191 146 L71 146 L71 90"
            pathLength={100}
            stroke="#FFB200"
            strokeWidth="2"
            fill="none"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(1.65)}
          />
          <polygon points="71,86 66,95 76,95" fill="#FFB200" />
          <text x="131" y="164" fill="#A3B8A8" textAnchor="middle">
            ITERATE &amp; REFINE (RAD)
          </text>
        </g>
      ) : null}

      {visualKind === "verify" ? (
        <g fontFamily="monospace" fontSize="10">
          <rect
            x="28"
            y="120"
            width="32"
            height="48"
            fill="#0B140D"
            stroke="#1F9E3A"
            strokeWidth="1.5"
            data-sv-bar=""
            className="sv-bar"
            style={svDelay(0)}
          />
          <rect
            x="74"
            y="96"
            width="32"
            height="72"
            fill="#0B140D"
            stroke="#2CFF56"
            strokeWidth="1.5"
            data-sv-bar=""
            className="sv-bar"
            style={svDelay(0.22)}
          />
          <rect
            x="120"
            y="64"
            width="32"
            height="104"
            fill="#0B140D"
            stroke="#2CFF56"
            strokeWidth="2"
            data-sv-bar=""
            className="sv-bar"
            style={svDelay(0.44)}
          />
          <rect
            x="166"
            y="44"
            width="32"
            height="124"
            fill="#0B140D"
            stroke="#FFB200"
            strokeWidth="2"
            data-sv-bar=""
            className="sv-bar"
            style={svDelay(0.66)}
          />
          <line x1="20" y1="168" x2="208" y2="168" stroke="#A3B8A8" strokeWidth="1.5" />
          <g data-sv-node="" className="sv-node" style={svDelay(1.5)}>
            <rect
              x="224"
              y="44"
              width="116"
              height="54"
              fill="#0B140D"
              stroke="#FFB200"
              strokeWidth="2"
            />
            <text x="282" y="68" fill="#FFB200" textAnchor="middle" fontWeight="bold">
              VERIFIED
            </text>
            <text x="282" y="85" fill="#FFFFFF" textAnchor="middle">
              UAT · k6 · KPI
            </text>
          </g>
          <g data-sv-node="" className="sv-node" style={svDelay(2.85)}>
            <rect
              x="224"
              y="114"
              width="116"
              height="54"
              fill="#0B140D"
              stroke="#2CFF56"
              strokeWidth="1.5"
            />
            <text x="282" y="138" fill="#2CFF56" textAnchor="middle">
              NEXT CYCLE
            </text>
            <text x="282" y="155" fill="#A3B8A8" textAnchor="middle">
              handover / improve
            </text>
          </g>
          <line x1="282" y1="98" x2="282" y2="114" stroke="#1F9E3A" strokeWidth="1.5" />
          <line
            x1="282"
            y1="98"
            x2="282"
            y2="114"
            pathLength={100}
            stroke="#2CFF56"
            strokeWidth="2"
            data-sv-flow=""
            className="sv-pulse"
            style={svDelay(2.05)}
          />
        </g>
      ) : null}
    </svg>
  );
}

export { ApproachStory };
