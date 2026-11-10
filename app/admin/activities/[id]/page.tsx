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
import { api, apiBlob, apiDownload } from "@/lib/api"
import type { Activity, ParticipationStatus } from "@/lib/types"
import { notifyOnce } from "@/lib/notifications"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ArrowLeft,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  Download,
  FileSpreadsheet,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Participant {
  id: string
  status: ParticipationStatus
  registeredAt: string
  attendedAt: string | null
  hoursEarned: number
  evidence?: { contentType: string; uploadedAt: string }
  evidenceAvailable: boolean
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
  const [attendanceConfirmation, setAttendanceConfirmation] = useState<{ id: string; action: "attend" | "absent" } | null>(null)
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)

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
    if (pendingId) return
    setPendingId(participationId)
    setActionErrors((prev) => ({ ...prev, [participationId]: "" }))
    try {
      await api(`/admin/participations/${participationId}/${action}`, { method: "PATCH" })
      notifyOnce(`attendance-${participationId}`, action === "attend" ? "บันทึกการเข้าร่วมแล้ว" : "บันทึกสถานะขาดกิจกรรมแล้ว")
      setAttendanceConfirmation(null)
      await fetchData()
    } catch (err) {
      setActionErrors((prev) => ({
        ...prev,
        [participationId]: err instanceof Error ? err.message : "ไม่สามารถบันทึกการเข้าร่วมได้"
      }))
      notifyOnce(`attendance-error-${participationId}`, "บันทึกสถานะไม่สำเร็จ", err instanceof Error ? err.message : "กรุณาลองอีกครั้ง", "destructive")
    } finally {
      setPendingId(null)
    }
  }

  // Export is authorized server-side: the backend re-checks that this
  // activity's club is one the signed-in admin manages, so a club_admin
  // cannot export another club's activity by editing the URL.
  const handleExport = async (format: "csv" | "xlsx") => {
    setExportFormat(format)
    setExportError(null)
    try {
      await apiDownload(
        `/activities/${id}/participants/export?format=${format}`,
        `participants.${format}`
      )
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "ไม่สามารถดาวน์โหลดไฟล์ได้")
    } finally {
      setExportFormat(null)
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {activity ? `ผู้เข้าร่วม: ${activity.title}` : "รายชื่อผู้เข้าร่วม"}
          </h1>
          <p className="text-muted-foreground">ยืนยันการเข้าร่วมและมอบชั่วโมงจิตอาสา</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("csv")}
            disabled={exportFormat !== null || isLoading}
          >
            {exportFormat === "csv" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            ดาวน์โหลด CSV
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("xlsx")}
            disabled={exportFormat !== null || isLoading}
          >
            {exportFormat === "xlsx" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            ดาวน์โหลด Excel
          </Button>
        </div>
      </div>

      {exportError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{exportError}</span>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            รายชื่อผู้ลงทะเบียน (<span className="numeric-font">{participants.length}</span>)
          </CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={() => void fetchData()} disabled={isLoading || !!pendingId}>
            <RefreshCw className={cn("mr-1 h-4 w-4", isLoading && "animate-spin")} />
            รีเฟรชสถานะหลักฐาน
          </Button>
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
                            {participant.status === "registered" && (
                              <p className={cn("mr-auto text-xs", participant.evidenceAvailable ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground")}>
                                {participant.evidenceAvailable ? "มีรูปหลักฐานแล้ว" : "ยังไม่มีรูปหลักฐาน · ให้นักศึกษาอัปโหลดที่กิจกรรมของฉัน"}
                              </p>
                            )}
                            {participant.status === "registered" ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => setAttendanceConfirmation({ id: participant.id, action: "attend" })}
                                  disabled={isPending || !participant.evidenceAvailable}
                                  title={!participant.evidenceAvailable ? "ต้องอัปโหลดรูปหลักฐานก่อนจึงจะอนุมัติการเข้าร่วมกิจกรรมได้" : undefined}
                                >
                                  <CheckCircle className="mr-1 h-4 w-4" />
                                  เข้าร่วม
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setAttendanceConfirmation({ id: participant.id, action: "absent" })}
                                  disabled={isPending}
                                >
                                  <XCircle className="mr-1 h-4 w-4" />
                                  ขาดร่วม
                                </Button>
                              </>
                            ) : (
                              <span className="text-sm text-muted-foreground">บันทึกแล้ว</span>
                            )}
                            {participant.evidenceAvailable && (
                              <EvidenceButton participationId={participant.id} activityTitle={activity?.title ?? "กิจกรรม"} />
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
      <AlertDialog open={!!attendanceConfirmation} onOpenChange={(open) => { if (!open && !pendingId) setAttendanceConfirmation(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{attendanceConfirmation?.action === "attend" ? "ยืนยันการบันทึกว่าเข้าร่วม" : "ยืนยันการบันทึกว่าขาดกิจกรรม"}</AlertDialogTitle>
            <AlertDialogDescription>
              {attendanceConfirmation?.action === "attend"
                ? "การยืนยันนี้จะบันทึกการเข้าร่วมและให้ระบบเดิมคำนวณชั่วโมงจิตอาสาตามกิจกรรม"
                : "การยืนยันนี้จะบันทึกสถานะขาดกิจกรรมตามระบบเดิม"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!pendingId}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              disabled={!attendanceConfirmation || !!pendingId}
              onClick={(event) => {
                event.preventDefault()
                if (attendanceConfirmation) void markAttendance(attendanceConfirmation.id, attendanceConfirmation.action)
              }}
            >
              {pendingId ? "กำลังบันทึก..." : "ยืนยัน"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EvidenceButton({ participationId, activityTitle }: { participationId: string; activityTitle: string }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const openEvidence = async () => {
    setIsLoading(true)
    try {
      const blob = await apiBlob(`/admin/participations/${participationId}/evidence`)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch (error) {
      notifyOnce(
        `admin-evidence-${participationId}`,
        "โหลดรูปหลักฐานไม่สำเร็จ",
        error instanceof Error ? error.message : "กรุณาลองอีกครั้ง",
        "destructive"
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" disabled={isLoading} onClick={openEvidence}>
        {isLoading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
        ดูหลักฐาน
      </Button>
      <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) setPreviewUrl(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>หลักฐานการเข้าร่วม</DialogTitle>
            <DialogDescription>{activityTitle}</DialogDescription>
          </DialogHeader>
          {previewUrl && <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt={`หลักฐานการเข้าร่วม ${activityTitle}`} className="max-h-[70vh] w-full rounded-md object-contain" />
          </>}
        </DialogContent>
      </Dialog>
    </>
  )
}
