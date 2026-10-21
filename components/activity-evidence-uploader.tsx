"use client"

import { useEffect, useRef, useState } from "react"
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { api, apiBlob, apiUpload } from "@/lib/api"
import { notifyOnce } from "@/lib/notifications"

type EvidenceMetadata = { contentType: string; uploadedAt: string }

const MAX_EVIDENCE_BYTES = 10 * 1024 * 1024
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]

export function ActivityEvidenceUploader({
  participationId,
  initialEvidence,
}: {
  participationId: string
  initialEvidence?: EvidenceMetadata | null
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [evidence, setEvidence] = useState(initialEvidence ?? null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setEvidence(initialEvidence ?? null)
  }, [initialEvidence])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const handleSelect = async (file?: File) => {
    if (!file) return
    setSelectedFile(file)
    setMessage("")
    setError("")

    if (file.type && !ACCEPTED_TYPES.includes(file.type)) {
      setError("ไฟล์นี้ไม่รองรับ กรุณาเลือก JPEG, PNG หรือ WebP")
      return
    }
    if (file.size > MAX_EVIDENCE_BYTES) {
      setError("ไฟล์มีขนาดเกิน 10 MB กรุณาเลือกไฟล์ที่เล็กลง")
      return
    }

    setIsUploading(true)
    setMessage("กำลังอัปโหลดรูปหลักฐาน…")
    try {
      const body = new FormData()
      body.append("evidence", file)
      const response = await apiUpload<{ data?: { participation?: { evidence?: EvidenceMetadata } } }>(
        `/students/me/participations/${participationId}/evidence`,
        body,
      )
      setEvidence(response.data?.participation?.evidence ?? {
        contentType: file.type,
        uploadedAt: new Date().toISOString(),
      })
      setSelectedFile(null)
      setMessage("อัปโหลดรูปหลักฐานสำเร็จ")
      notifyOnce(`evidence-upload-${participationId}`, "ส่งรูปหลักฐานแล้ว")
    } catch (uploadError) {
      const detail = uploadError instanceof Error ? uploadError.message : "กรุณาลองอีกครั้ง"
      setMessage("")
      setError(`อัปโหลดไม่สำเร็จ: ${detail}`)
      notifyOnce(`evidence-upload-error-${participationId}`, "ส่งรูปหลักฐานไม่สำเร็จ", detail, "destructive")
    } finally {
      setIsUploading(false)
    }
  }

  const handlePreview = async () => {
    setIsLoadingPreview(true)
    setError("")
    try {
      const blob = await apiBlob(`/students/me/participations/${participationId}/evidence`)
      setPreviewUrl(URL.createObjectURL(blob))
    } catch (previewError) {
      const detail = previewError instanceof Error ? previewError.message : "กรุณาลองอีกครั้ง"
      setError(`โหลดรูปไม่สำเร็จ: ${detail}`)
      notifyOnce(`evidence-view-error-${participationId}`, "โหลดรูปหลักฐานไม่สำเร็จ", detail, "destructive")
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)
    setError("")
    try {
      await api(`/students/me/participations/${participationId}/evidence`, { method: "DELETE" })
      setEvidence(null)
      setPreviewUrl(null)
      setConfirmDelete(false)
      setMessage("ลบรูปหลักฐานแล้ว")
      notifyOnce(`evidence-delete-${participationId}`, "ลบรูปหลักฐานแล้ว")
    } catch (deleteError) {
      const detail = deleteError instanceof Error ? deleteError.message : "กรุณาลองอีกครั้ง"
      setError(`ลบรูปไม่สำเร็จ: ${detail}`)
      notifyOnce(`evidence-delete-error-${participationId}`, "ลบรูปหลักฐานไม่สำเร็จ", detail, "destructive")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="mt-5 rounded-lg border bg-muted/20 p-4" aria-labelledby={`evidence-title-${participationId}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 id={`evidence-title-${participationId}`} className="flex items-center gap-2 font-semibold">
            <ImagePlus className="h-5 w-5 text-primary" />
            รูปหลักฐานการเข้าร่วมกิจกรรม
          </h3>
          <p className={`mt-1 text-sm font-medium ${evidence ? "text-emerald-700 dark:text-emerald-400" : "text-muted-foreground"}`} role="status">
            {evidence ? "ส่งหลักฐานแล้ว" : "ยังไม่ส่งหลักฐาน"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">ไม่บังคับ · JPEG, PNG หรือ WebP · ไม่เกิน 10 MB</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={isUploading}
            onChange={(event) => {
              void handleSelect(event.currentTarget.files?.[0])
              event.currentTarget.value = ""
            }}
          />
          <Button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}>
            {isUploading ? <Loader2 className="animate-spin" /> : <Upload />}
            {evidence ? "เปลี่ยนรูปหลักฐาน" : "อัปโหลดรูปหลักฐาน"}
          </Button>
          {evidence && (
            <>
              <Button type="button" variant="outline" onClick={handlePreview} disabled={isLoadingPreview}>
                {isLoadingPreview ? <Loader2 className="animate-spin" /> : null}
                ดูตัวอย่าง
              </Button>
              <Button type="button" variant="outline" onClick={() => setConfirmDelete(true)} disabled={isDeleting} aria-label="ลบรูปหลักฐาน">
                {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
                ลบ
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedFile && (
        <p className="mt-3 break-all text-sm" aria-live="polite">ไฟล์ที่เลือก: {selectedFile.name}</p>
      )}
      {message && <p className="mt-2 text-sm text-muted-foreground" role="status">{message}</p>}
      {error && <p className="mt-2 text-sm text-destructive" role="alert">{error}</p>}
      {previewUrl && (
        <div className="mt-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="ตัวอย่างรูปหลักฐานการเข้าร่วมกิจกรรม" className="max-h-80 max-w-full rounded-md border object-contain" />
          <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setPreviewUrl(null)}>ปิดตัวอย่าง</Button>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบรูปหลักฐาน</AlertDialogTitle>
            <AlertDialogDescription>รูปหลักฐานนี้จะถูกลบออกจากรายการเข้าร่วมกิจกรรม</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={(event) => { event.preventDefault(); void handleDelete() }}>
              {isDeleting ? "กำลังลบ…" : "ยืนยันลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
