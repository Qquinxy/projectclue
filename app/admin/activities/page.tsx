"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  ACTIVITY_IMAGE_ACCEPT_ATTR,
  ACTIVITY_IMAGE_ACCEPTED_TYPES,
  ACTIVITY_IMAGE_MAX_BYTES,
  ACTIVITY_TYPES,
  getActivityImages,
  type Activity,
  type ActivityStatus,
  type ActivityType,
  type Club,
} from "@/lib/types"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Eye,
  Award,
  Users,
  Loader2,
  AlertCircle,
  ImageUp,
  X
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

const statusColors = {
  upcoming: "bg-accent text-accent-foreground",
  ongoing: "bg-primary text-primary-foreground",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

const statusLabels = {
  upcoming: "กำลังจะมา",
  ongoing: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
}

interface RawActivity extends Omit<Activity, "id" | "club"> {
  id?: string
  _id?: string
  club: Omit<Activity["club"], "id"> & { id?: string; _id?: string }
}

interface ActivitiesResponse {
  success: boolean
  message?: string
  data: {
    activities: RawActivity[]
  }
}

// The API returns activities (and their populated club) keyed by _id, not id —
// normalize here so the view/participants links and delete action use a real id.
function normalizeActivity(activity: RawActivity): Activity {
  return {
    ...activity,
    id: activity.id ?? activity._id ?? "",
    club: { ...activity.club, id: activity.club.id ?? activity.club._id ?? "" },
  }
}

interface ActivityResponse {
  success: boolean
  message?: string
  data: {
    activity: RawActivity
  }
}

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

function normalizeClub(club: RawClub): Club {
  return { ...club, id: club.id ?? club._id ?? "" }
}

interface ActivityFormState {
  club: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  maxParticipants: string
  type: ActivityType | ""
  location: string
  volunteerHours: string
  status: ActivityStatus | ""
  requirements: string
}

const emptyActivityForm: ActivityFormState = {
  club: "",
  title: "",
  description: "",
  date: "",
  startTime: "",
  endTime: "",
  maxParticipants: "",
  type: "",
  location: "",
  volunteerHours: "",
  status: "",
  requirements: "",
}

// Images per multipart request. Must not exceed the backend's per-request
// cap (multer `files: 20`); larger selections are sent as several requests.
const UPLOAD_BATCH_SIZE = 20

function activityToFormState(activity: Activity): ActivityFormState {
  return {
    club: activity.club.id,
    title: activity.title,
    description: activity.description,
    date: activity.date ? new Date(activity.date).toISOString().slice(0, 10) : "",
    startTime: activity.startTime ?? "",
    endTime: activity.endTime ?? "",
    maxParticipants: String(activity.maxParticipants),
    type: activity.type,
    location: activity.location ?? "",
    volunteerHours: activity.volunteerHours ? String(activity.volunteerHours) : "",
    status: activity.status,
    requirements: (activity.requirements ?? []).join("\n"),
  }
}

// Builds the POST/PATCH body: required fields always included, optional
// fields included only when the admin actually provided a value. Never
// includes currentParticipants/createdBy — those are server-managed — and
// never includes images: the gallery is managed through
// POST/DELETE /activities/:id/images, which is also what stops a PATCH from
// wiping the images of an activity that already has some.
function buildActivityPayload(form: ActivityFormState) {
  const payload: Record<string, unknown> = {
    club: form.club,
    title: form.title.trim(),
    description: form.description.trim(),
    date: form.date,
    startTime: form.startTime.trim(),
    endTime: form.endTime.trim(),
    maxParticipants: Number(form.maxParticipants),
    type: form.type,
  }

  if (form.location.trim()) payload.location = form.location.trim()
  if (form.volunteerHours.trim()) payload.volunteerHours = Number(form.volunteerHours)
  if (form.status) payload.status = form.status

  const requirements = form.requirements.split("\n").map((s) => s.trim()).filter(Boolean)
  if (requirements.length > 0) payload.requirements = requirements

  return payload
}

export default function AdminActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | "all">("all")
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const [clubs, setClubs] = useState<Club[]>([])
  const [formDialogOpen, setFormDialogOpen] = useState(false)
  const [formMode, setFormMode] = useState<"create" | "edit">("create")
  const [editingActivityId, setEditingActivityId] = useState<string | null>(null)
  const [form, setForm] = useState<ActivityFormState>(emptyActivityForm)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // --- gallery editing state ---
  // `existingImages` are paths already stored on the activity; removing one
  // moves it to `pendingRemovals`, which is only applied against the API on
  // submit. `newImages` are files chosen in this dialog and not uploaded yet.
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [pendingRemovals, setPendingRemovals] = useState<string[]>([])
  const [newImages, setNewImages] = useState<{ file: File; previewUrl: string }[]>([])
  const [imageError, setImageError] = useState<string | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

  // Object URLs are revoked when a preview is dropped, when the dialog is
  // reopened, and on unmount, so previews never leak. `newImages` is the only
  // owner of these URLs.
  const newImagesRef = useRef(newImages)
  useEffect(() => {
    newImagesRef.current = newImages
  }, [newImages])
  useEffect(
    () => () => newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)),
    []
  )

  const resetImageState = () => {
    newImagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl))
    setExistingImages([])
    setPendingRemovals([])
    setNewImages([])
    setImageError(null)
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  // Mirrors the backend's multer rules (10MB PER FILE, JPEG/PNG/WEBP). Valid
  // files are kept even when others in the same selection are rejected, and
  // the rejected ones are named so the admin knows which to replace.
  const handleImageSelect = (fileList: FileList | null) => {
    setImageError(null)
    if (!fileList || fileList.length === 0) return

    const accepted: { file: File; previewUrl: string }[] = []
    const wrongType: string[] = []
    const tooLarge: string[] = []

    for (const file of Array.from(fileList)) {
      if (!ACTIVITY_IMAGE_ACCEPTED_TYPES.includes(file.type)) {
        wrongType.push(file.name)
      } else if (file.size > ACTIVITY_IMAGE_MAX_BYTES) {
        tooLarge.push(file.name)
      } else {
        accepted.push({ file, previewUrl: URL.createObjectURL(file) })
      }
    }

    const problems: string[] = []
    if (wrongType.length > 0) {
      problems.push(
        `รองรับเฉพาะไฟล์ JPEG, PNG หรือ WEBP จึงไม่ได้เพิ่ม: ${wrongType.join(", ")}`
      )
    }
    if (tooLarge.length > 0) {
      problems.push(
        `แต่ละรูปต้องมีขนาดไม่เกิน 10MB จึงไม่ได้เพิ่ม: ${tooLarge.join(", ")}`
      )
    }
    setImageError(problems.length > 0 ? problems.join(" / ") : null)

    if (accepted.length > 0) setNewImages((current) => [...current, ...accepted])
    // Clear the input so re-picking the same file still fires onChange.
    if (imageInputRef.current) imageInputRef.current.value = ""
  }

  // Marked for deletion, applied on submit — so closing the dialog without
  // saving leaves the activity's gallery untouched.
  const markExistingImageForRemoval = (image: string) => {
    setExistingImages((current) => current.filter((src) => src !== image))
    setPendingRemovals((current) => (current.includes(image) ? current : [...current, image]))
  }

  const removeNewImage = (index: number) => {
    setNewImages((current) => {
      const target = current[index]
      if (target) URL.revokeObjectURL(target.previewUrl)
      return current.filter((_, i) => i !== index)
    })
    setImageError(null)
  }

  // Applies the pending gallery edits to an activity that already exists.
  // Deletions run first so the resulting order is "kept images, then new
  // ones". Each successful step is dropped from the pending state, so a
  // retry after a partial failure never repeats work already done.
  const syncActivityImages = async (activityId: string) => {
    for (const image of [...pendingRemovals]) {
      await api(`/activities/${activityId}/images`, { method: "DELETE", body: { image } })
      setPendingRemovals((current) => current.filter((src) => src !== image))
    }

    // The endpoint appends, so a selection larger than the backend's
    // per-request cap is simply sent as several requests — there is no limit
    // on how many images an activity ends up with.
    for (let start = 0; start < newImages.length; start += UPLOAD_BATCH_SIZE) {
      const batch = newImages.slice(start, start + UPLOAD_BATCH_SIZE)
      const formData = new FormData()
      // Field name "images" — matches upload.array('images') on the backend.
      batch.forEach((image) => formData.append("images", image.file))
      await apiUpload(`/activities/${activityId}/images`, formData)
      batch.forEach((image) => URL.revokeObjectURL(image.previewUrl))
      // Drop the batch as it lands, so a failure part-way through does not
      // re-upload what already succeeded when the admin retries.
      setNewImages((current) => current.filter((image) => !batch.includes(image)))
    }

    if (newImages.length > 0 && imageInputRef.current) imageInputRef.current.value = ""
  }

  const fetchActivities = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (searchQuery) params.set("search", searchQuery)
      if (statusFilter !== "all") params.set("status", statusFilter)
      const query = params.toString()
      const response = await api<ActivitiesResponse>(`/activities${query ? `?${query}` : ""}`)
      setActivities((response.data?.activities ?? []).map(normalizeActivity))
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายการกิจกรรมได้")
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter])

  useEffect(() => {
    const timeout = setTimeout(fetchActivities, 300)
    return () => clearTimeout(timeout)
  }, [fetchActivities])

  // Needed so the create/edit form can offer a club picker that sends a
  // real club id, per the backend's required `club` ObjectId field.
  useEffect(() => {
    const fetchClubs = async () => {
      try {
        const response = await api<ClubsResponse>("/clubs")
        setClubs((response.data?.clubs ?? []).map(normalizeClub))
      } catch {
        // Non-fatal: the activities list still works without the club picker.
      }
    }
    fetchClubs()
  }, [])

  const handleDelete = (activityId: string) => {
    setSelectedActivity(activityId)
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedActivity) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await api(`/activities/${selectedActivity}`, { method: "DELETE" })
      setDeleteDialogOpen(false)
      setSelectedActivity(null)
      await fetchActivities()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "ไม่สามารถลบกิจกรรมได้")
    } finally {
      setIsDeleting(false)
    }
  }

  const openCreateDialog = () => {
    setFormMode("create")
    setEditingActivityId(null)
    setForm(emptyActivityForm)
    setFormError(null)
    resetImageState()
    setFormDialogOpen(true)
  }

  const openEditDialog = (activity: Activity) => {
    setFormMode("edit")
    setEditingActivityId(activity.id)
    setForm(activityToFormState(activity))
    setFormError(null)
    resetImageState()
    // getActivityImages also covers an activity created before multi-image
    // support, whose picture still lives in the legacy `image` field.
    setExistingImages(getActivityImages(activity))
    setFormDialogOpen(true)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setFormError(null)
    try {
      const payload = buildActivityPayload(form)
      let activityId = editingActivityId

      if (formMode === "create") {
        const response = await api<ActivityResponse>("/activities", { method: "POST", body: payload })
        const created = response.data?.activity ? normalizeActivity(response.data.activity) : null
        activityId = created?.id ?? null
        // The activity now exists. Switch the dialog to edit mode straight
        // away so that if the image upload below fails, retrying updates this
        // activity instead of creating a second one.
        if (activityId) {
          setFormMode("edit")
          setEditingActivityId(activityId)
          setExistingImages(created ? getActivityImages(created) : [])
        }
      } else if (editingActivityId) {
        await api(`/activities/${editingActivityId}`, { method: "PATCH", body: payload })
      }

      if (activityId) await syncActivityImages(activityId)

      setFormDialogOpen(false)
      resetImageState()
      await fetchActivities()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "ไม่สามารถบันทึกข้อมูลกิจกรรมได้")
      // The activity itself may already be saved even when an image step
      // failed, so keep the list in step with the server.
      await fetchActivities()
    } finally {
      setIsSubmitting(false)
    }
  }

  const isFormValid =
    form.club !== "" &&
    form.title.trim() !== "" &&
    form.description.trim() !== "" &&
    form.date !== "" &&
    form.startTime.trim() !== "" &&
    form.endTime.trim() !== "" &&
    form.maxParticipants.trim() !== "" &&
    Number(form.maxParticipants) > 0 &&
    form.type !== ""

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">จัดการกิจกรรม</h1>
          <p className="text-muted-foreground">เพิ่ม แก้ไข และจัดการกิจกรรมของชมรม</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มกิจกรรมใหม่
        </Button>
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as ActivityStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value="upcoming">กำลังจะมา</TabsTrigger>
          <TabsTrigger value="ongoing">กำลังดำเนินการ</TabsTrigger>
          <TabsTrigger value="completed">เสร็จสิ้น</TabsTrigger>
          <TabsTrigger value="cancelled">ยกเลิก</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหากิจกรรม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Activities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg tracking-tight flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 shrink-0">
              <Calendar className="h-4 w-4 text-accent" />
            </div>
            รายการกิจกรรม (<span className="numeric-font">{activities.length}</span>)
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
                    <TableHead>กิจกรรม</TableHead>
                    <TableHead>ชมรม</TableHead>
                    <TableHead>วันที่</TableHead>
                    <TableHead>ผู้เข้าร่วม</TableHead>
                    <TableHead>ชม.จิตอาสา</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => {
                    const activityType = ACTIVITY_TYPES.find(t => t.value === activity.type)
                    const isFull = activity.currentParticipants >= activity.maxParticipants

                    return (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <Calendar className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{activity.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {activityType?.label}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {activity.club.name}
                        </TableCell>
                        <TableCell>
                          <div className="numeric-font text-sm">
                            {new Date(activity.date).toLocaleDateString("th-TH", {
                              day: "numeric",
                              month: "short",
                              year: "numeric"
                            })}
                          </div>
                          <div className="numeric-font text-xs text-muted-foreground">
                            {activity.startTime} - {activity.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={cn("numeric-font font-medium", isFull && "text-destructive")}>
                              {activity.currentParticipants}
                            </span>
                            <span className="numeric-font text-muted-foreground">/ {activity.maxParticipants}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {activity.volunteerHours > 0 ? (
                            <Badge variant="secondary" className="gap-1">
                              <Award className="h-3 w-3" />
                              <span className="numeric-font">{activity.volunteerHours}</span>
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", statusColors[activity.status])}>
                            {statusLabels[activity.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="ghost" size="icon" title="ดูรายชื่อผู้เข้าร่วม">
                              <Link href={`/admin/activities/${activity.id}`}>
                                <Users className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button asChild variant="ghost" size="icon" title="ดูรายละเอียดกิจกรรม">
                              <Link href={`/admin/activities/${activity.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(activity)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(activity.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {activities.length === 0 && (
                <div className="rounded-xl border border-dashed py-12 text-center">
                  <Calendar className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">ไม่พบกิจกรรม</p>
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
            <DialogTitle>{formMode === "create" ? "เพิ่มกิจกรรมใหม่" : "แก้ไขกิจกรรม"}</DialogTitle>
            <DialogDescription>
              {formMode === "create" ? "กรอกข้อมูลกิจกรรมที่ต้องการเพิ่ม" : "แก้ไขข้อมูลกิจกรรมนี้"}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="activity-club">ชมรม</FieldLabel>
              <Select
                value={form.club || undefined}
                onValueChange={(value) => setForm((f) => ({ ...f, club: value }))}
              >
                <SelectTrigger id="activity-club" className="w-full">
                  <SelectValue placeholder="เลือกชมรม" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-title">ชื่อกิจกรรม</FieldLabel>
              <Input
                id="activity-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-description">รายละเอียด</FieldLabel>
              <Textarea
                id="activity-description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-date">วันที่</FieldLabel>
              <Input
                id="activity-date"
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-start-time">เวลาเริ่ม</FieldLabel>
              <Input
                id="activity-start-time"
                type="time"
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-end-time">เวลาสิ้นสุด</FieldLabel>
              <Input
                id="activity-end-time"
                type="time"
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-max-participants">จำนวนผู้เข้าร่วมสูงสุด</FieldLabel>
              <Input
                id="activity-max-participants"
                type="number"
                min={1}
                value={form.maxParticipants}
                onChange={(e) => setForm((f) => ({ ...f, maxParticipants: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-type">ประเภทกิจกรรม</FieldLabel>
              <Select
                value={form.type || undefined}
                onValueChange={(value) => setForm((f) => ({ ...f, type: value as ActivityType }))}
              >
                <SelectTrigger id="activity-type" className="w-full">
                  <SelectValue placeholder="เลือกประเภทกิจกรรม" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIVITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-location">สถานที่</FieldLabel>
              <Input
                id="activity-location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-volunteer-hours">ชั่วโมงจิตอาสา</FieldLabel>
              <Input
                id="activity-volunteer-hours"
                type="number"
                min={0}
                value={form.volunteerHours}
                onChange={(e) => setForm((f) => ({ ...f, volunteerHours: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-status">สถานะ</FieldLabel>
              <Select
                value={form.status || undefined}
                onValueChange={(value) => setForm((f) => ({ ...f, status: value as ActivityStatus }))}
              >
                <SelectTrigger id="activity-status" className="w-full">
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(statusLabels) as ActivityStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {statusLabels[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-images">รูปภาพ</FieldLabel>

              {/* Images already stored on the activity. Removing one here only
                  marks it; the DELETE call happens when the form is saved. */}
              {existingImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {existingImages.map((image) => (
                    <div key={image} className="relative h-20 w-20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveImageUrl(image)}
                        alt=""
                        className="h-full w-full rounded-lg border border-border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => markExistingImageForRemoval(image)}
                        aria-label="ลบรูปนี้"
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Files picked in this dialog, not uploaded yet. */}
              {newImages.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {newImages.map((image, index) => (
                    <div key={image.previewUrl} className="relative h-20 w-20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={image.previewUrl}
                        alt=""
                        className="h-full w-full rounded-lg border-2 border-dashed border-primary/50 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        aria-label="นำรูปนี้ออก"
                        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-4">
                {existingImages.length === 0 && newImages.length === 0 && (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ImageUp className="h-6 w-6 text-primary" />
                  </div>
                )}
                <Input
                  id="activity-images"
                  ref={imageInputRef}
                  type="file"
                  multiple
                  accept={ACTIVITY_IMAGE_ACCEPT_ATTR}
                  onChange={(e) => handleImageSelect(e.target.files)}
                  className="flex-1"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                เลือกได้หลายรูป รองรับ JPEG, PNG และ WEBP ขนาดไม่เกิน 10MB ต่อรูป
              </p>

              {imageError && <p className="text-sm text-destructive">{imageError}</p>}
            </Field>
            <Field>
              <FieldLabel htmlFor="activity-requirements">สิ่งที่ต้องเตรียม (บรรทัดละ 1 ข้อ)</FieldLabel>
              <Textarea
                id="activity-requirements"
                value={form.requirements}
                onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))}
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
              {isSubmitting ? "กำลังบันทึก..." : formMode === "create" ? "เพิ่มกิจกรรม" : "บันทึกการแก้ไข"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบกิจกรรม</DialogTitle>
            <DialogDescription>
              คุณต้องการลบกิจกรรมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
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
              {isDeleting ? "กำลังลบ..." : "ลบกิจกรรม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
