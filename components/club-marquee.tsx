"use client"

import { ClubCard } from "@/components/club-card"
import type { Club } from "@/lib/types"

interface ClubMarqueeProps {
  clubs: Club[]
}

export function ClubMarquee({ clubs }: ClubMarqueeProps) {
  // Rendered twice so the track can loop seamlessly. The duplicate copy is
  // hidden from assistive tech so the clubs are only announced once.
  // The scroll itself is driven by `.club-marquee-track` in app/globals.css
  // and runs continuously — it is never paused.
  const copies = [
    { key: "a", hidden: false },
    { key: "b", hidden: true },
  ]

  return (
    <div className="club-marquee-viewport relative overflow-hidden">
      {/* Edge fades blend the loop into the page background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#f6f3ea] to-transparent sm:w-16"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#f6f3ea] to-transparent sm:w-16"
      />

      <div className="club-marquee-track flex w-max items-stretch gap-4">
        {copies.map((copy) =>
          clubs.map((club) => (
            <div
              key={`${copy.key}-${club.id}`}
              aria-hidden={copy.hidden || undefined}
              className="relative w-[260px] shrink-0 sm:w-[300px] lg:w-[340px]"
            >
              <ClubCard club={club} />
              <span
                className="pointer-events-none absolute -top-1 -right-1 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#e4e4e4] bg-white text-sm shadow-sm"
                role="img"
                aria-label="ชมรมแนะนำ"
              >
                🔥
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
