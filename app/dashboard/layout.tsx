"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Award,
  User
} from "lucide-react"

const sidebarItems = [
  { name: "ภาพรวม", href: "/dashboard", icon: LayoutDashboard },
  { name: "ชมรมของฉัน", href: "/dashboard/my-clubs", icon: Users },
  { name: "กิจกรรมของฉัน", href: "/dashboard/my-activities", icon: Calendar },
  { name: "ชั่วโมงจิตอาสา", href: "/dashboard/volunteer-hours", icon: Award },
  { name: "โปรไฟล์", href: "/dashboard/profile", icon: User },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-foreground">แดชบอร์ดนักศึกษา</h2>
            <p className="text-sm text-muted-foreground">จัดการชมรมและกิจกรรม</p>
          </div>
          <nav className="flex-1 px-4 pb-4 space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
          <nav className="flex justify-around py-2">
            {sidebarItems.slice(0, 4).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 text-xs font-medium transition-colors",
                  pathname === item.href
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      <div className="hidden lg:block">
        <Footer />
      </div>
    </div>
  )
}
