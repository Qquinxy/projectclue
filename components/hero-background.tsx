"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

const heroSlides = [
  "/images/hero/hero-slide-1.jpg",
  "/images/hero/hero-slide-2.jpg",
  "/images/hero/hero-slide-3.jpg",
  "/images/hero/hero-slide-4.jpg",
  "/images/hero/hero-slide-5.jpg",
]

const ROTATE_MS = 6000

export function HeroBackground() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (reduceMotion) return

    const id = window.setInterval(() => {
      setActive((prev) => (prev + 1) % heroSlides.length)
    }, ROTATE_MS)

    return () => window.clearInterval(id)
  }, [])

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      {heroSlides.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          priority={index === 0}
          sizes="100vw"
          className={`object-cover object-center scale-105 blur-[2px] transition-opacity duration-1000 ease-in-out ${
            index === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}

      {/* Dark scrim for text contrast */}
      <div className="absolute inset-0 bg-[#2a1800]/70" />
      {/* Cream tint blended toward the page background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#6b3e00]/45 via-transparent to-[#f6f3ea]" />
    </div>
  )
}
