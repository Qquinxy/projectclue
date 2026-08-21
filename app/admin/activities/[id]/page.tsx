"use client"

import { use, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { api } from "@/lib/api"
import type { Activity, ParticipationStatus } from "@/lib/types"
import {
  ArrowLeft,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Participant {
  id: string
  status: ParticipationStatus
  registeredAt: string
  attendedAt: string | null
  hoursEarned: number
  student: {
    id: string
    studentId: string
    firstName: string
    lastName: string
  }
}

interface RawParticipant extends Omit<Participant, "id"> {
  id?: string
  _id?: string
}

interface ActivityResponse {
  success: boolean
  message?: string
  data: {
    activity: Activity
  }
}

interface ParticipantsResponse {
  success: boolean
  message?: string
  data: {
    participants: RawParticipant[]
  }
}

// The API returns participations keyed by _id, not id — normalize here so the
// attend/absent action below targets a real participation id.
function normalizeParticipant(participant: RawParticipant): Participant {
  return { ...participant, id: participant.id ?? participant._id ?? "" }
}

const statusConfig: Record<ParticipationStatus, { label: string; color: string; icon: typeof Clock }> = {
  registered: { label: "ลงทะเบียนแล้ว", color: "bg-accent/10 text-accent", icon: Clock },
  attended: { label: "เข้าร่วมแล้ว", color: "bg-primary/10 text-primary", icon: CheckCircle },
  absent: { label: "ไม่ได้เข้าร่วม", color: "bg-destructive/10 text-destructive", icon: XCircle },
  cancelled: { label: "ยกเลิก", color: "bg-muted text-muted-foreground", icon: XCircle },
}

export default function AdminActivityParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)

  const [activity, setActivity] = useState<Activity | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({})
  const [pendingId, setPendingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [activityRes, participantsRes] = await Promise.all([
        api<ActivityResponse>(`/activities/${id}`),
        api<ParticipantsResponse>(`/activities/${id}/participants`),
      ])
      setActivity(activityRes.data?.activity ?? null)
      setParticipants((participantsRes.data?.participants ?? []).map(normalizeParticipant))
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อผู้เข้าร่วมได้")
    } finally {
      setIsLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const markAttendance = async (participationId: string, action: "attend" | "absent") => {
    setPendingId(participationId)
    setActionErrors((prev) => ({ ...prev, [participationId]: "" }))
    try {
      await api(`/admin/participations/${participationId}/${action}`, { method: "PATCH" })
      await fetchData()
    } catch (err) {
      setActionErrors((prev) => ({
        ...prev,
        [participationId]: err instanceof Error ? err.message : "ไม่สามารถบันทึกการเข้าร่วมได้"
      }))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/activities"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปหน้าจัดการกิจกรรม
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {activity ? `ผู้เข้าร่วม: ${activity.title}` : "รายชื่อผู้เข้าร่วม"}
        </h1>
        <p className="text-muted-foreground">ยืนยันการเข้าร่วมและมอบชั่วโมงจิตอาสา</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            รายชื่อผู้ลงทะเบียน (<span className="numeric-font">{participants.length}</span>)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-muted-foreground">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : participants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">ยังไม่มีผู้ลงทะเบียนกิจกรรมนี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>นักศึกษา</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>ชั่วโมงที่ได้รับ</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((participant) => {
                    const status = statusConfig[participant.status]
                    const StatusIcon = status.icon
                    const isPending = pendingId === participant.id
                    const actionError = actionErrors[participant.id]

                    return (
                      <TableRow key={participant.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                {participant.student.firstName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground">
                                {participant.student.firstName} {participant.student.lastName}
                              </div>
                              <div className="numeric-font text-sm text-muted-foreground">
                                {participant.student.studentId}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs gap-1", status.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {status.label}
                          </Badge>
                          {actionError && (
                            <p className="text-xs text-destructive mt-1">{actionError}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {participant.hoursEarned > 0 ? (
                            <span className="numeric-font font-medium text-primary">
                              {participant.hoursEarned} ชม.
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            {participant.status === "registered" ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => markAttendance(participant.id, "attend")}
                                  disabled={isPending}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  เข้าร่วม
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markAttendance(participant.id, "absent")}
                                  disabled={isPending}
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  ขาดร่วม
                                </Button>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">บันทึกแล้ว</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
