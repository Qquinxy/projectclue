import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockClubs, mockActivities, mockMemberships, mockStudents } from "@/lib/mock-data"
import { 
  Users, 
  Calendar, 
  UserCheck,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle
} from "lucide-react"

export default function AdminDashboardPage() {
  const totalClubs = mockClubs.length
  const totalActivities = mockActivities.length
  const upcomingActivities = mockActivities.filter(a => a.status === "upcoming").length
  const totalMembers = mockMemberships.filter(m => m.status === "active").length
  const pendingMembers = mockMemberships.filter(m => m.status === "pending").length

  const stats = [
    { 
      label: "ชมรมทั้งหมด", 
      value: totalClubs, 
      icon: Users,
      href: "/admin/clubs",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    { 
      label: "กิจกรรมทั้งหมด", 
      value: totalActivities, 
      icon: Calendar,
      href: "/admin/activities",
      color: "text-accent",
      bgColor: "bg-accent/10"
    },
    { 
      label: "สมาชิกทั้งหมด", 
      value: totalMembers, 
      icon: UserCheck,
      href: "/admin/members",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10"
    },
    { 
      label: "กิจกรรมที่กำลังจะมา", 
      value: upcomingActivities, 
      icon: TrendingUp,
      href: "/admin/activities",
      color: "text-chart-4",
      bgColor: "bg-chart-4/10"
    },
  ]

  const recentActivities = mockActivities
    .filter(a => a.status === "upcoming")
    .slice(0, 5)

  const recentClubs = mockClubs.slice(0, 5)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">แดชบอร์ดผู้ดูแลระบบ</h1>
        <p className="text-muted-foreground">ภาพรวมและสถิติของระบบชมรม</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <span className="text-3xl font-bold text-foreground">{stat.value}</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {pendingMembers > 0 && (
        <Card className="border-accent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    มีคำขอสมัครสมาชิกรอการอนุมัติ
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {pendingMembers} คำขอ รอการตรวจสอบ
                  </p>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link href="/admin/members?status=pending">
                  ตรวจสอบ
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Recent Clubs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">ชมรมล่าสุด</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/clubs">
                ดูทั้งหมด
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentClubs.map((club) => (
                <div
                  key={club.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{club.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {club.memberCount} สมาชิก
                    </div>
                  </div>
                  <Badge variant="outline">
                    {club.memberCount}/{club.maxMembers}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Activities */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">กิจกรรมที่กำลังจะมา</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/activities">
                ดูทั้งหมด
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-foreground truncate">{activity.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short"
                      })} - {activity.clubName}
                    </div>
                  </div>
                  <Badge variant="secondary">
                    {activity.currentParticipants}/{activity.maxParticipants}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">การดำเนินการด่วน</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/admin/clubs">
                <Users className="h-6 w-6 text-primary" />
                <span>เพิ่มชมรมใหม่</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/admin/activities">
                <Calendar className="h-6 w-6 text-accent" />
                <span>เพิ่มกิจกรรมใหม่</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/admin/members?status=pending">
                <UserCheck className="h-6 w-6 text-chart-3" />
                <span>อนุมัติสมาชิก</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto py-4 flex-col gap-2">
              <Link href="/admin/settings">
                <CheckCircle className="h-6 w-6 text-chart-4" />
                <span>ตั้งค่าระบบ</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
