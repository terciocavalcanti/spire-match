"use client";

import type { PropertyImage } from "@spire/contracts";
import * as React from "react";

import { cn } from "../lib/cn";

export interface PropertyGalleryProps {
  images: PropertyImage[];
  title: string;
  topLeftSlot?: React.ReactNode;
  topRightSlot?: React.ReactNode;
}

export function PropertyGallery({ images, title, topLeftSlot, topRightSlot }: PropertyGalleryProps) {
  const [index, setIndex] = React.useState(0);
  const current = images[index] ?? images[0];

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-background-subtle sm:aspect-[16/9]">
      {current ? (
        <img src={current.url} alt={current.alt || title} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ink-tertiary">Sem fotos</div>
      )}

      <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
        <div>{topLeftSlot}</div>
        <div>{topRightSlot}</div>
      </div>

      {images.length > 1 && (
        <span className="absolute bottom-4 right-4 rounded-pill bg-background-elevated/90 px-2.5 py-1 text-caption text-ink-primary">
          {index + 1}/{images.length}
        </span>
      )}

      {images.length > 1 && (
        <div className="absolute inset-x-0 bottom-0 flex justify-between px-2 pb-2">
          <button
            type="button"
            aria-label="Foto anterior"
            onClick={() => setIndex((i) => (i - 1 + images.length) % images.length)}
            className={cn("h-10 w-10 rounded-full bg-background-elevated/80 text-ink-primary")}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Próxima foto"
            onClick={() => setIndex((i) => (i + 1) % images.length)}
            className="h-10 w-10 rounded-full bg-background-elevated/80 text-ink-primary"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
