"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/lib/auth-context"
import { api } from "@/lib/api"
import {
  Award,
  Calendar,
  ArrowRight,
  TrendingUp,
  Target,
  CheckCircle,
  Loader2,
  AlertCircle
} from "lucide-react"

interface VolunteerActivity {
  _id: string
  title: string
  club: {
    name: string
  }
}

interface VolunteerParticipation {
  _id: string
  // null when the referenced Activity was hard-deleted before that was
  // blocked. The row itself — and the hours it earned — remain valid.
  activity: VolunteerActivity | null
  status: string
  hoursEarned: number
  attendedAt: string | null
}

interface VolunteerHoursData {
  totalVolunteerHours: number
  activitiesCompleted: number
  history: VolunteerParticipation[]
}

interface VolunteerHoursResponse {
  success: boolean
  message?: string
  data: VolunteerHoursData
}

export default function VolunteerHoursPage() {
  const { user, isLoading: isAuthLoading } = useAuth()
  const [data, setData] = useState<VolunteerHoursData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchVolunteerHours = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await api<VolunteerHoursResponse>("/students/me/volunteer-hours")
        setData(response.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลชั่วโมงจิตอาสาได้")
      } finally {
        setIsLoading(false)
      }
    }

    fetchVolunteerHours()
  }, [user])

  const totalHours = data?.totalVolunteerHours ?? 0
  const volunteerRecords = data?.history ?? []
  const requiredHours = 36
  const progressPercent = Math.min(100, Math.round((totalHours / requiredHours) * 100))
  const remainingHours = Math.max(0, requiredHours - totalHours)

  if (isAuthLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ชั่วโมงจิตอาสา</h1>
          <p className="text-muted-foreground">ติดตามชั่วโมงจิตอาสาที่คุณสะสม</p>
        </div>
        <Card>
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              เกิดข้อผิดพลาด
            </h3>
            <p className="text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ชั่วโมงจิตอาสา</h1>
        <p className="text-muted-foreground">ติดตามชั่วโมงจิตอาสาที่คุณสะสม</p>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">ชั่วโมงสะสมทั้งหมด</p>
                <p className="numeric-font text-4xl font-bold text-primary">{totalHours}</p>
                <p className="text-sm text-muted-foreground">ชั่วโมง</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                <Award className="h-8 w-8 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">เป้าหมาย</p>
                <p className="numeric-font text-4xl font-bold text-foreground">{requiredHours}</p>
                <p className="text-sm text-muted-foreground">ชั่วโมง</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  {remainingHours > 0 ? "ต้องการอีก" : "เกินเป้าหมาย"}
                </p>
                <p className="numeric-font text-4xl font-bold text-foreground">
                  {remainingHours > 0 ? remainingHours : totalHours - requiredHours}
                </p>
                <p className="text-sm text-muted-foreground">ชั่วโมง</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            ความคืบหน้า
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">
                <span className="numeric-font">{totalHours} / {requiredHours}</span> ชั่วโมง
              </span>
              <span className="numeric-font font-semibold text-primary">{progressPercent}%</span>
            </div>
            <div className="h-4 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {progressPercent >= 100 ? (
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">ยินดีด้วย! คุณทำครบตามเป้าหมายแล้ว</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                เข้าร่วมกิจกรรมจิตอาสาเพิ่มอีก <span className="numeric-font">{remainingHours}</span> ชั่วโมง เพื่อให้ครบตามเกณฑ์ที่กำหนด
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">ประวัติกิจกรรมจิตอาสา</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href="/activities?type=volunteer">
              ค้นหากิจกรรมจิตอาสา
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {volunteerRecords.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>กิจกรรม</TableHead>
                    <TableHead>ชมรม</TableHead>
                    <TableHead>วันที่เข้าร่วม</TableHead>
                    <TableHead className="text-right">ชั่วโมง</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {volunteerRecords.map((record) => (
                    <TableRow key={record._id}>
                      <TableCell>
                        {record.activity ? (
                          <Link
                            href={`/activities/${record.activity._id}`}
                            className="font-medium text-foreground hover:text-primary transition-colors"
                          >
                            {record.activity.title}
                          </Link>
                        ) : (
                          // The activity was deleted; the earned hours in this
                          // row are still valid, so the record is kept and
                          // shown as a non-clickable placeholder.
                          <span className="font-medium text-muted-foreground italic">
                            กิจกรรมถูกลบแล้ว
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.activity?.club?.name ?? "-"}
                      </TableCell>
                      <TableCell className="numeric-font text-muted-foreground">
                        {record.attendedAt && new Date(record.attendedAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "long",
                          year: "numeric"
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="font-semibold">
                          <span className="numeric-font">{record.hoursEarned}</span>&nbsp;ชม.
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Award className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                ยังไม่มีประวัติกิจกรรมจิตอาสา
              </h3>
              <p className="text-muted-foreground mb-6">
                เข้าร่วมกิจกรรมจิตอาสาเพื่อสะสมชั่วโมงและพัฒนาทักษะ
              </p>
              <Button asChild>
                <Link href="/activities">
                  <Calendar className="mr-2 h-4 w-4" />
                  ค้นหากิจกรรม
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
