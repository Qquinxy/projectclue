"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { api, apiUpload, resolveImageUrl } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { CLUB_CATEGORIES, type Club, type ClubCategory } from "@/lib/types"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Eye,
  Loader2,
  AlertCircle,
  ImageUp
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface RawClub extends Omit<Club, "id"> {
  id?: string
  _id?: string
}

interface ClubsResponse {
  success: boolean
  message?: string
  data: {
    clubs: RawClub[]
  }
}

interface ClubResponse {
  success: boolean
  message?: string
  data: {
    club: RawClub
  }
}

// The API returns clubs keyed by _id, not id — normalize here so the view
// link and delete action below use a real id.
function normalizeClub(club: RawClub): Club {
  return { ...club, id: club.id ?? club._id ?? "" }
}

interface ClubFormState {
  name: string
  description: string
  category: ClubCategory | ""
  maxMembers: string
  image: string
  advisorName: string
  contactEmail: string
  contactPhone: string
  meetingSchedule: string
  location: string
  requirements: string
  benefits: string
}

const emptyClubForm: ClubFormState = {
  name: "",
  description: "",
  category: "",
  maxMembers: "",
  image: "",
  advisorName: "",
  contactEmail: "",
  contactPhone: "",
  meetingSchedule: "",
  location: "",
  requirements: "",
  benefits: "",
}

function clubToFormState(club: Club): ClubFormState {
  return {
    name: club.name,
    description: club.description,
    category: club.category,
    maxMembers: String(club.maxMembers),
    image: club.image ?? "",
    advisorName: club.advisorName ?? "",
    contactEmail: club.contactEmail ?? "",
    contactPhone: club.contactPhone ?? "",
    meetingSchedule: club.meetingSchedule ?? "",
    location: club.location ?? "",
    requirements: (club.requirements ?? []).join("\n"),
    benefits: (club.benefits ?? []).join("\n"),
  }
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB, matches the backend's multer limit
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"]

// Builds the POST/PATCH body: required fields always included, optional
// fields included only when the admin actually provided a value. Never
// includes memberCount/createdBy — those are server-managed. The image is
// never sent here — it's uploaded separately via POST /clubs/:id/image.
function buildClubPayload(form: ClubFormState) {
  const payload: Record<string, unknown> = {
    name: form.name.trim(),
    description: form.description.trim(),
    category: form.category,
    maxMembers: Number(form.maxMembers),
  }

  if (form.advisorName.trim()) payload.advisorName = form.advisorName.trim()
  if (form.contactEmail.trim()) payload.contactEmail = form.contactEmail.trim()
  if (form.contactPhone.trim()) payload.contactPhone = form.contactPhone.trim()
  if (form.meetingSchedule.trim()) payload.meetingSchedule = form.meetingSchedule.trim()
  if (form.location.trim()) payload.location = form.location.trim()

  const requirements = form.requirements.split("\n").map((s) => s.trim()).filter(Boolean)
  if (requirements.length > 0) payload.requirements = requirements

  const benefits = form.benefits.split("\n").map((s) => s.trim()).filter(Boolean)
  if (benefits.length > 0) payload.benefits = benefits

  return payload
}

export default function AdminClubsPage() {
  const { user } = useAuth()
  const isClubAdmin = user?.role === "club_admin"
  const managedClubIds = new Set(user?.managedClubs ?? [])

  const [searchQuery, setSearchQuery] = useState("")
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedClub, setSelectedClub] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingClubId, setEditingClubId] = useState<string | null>(null)
  const [form, setForm] = useState<ClubFormState>(emptyClubForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState<string | null>(null)
  const imagePreviewUrlRef = useRef<string | null>(null)

  // Revoke the previous object URL whenever the preview changes or the
  // component unmounts, so we don't leak blob URLs.
  useEffect(() => {
    imagePreviewUrlRef.current = imagePreviewUrl
    return () => {
      if (imagePreviewUrlRef.current) URL.revokeObjectURL(imagePreviewUrlRef.current)
    }
  }, [imagePreviewUrl])

  const handleImageSelect = (file: File | null) => {
    setImageError(null)
    if (!file) {
      setImageFile(null)
      setImagePreviewUrl(null)
      return
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError("รองรับเฉพาะไฟล์รูปภาพ JPEG, PNG, WEBP หรือ GIF")
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setImageError("ขนาดไฟล์ต้องไม่เกิน 5MB")
      return
    }

    setImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
  }

  const fetchClubs = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      const query = params.toString()
      const response = await api<ClubsResponse>(`/clubs${query ? `?${query}` : ""}`)
      setClubs((response.data?.clubs ?? []).map(normalizeClub))
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อชมรมได้")
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    const timeout = setTimeout(fetchClubs, 300)
    return () => clearTimeout(timeout)
  }, [fetchClubs])

  const handleDelete = (clubId: string) => {
    setSelectedClub(clubId)
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedClub) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await api(`/clubs/${selectedClub}`, { method: "DELETE" })
      setDeleteDialogOpen(false)
      setSelectedClub(null)
      await fetchClubs()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "ไม่สามารถลบชมรมได้")
    } finally {
      setIsDeleting(false)
    }
  }

  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetImageState = () => {
    setImageFile(null)
    setImagePreviewUrl(null)
    setImageError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const openCreateDialog = () => {
    setFormMode("create")
    setEditingClubId(null)
    setForm(emptyClubForm)
    setFormError(null)
    resetImageState()
    setFormDialogOpen(true)
  }

  const openEditDialog = (club: Club) => {
    setFormMode("edit")
    setEditingClubId(club.id)
    setForm(clubToFormState(club))
    setFormError(null)
    resetImageState()
    setFormDialogOpen(true)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      const payload = buildClubPayload(form)
      let clubId = editingClubId

      if (formMode === "create") {
        const response = await api<ClubResponse>("/clubs", { method: "POST", body: payload })
        clubId = response.data?.club ? normalizeClub(response.data.club).id : null
      } else if (editingClubId) {
        await api(`/clubs/${editingClubId}`, { method: "PATCH", body: payload })
      }

      if (imageFile && clubId) {
        const formData = new FormData()
        formData.append("image", imageFile)
        await apiUpload(`/clubs/${clubId}/image`, formData)
      }

      setFormDialogOpen(false)
      await fetchClubs()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลชมรมได้")
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid =
    form.name.trim() !== "" &&
    form.description.trim() !== "" &&
    form.category !== "" &&
    form.maxMembers.trim() !== "" &&
    Number(form.maxMembers) > 0 &&
    !imageError

  // GET /clubs is not role-filtered server-side, so club admins only see
  // clubs they manage by scoping the list here.
  const visibleClubs = isClubAdmin
    ? clubs.filter((club) => managedClubIds.has(club.id))
    : clubs

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">จัดการชมรม</h1>
          <p className="text-muted-foreground">เพิ่ม แก้ไข และลบข้อมูลชมรม</p>
        </div>
        {!isClubAdmin && (
          <Button onClick={openCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            เพิ่มชมรมใหม่
          </Button>
        )}
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชมรม..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clubs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg tracking-tight flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            รายชื่อชมรม (<span className="numeric-font">{visibleClubs.length}</span>)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-xl border border-dashed py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อชมรม</TableHead>
                    <TableHead>หมวดหมู่</TableHead>
                    <TableHead>อาจารย์ที่ปรึกษา</TableHead>
                    <TableHead>สมาชิก</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleClubs.map((club) => {
                    const category = CLUB_CATEGORIES.find(c => c.value === club.category)
                    const isFull = club.memberCount >= club.maxMembers

                    return (
                      <TableRow key={club.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {club.image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={resolveImageUrl(club.image)}
                                alt=""
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Users className="h-5 w-5 text-primary" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-foreground">{club.name}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {club.location}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn("text-xs text-primary-foreground", category?.color)}
                          >
                            {category?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {club.advisorName}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="numeric-font font-medium">{club.memberCount}</span>
                            <span className="numeric-font text-muted-foreground">/ {club.maxMembers}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isFull ? (
                            <Badge variant="secondary">เต็ม</Badge>
                          ) : (
                            <Badge variant="outline" className="text-primary border-primary">
                              เปิดรับสมัคร
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="ghost" size="icon">
                              <Link href={`/clubs/${club.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(club)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            {!isClubAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(club.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {visibleClubs.length === 0 && (
                <div className="rounded-xl border border-dashed py-12 text-center">
                  <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">ไม่พบชมรม</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit Dialog */}
      <Dialog open={formDialogOpen} onOpenChange={setFormDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "เพิ่มชมรมใหม่" : "แก้ไขข้อมูลชมรม"}</DialogTitle>
            <DialogDescription>
              {formMode === "create" ? "กรอกข้อมูลชมรมที่ต้องการเพิ่ม" : "แก้ไขข้อมูลชมรมนี้"}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="club-name">ชื่อชมรม</FieldLabel>
              <Input
                id="club-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="club-description">รายละเอียด</FieldLabel>
              <Textarea
                id="club-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="club-category">หมวดหมู่</FieldLabel>
              <Select
                value={form.category || undefined}
                onValueChange={(value) => setForm((f) => ({ ...f, category: value as ClubCategory }))}
              >
                <SelectTrigger id="club-category" className="w-full">
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  {CLUB_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="club-max-members">จำนวนสมาชิกสูงสุด</FieldLabel>
              <Input
                id="club-max-members"
                type="number"
                min={1}
                value={form.maxMembers}
                onChange={(e) => setForm((f) => ({ ...f, maxMembers: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="club-image">รูปภาพ</FieldLabel>
              <div className="flex items-center gap-4">
                {imagePreviewUrl || form.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagePreviewUrl ?? resolveImageUrl(form.image)}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-border"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ImageUp className="h-6 w-6 text-primary" />
                  </div>
                )}
                <Input
                  id="club-image"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => handleImageSelect(e.target.files?.[0] ?? null)}
                  className="flex-1"
                />
              </div>
              {imageError && (
                <p className="text-sm text-destructive">{imageError}</p>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="club-advisor">อาจารย์ที่ปรึกษา</FieldLabel>
              <Input
                id="club-advisor"
                value={form.advisorName}
                onChange={(e) => setForm((f) => ({ ...f, advisorName: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="club-contact-email">อีเมลติดต่อ</FieldLabel>
              <Input
                id="club-contact-email"
                type="email"
                value={form.contactEmail}
                onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="club-contact-phone">เบอร์โทรติดต่อ</FieldLabel>
              <Input
                id="club-contact-phone"
                value={form.contactPhone}
                onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="club-meeting-schedule">ตารางประชุม</FieldLabel>
              <Input
                id="club-meeting-schedule"
                value={form.meetingSchedule}
                onChange={(e) => setForm((f) => ({ ...f, meetingSchedule: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="club-location">สถานที่</FieldLabel>
              <Input
                id="club-location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="club-requirements">คุณสมบัติผู้สมัคร (บรรทัดละ 1 ข้อ)</FieldLabel>
              <Textarea
                id="club-requirements"
                value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
                rows={3}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="club-benefits">สิทธิประโยชน์ (บรรทัดละ 1 ข้อ)</FieldLabel>
              <Textarea
                id="club-benefits"
                value={form.benefits}
                onChange={(e) => setForm((f) => ({ ...f, benefits: e.target.value }))}
                rows={3}
              />
            </Field>
          </FieldGroup>

          {formError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleSubmit} disabled={!isFormValid || isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : formMode === "create" ? "เพิ่มชมรม" : "บันทึกการแก้ไข"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบชมรม</DialogTitle>
            <DialogDescription>
              คุณต้องการลบชมรมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "กำลังลบ..." : "ลบชมรม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
