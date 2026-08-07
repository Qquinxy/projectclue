import Link from "next/link"
import { Users } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
              <Users className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">RMUTL Club</span>
          </div>

          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/clubs" className="hover:text-foreground">ชมรม</Link>
            <Link href="/activities" className="hover:text-foreground">กิจกรรม</Link>
            <Link href="/dashboard" className="hover:text-foreground">แดชบอร์ด</Link>
          </nav>

          <p className="text-xs text-muted-foreground">
            2026 University Club System
          </p>
        </div>
      </div>
    </footer>
  )
}
