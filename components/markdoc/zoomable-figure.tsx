"use client";

import { Maximize2Icon } from "lucide-react";
import Image from "next/image";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type ZoomableFigureProps = {
  src: string;
  alt: string;
  caption?: string;
  /** "Diagram" or "Figure", used in the button and dialog labels. */
  kind?: string;
};

/**
 * FR-PD-03: an image or process diagram with click-to-enlarge. The thumbnail is
 * a real button (keyboard + screen reader), the enlarged view is the shared
 * Radix Dialog (focus trap, Esc, focus returns to the button).
 */
function ZoomableFigure({ src, alt, caption, kind = "Figure" }: ZoomableFigureProps) {
  return (
    <figure className="my-8">
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            aria-label={`Enlarge ${kind.toLowerCase()}: ${alt}`}
            className="bg-panel border-green-dim hover:border-amber group relative block aspect-video w-full border-2"
          >
            <Image
              src={src}
              alt={alt}
              fill
              sizes="(min-width: 1200px) 760px, 100vw"
              className="object-contain p-2"
            />
            <span
              aria-hidden="true"
              className="bg-bg border-green-dim text-green group-hover:text-amber absolute right-2 bottom-2 flex size-9 items-center justify-center border"
            >
              <Maximize2Icon className="size-4" />
            </span>
          </button>
        </DialogTrigger>
        <DialogContent
          className="max-w-[min(1100px,calc(100vw-2rem))]"
          closeLabel={`Close ${kind.toLowerCase()}`}
        >
          <DialogTitle>{caption || kind}</DialogTitle>
          <DialogDescription className="sr-only">{alt}</DialogDescription>
          <div className="relative mt-4 aspect-[4/3] w-full">
            <Image src={src} alt={alt} fill sizes="100vw" className="object-contain" />
          </div>
        </DialogContent>
      </Dialog>
      {caption ? <figcaption className="text-meta text-muted mt-2">{caption}</figcaption> : null}
    </figure>
  );
}

export { ZoomableFigure };
