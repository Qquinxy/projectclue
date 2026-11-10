"use client"

import { useEffect, useRef, useState } from "react"
import { Clock3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type Props = { id: string; label: string; value: string; onChange: (value: string) => void; invalid?: boolean }
const two = (value: number) => String(value).padStart(2, "0")

export function AnalogClockTimePicker({ id, label, value, onChange, invalid }: Props) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const [part, setPart] = useState<"hour" | "minute">("hour")
  const faceRef = useRef<SVGSVGElement>(null)
  const [draftHour, draftMinute] = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(draft)?.slice(1).map(Number) ?? [0, 0]

  useEffect(() => { if (open) { setDraft(value); setPart("hour") } }, [open, value])

  const setMinute = (nextMinute: number) => {
    const boundedMinute = Math.min(59, Math.max(0, Math.trunc(nextMinute)))
    setDraft(`${two(draftHour)}:${two(boundedMinute)}`)
  }

  const handleFaceClick = (event: React.MouseEvent<SVGSVGElement>) => {
    if (part !== "minute" || !faceRef.current) return
    const bounds = faceRef.current.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width * 200 - 100
    const y = (event.clientY - bounds.top) / bounds.height * 200 - 100
    const angle = (Math.atan2(x, -y) + Math.PI * 2) % (Math.PI * 2)
    setMinute(Math.round(angle / (Math.PI * 2) * 60) % 60)
  }

  const values = part === "hour" ? Array.from({ length: 24 }, (_, i) => i) : Array.from({ length: 12 }, (_, i) => i * 5)
  const selected = part === "hour" ? draftHour : draftMinute
  const radiusForHour = (n: number) => n < 12 ? 78 : 48
  const position = (n: number, radius: number) => {
    const angle = (n % 12) * Math.PI / 6
    return { x: 100 + radius * Math.sin(angle), y: 100 - radius * Math.cos(angle) }
  }

  return <>
    <Button id={id} type="button" variant="outline" aria-label={`${label}: ${value || "เลือกเวลา"}`} aria-invalid={invalid} onClick={() => setOpen(true)} className={cn("w-full justify-between font-normal", !value && "text-muted-foreground")}>
      <span className="numeric-font text-base">{value || "เลือกเวลา (24 ชั่วโมง)"}</span><Clock3 className="size-4 text-muted-foreground" aria-hidden="true" />
    </Button>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[min(92dvh,44rem)] overflow-y-auto sm:max-w-sm">
        <DialogHeader><DialogTitle>เลือก{label}</DialogTitle><DialogDescription>เลือกชั่วโมงและนาทีจากหน้าปัดนาฬิกาแบบ 24 ชั่วโมง</DialogDescription></DialogHeader>
        <div className="flex justify-center gap-1" aria-label="เวลาที่กำลังเลือก">
          <Button type="button" variant={part === "hour" ? "default" : "ghost"} className="h-auto px-2 py-1 text-4xl tabular-nums" onClick={() => setPart("hour")}>{two(draftHour)}</Button>
          <span className="py-1 text-4xl">:</span>
          <Button type="button" variant={part === "minute" ? "default" : "ghost"} className="h-auto px-2 py-1 text-4xl tabular-nums" onClick={() => setPart("minute")}>{two(draftMinute)}</Button>
        </div>
        {part === "minute" && <div className="mx-auto flex w-full max-w-[19rem] flex-col gap-1">
          <label htmlFor={`${id}-minute`} className="text-sm font-medium">นาที (00–59)</label>
          <Input id={`${id}-minute`} type="number" inputMode="numeric" min={0} max={59} step={1} value={draftMinute} aria-label="เลือกนาที ตั้งแต่ 00 ถึง 59" aria-valuemin={0} aria-valuemax={59} aria-valuenow={draftMinute} onChange={(event) => {
            const parsed = event.currentTarget.valueAsNumber
            if (Number.isFinite(parsed)) setMinute(parsed)
          }} />
          <p className="text-xs text-muted-foreground">พิมพ์ตัวเลขหรือใช้ปุ่มลูกศรขึ้นและลงเพื่อปรับนาที</p>
        </div>}
        <div className="mx-auto w-full max-w-[19rem] touch-none">
          <svg ref={faceRef} viewBox="0 0 200 200" role="group" aria-label={part === "hour" ? "เลือกชั่วโมง" : "เลือกนาที"} onClick={handleFaceClick} className="block w-full overflow-visible rounded-full bg-muted/60">
            {part === "hour" && <line x1="100" y1="100" {...(() => { const p = position(draftHour, radiusForHour(draftHour)); return { x2: p.x, y2: p.y } })()} stroke="currentColor" strokeWidth="2" className="text-primary" />}
            {part === "minute" && <line x1="100" y1="100" {...(() => { const a = draftMinute * Math.PI / 30; return { x2: 100 + 78 * Math.sin(a), y2: 100 - 78 * Math.cos(a) } })()} stroke="currentColor" strokeWidth="2" className="text-primary" />}
            <circle cx="100" cy="100" r="4" className="fill-primary" />
            {values.map((n) => {
              const p = position(n, part === "hour" ? radiusForHour(n) : 78)
              const active = n === selected
              return <g key={n} role="button" tabIndex={0} aria-label={part === "hour" ? `${two(n)} นาฬิกา` : `${two(n)} นาที`} aria-pressed={active} onClick={(event) => { event.stopPropagation(); if (part === "hour") { setDraft(`${two(n)}:${two(draftMinute)}`); setPart("minute") } else setMinute(n) }} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); if (part === "hour") { setDraft(`${two(n)}:${two(draftMinute)}`); setPart("minute") } else setMinute(n) } }} className="cursor-pointer outline-none focus-visible:fill-primary">
                <circle cx={p.x} cy={p.y} r="12" className={cn(active ? "fill-primary" : "fill-transparent hover:fill-accent")} />
                <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" className={cn("pointer-events-none select-none text-[10px] font-medium", active ? "fill-primary-foreground" : "fill-foreground")}>{two(n)}</text>
              </g>
            })}
          </svg>
          <p className="mt-2 text-center text-sm text-muted-foreground">{part === "hour" ? "เลือกชั่วโมง · วงในคือ 12–23" : "เลือกนาที · แตะหน้าปัดหรือใช้ช่องตัวเลขเพื่อเลือกนาที"}</p>
        </div>
        <DialogFooter className="flex-row">
          <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>ยกเลิก</Button>
          <Button type="button" className="flex-1" onClick={() => { onChange(`${two(draftHour)}:${two(draftMinute)}`); setOpen(false) }}>ยืนยัน</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
}
