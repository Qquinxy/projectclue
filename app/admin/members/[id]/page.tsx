"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { formatActivityDate, formatActivityTime } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"

interface StudentOverview {
  student: { studentId: string; firstName: string; lastName: string; faculty: string; major: string; year: number }
  totalVolunteerHours: number
  memberships: { club: { name: string } | null; joinedAt: string }[]
  participations: { status: string; hoursEarned: number; activity: { title: string; date: string; startTime: string; endTime: string; club?: { name: string } } | null }[]
}

export default function AdminStudentDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<StudentOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api<{ data: StudentOverview }>(`/admin/students/${id}/dashboard`)
      .then((response) => setData(response.data))
      .catch((reason) => setError(reason instanceof Error ? reason.message : "ไม่สามารถโหลดข้อมูลได้"))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
  if (error || !data) return <div className="flex items-center gap-2 py-12 text-destructive"><AlertCircle className="h-5 w-5" />{error ?? "ไม่พบข้อมูลนักศึกษา"}</div>

  return <div className="space-y-6">
    <Link href="/admin/members" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />กลับไปรายชื่อสมาชิก</Link>
    <div>
      <h1 className="text-2xl font-bold">{data.student.firstName} {data.student.lastName}</h1>
      <p className="text-muted-foreground">{data.student.studentId} · {data.student.faculty} · {data.student.major} · ชั้นปี {data.student.year}</p>
    </div>
    <Card><CardHeader><CardTitle>ภาพรวม</CardTitle></CardHeader><CardContent>ชั่วโมงจิตอาสา {data.totalVolunteerHours} ชั่วโมง · สมาชิก {data.memberships.length} ชมรม</CardContent></Card>
    <Card><CardHeader><CardTitle>ชมรม</CardTitle></CardHeader><CardContent className="space-y-2">{data.memberships.map((item, index) => <div key={`${item.club?.name}-${index}`}>{item.club?.name ?? "ชมรมที่ไม่พบ"} · {new Date(item.joinedAt).toLocaleDateString("th-TH")}</div>)}</CardContent></Card>
    <Card><CardHeader><CardTitle>ประวัติกิจกรรม</CardTitle></CardHeader><CardContent className="space-y-3">{data.participations.map((item, index) => <div key={`${item.activity?.title}-${index}`} className="border-b pb-3 last:border-0">{item.activity ? <><div className="font-medium">{item.activity.title}</div><div className="text-sm text-muted-foreground">{item.activity.club?.name} · {formatActivityDate(item.activity.date)} · {formatActivityTime(item.activity.startTime)}–{formatActivityTime(item.activity.endTime)} · {item.status} · {item.hoursEarned} ชม.</div></> : <div>ไม่พบข้อมูลกิจกรรม · {item.status}</div>}</div>)}{data.participations.length === 0 && <p className="text-muted-foreground">ยังไม่มีประวัติกิจกรรม</p>}</CardContent></Card>
  </div>
}
