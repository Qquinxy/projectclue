"use client"

import { useEffect, useState } from "react"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { resolveImageUrl } from "@/lib/api"
import { cn } from "@/lib/utils"

interface ActivityGalleryProps {
  images: string[]
  /** Overlay rendered on top of the main image (status / volunteer-hour badges). */
  overlay?: React.ReactNode
  className?: string
}

/**
 * Read-only activity gallery, sized to drop into the slot the single
 * placeholder used to occupy on the activity detail page.
 *
 *   0 images  -> the same gradient + calendar placeholder as before
 *   1 image   -> just the image, no chrome
 *   many      -> main image with prev/next controls and a thumbnail strip
 *
 * Everyone (students included) sees exactly this; there are no management
 * controls here at all.
 */
export function ActivityGallery({ images, overlay, className }: ActivityGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  // Deleting the image currently being viewed (or navigating between
  // activities) can leave the index past the end of the list.
  useEffect(() => {
    setActiveIndex((current) => (current < images.length ? current : 0))
  }, [images.length])

  const hasImages = images.length > 0
  const hasMany = images.length > 1
  const safeIndex = activeIndex < images.length ? activeIndex : 0

  const step = (delta: number) => {
    setActiveIndex((current) => (current + delta + images.length) % images.length)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="relative aspect-video lg:aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-accent/20 to-primary/20">
        {hasImages ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveImageUrl(images[safeIndex])}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Calendar className="h-24 w-24 text-accent/30" />
          </div>
        )}

        {hasMany && (
          <>
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="รูปก่อนหน้า"
              className="absolute left-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="รูปถัดไป"
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm backdrop-blur transition-colors hover:bg-background"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 right-3 rounded-full bg-background/80 px-2.5 py-1 text-xs backdrop-blur">
              <span className="numeric-font">
                {safeIndex + 1}/{images.length}
              </span>
            </div>
          </>
        )}

        {overlay}
      </div>

      {hasMany && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`ดูรูปที่ ${index + 1}`}
              aria-current={index === safeIndex}
              className={cn(
                "h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors",
                index === safeIndex ? "border-primary" : "border-transparent hover:border-border"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resolveImageUrl(image)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
