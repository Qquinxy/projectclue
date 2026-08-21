"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  LayoutDashboard,
  Users,
  Calendar,
  UserCheck,
  UserCog,
  Settings,
  ArrowLeft,
  Menu,
  Loader2
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useEffect, useState } from "react"

const sidebarItems = [
  { name: "ภาพรวม", href: "/admin", icon: LayoutDashboard },
  { name: "จัดการชมรม", href: "/admin/clubs", icon: Users },
  { name: "จัดการกิจกรรม", href: "/admin/activities", icon: Calendar },
  { name: "จัดการสมาชิก", href: "/admin/members", icon: UserCheck },
  { name: "จัดการผู้ดูแลชมรม", href: "/admin/club-admins", icon: UserCog },
  { name: "ตั้งค่าระบบ", href: "/admin/settings", icon: Settings, superadminOnly: true },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [open, setOpen] = useState(false)

  const isAuthorized = user?.role === "superadmin" || user?.role === "club_admin"
  const isSuperadmin = user?.role === "superadmin"
  const isSettingsRoute = pathname === "/admin/settings"

  useEffect(() => {
    if (!isLoading && !isAuthorized) {
      router.replace("/dashboard")
    } else if (!isLoading && isAuthorized && !isSuperadmin && isSettingsRoute) {
      router.replace("/admin")
    }
  }, [isLoading, isAuthorized, isSuperadmin, isSettingsRoute, router])

  if (isLoading || !isAuthorized || (!isSuperadmin && isSettingsRoute)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const visibleSidebarItems = sidebarItems.filter((item) => !item.superadminOnly || isSuperadmin)

  const SidebarContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">ผู้ดูแลระบบ</h2>
        <p className="text-sm text-muted-foreground">จัดการชมรมและกิจกรรม</p>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1">
        {visibleSidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
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
      <div className="p-4 border-t border-border">
        <Link
          href="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าหลัก
        </Link>
      </div>
    </>
  )

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Mobile Header & Sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0">
                <div className="flex flex-col h-full">
                  <SidebarContent />
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-semibold">ผู้ดูแลระบบ</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 pt-20 lg:pt-8 overflow-auto">
        {children}
      </main>
    </div>
  )
}
