"use client"

import { useCallback, useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { resolveImageUrl } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ClubGalleryProps {
  /** The club's own photos (Club.galleryImages). Never the cover image. */
  images: string[]
  className?: string
}

/**
 * Read-only gallery of a club's own photos — competition shots, atmosphere,
 * past events. Rendered as its own section on the club detail page, below the
 * upcoming-activities section.
 *
 * This is NOT the club cover image and NOT an activity image: it only ever
 * renders the paths handed to it, which come from Club.galleryImages.
 *
 *   1 photo   -> shown on its own
 *   many      -> responsive grid; clicking one opens a viewer with
 *                prev/next arrows and an "n / total" counter
 *
 * Everyone (students and anonymous visitors included) sees exactly this;
 * there are no management controls here at all.
 */
export function ClubGallery({ images, className }: ClubGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const close = useCallback(() => setLightboxIndex(null), [])

  const step = useCallback(
    (delta: number) => {
      setLightboxIndex((current) => {
        if (current === null) return current
        return (current + delta + images.length) % images.length
      })
    },
    [images.length]
  )

  // Arrow keys and Escape while the viewer is open.
  useEffect(() => {
    if (lightboxIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowLeft") step(-1)
      else if (e.key === "ArrowRight") step(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [lightboxIndex, close, step])

  // Don't leave the page scrolled behind an open viewer.
  useEffect(() => {
    if (lightboxIndex === null) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previous
    }
  }, [lightboxIndex])

  // A photo removed while the viewer is open must not leave it out of range.
  useEffect(() => {
    setLightboxIndex((current) =>
      current === null || current < images.length ? current : null
    )
  }, [images.length])

  if (images.length === 0) return null

  const active = lightboxIndex !== null ? images[lightboxIndex] : null

  return (
    <div className={className}>
      <div
        className={cn(
          "grid gap-3",
          images.length === 1
            ? "grid-cols-1"
            : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        )}
      >
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setLightboxIndex(index)}
            aria-label={`ดูรูปที่ ${index + 1} จาก ${images.length}`}
            className={cn(
              "group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              images.length === 1 ? "aspect-video" : "aspect-square"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolveImageUrl(image)}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="รูปภาพชมรม"
          onClick={close}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={close}
            aria-label="ปิด"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveImageUrl(active)}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[80vh] max-w-full rounded-lg object-contain"
          />

          <div
            onClick={(e) => e.stopPropagation()}
            className="mt-4 flex items-center gap-4 text-white"
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label="รูปก่อนหน้า"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
            )}
            <span className="numeric-font text-sm tabular-nums">
              {(lightboxIndex ?? 0) + 1} / {images.length}
            </span>
            {images.length > 1 && (
              <button
                type="button"
                onClick={() => step(1)}
                aria-label="รูปถัดไป"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
