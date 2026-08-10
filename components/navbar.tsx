"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, LogOut, LayoutDashboard, Calendar, Users, Settings } from "lucide-react"
import { useState } from "react"

const navigation = [
  { name: "หน้าแรก", href: "/" },
  { name: "ชมรม", href: "/clubs" },
  { name: "กิจกรรม", href: "/activities" },
]

export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  return (
    <header className="navbar-shadow sticky top-0 z-50 w-full border-b border-white/15 bg-[#6b3e00] text-white">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f6f3ea]">
              <Users className="h-4 w-4 text-[#6b3e00]" />
            </div>
            <span className="font-semibold text-white">RMUTL Club</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors",
                  pathname === item.href
                    ? "bg-white/20 text-white font-medium"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-white hover:bg-white/15 hover:text-white focus-visible:ring-white/50"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-white/20 text-white text-xs">
                        {user.firstName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{user.firstName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-muted-foreground">{user.studentId}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard" className="gap-2">
                      <LayoutDashboard className="h-4 w-4" />
                      แดชบอร์ด
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/my-clubs" className="gap-2">
                      <Users className="h-4 w-4" />
                      ชมรมของฉัน
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard/my-activities" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      กิจกรรมของฉัน
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="gap-2">
                      <Settings className="h-4 w-4" />
                      ผู้ดูแลระบบ
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive gap-2">
                    <LogOut className="h-4 w-4" />
                    ออกจากระบบ
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/15 hover:text-white focus-visible:ring-white/50"
              >
                <Link href="/login">เข้าสู่ระบบ</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-[#f6f3ea] text-[#6b3e00] hover:bg-white focus-visible:ring-white/50"
              >
                <Link href="/register">สมัครสมาชิก</Link>
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-white hover:bg-white/15 hover:text-white focus-visible:ring-white/50"
              >
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64 bg-[#f6f3ea] text-foreground">
              <div className="flex flex-col gap-4 pt-4">
                {user && (
                  <div className="flex items-center gap-3 pb-4 border-b">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {user.firstName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{user.firstName}</p>
                      <p className="text-xs text-muted-foreground">{user.studentId}</p>
                    </div>
                  </div>
                )}
                <nav className="flex flex-col gap-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "px-3 py-2 text-sm rounded-md transition-colors",
                        pathname === item.href
                          ? "bg-[#6b3e00] text-white font-medium"
                          : "text-foreground/70 hover:text-foreground hover:bg-black/5"
                      )}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                {user ? (
                  <div className="border-t pt-4 flex flex-col gap-1">
                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-secondary"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      แดชบอร์ด
                    </Link>
                    <Link
                      href="/admin"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-secondary"
                    >
                      <Settings className="h-4 w-4" />
                      ผู้ดูแลระบบ
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout()
                        setOpen(false)
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md text-destructive hover:bg-secondary text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      ออกจากระบบ
                    </button>
                  </div>
                ) : (
                  <div className="border-t pt-4 flex flex-col gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href="/login" onClick={() => setOpen(false)}>เข้าสู่ระบบ</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/register" onClick={() => setOpen(false)}>สมัครสมาชิก</Link>
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
