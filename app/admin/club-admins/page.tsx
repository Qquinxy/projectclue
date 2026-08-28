"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
import { api } from "@/lib/api"
import type { Club } from "@/lib/types"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  UserCog,
  Building2,
  Loader2,
  AlertCircle,
  TriangleAlert
} from "lucide-react"

// A club_admin manages at most one club (enforced client- and server-side).
// A dedicated sentinel is used for "no club assigned" since the underlying
// Select primitive can't represent an empty-string item value.
const NO_CLUB_VALUE = "none"

// --- Clubs (for club-name lookups and the managed-clubs checklist) ---

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

// --- Club admin users ---

interface RawClubAdmin {
  id?: string
  _id?: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  managedClubs?: string[]
}

interface ClubAdmin {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  managedClubs: string[]
}

interface UsersResponse {
  success: boolean
  message?: string
  data: {
    users: RawClubAdmin[]
  }
}

// The API returns users (and managedClubs ids) keyed by _id, not id —
// normalize here so edit/assign/delete target a real user id.
function normalizeClubAdmin(user: RawClubAdmin): ClubAdmin {
  return {
    id: user.id ?? user._id ?? "",
    studentId: user.studentId,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone ?? "",
    managedClubs: (user.managedClubs ?? []).map(String),
  }
}

interface CreateFormState {
  studentId: string
  firstName: string
  lastName: string
  email: string
  password: string
  phone: string
  managedClub: string
}

const emptyCreateForm: CreateFormState = {
  studentId: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  managedClub: "",
}

function buildCreatePayload(form: CreateFormState) {
  const payload: Record<string, unknown> = {
    studentId: form.studentId.trim(),
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    email: form.email.trim(),
    password: form.password,
  }
  if (form.phone.trim()) payload.phone = form.phone.trim()
  if (form.managedClub) payload.managedClubs = [form.managedClub]
  return payload
}

interface EditFormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  managedClub: string
}

function clubAdminToEditForm(admin: ClubAdmin): EditFormState {
  return {
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    phone: admin.phone,
    managedClub: admin.managedClubs[0] ?? "",
  }
}

export default function AdminClubAdminsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [clubAdmins, setClubAdmins] = useState<ClubAdmin[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [usersRes, clubsRes] = await Promise.all([
        api<UsersResponse>("/admin/users"),
        api<ClubsResponse>("/clubs"),
      ])
      setClubAdmins((usersRes.data?.users ?? []).map(normalizeClubAdmin))
      setClubs((clubsRes.data?.clubs ?? []).map(normalizeClub))
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อผู้ดูแลชมรมได้")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const clubNameById = (clubId: string) => clubs.find((c) => c.id === clubId)?.name ?? clubId

  const filteredAdmins = clubAdmins.filter((admin) =>
    admin.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    admin.studentId.includes(searchQuery) ||
    admin.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Client-side pre-check for the 1:1 rule (a club may have only one
  // admin) — immediate feedback before the round-trip; the backend's own
  // check (409) remains the source of truth for race conditions.
  const findConflictingAdmin = (clubId: string, excludeAdminId?: string) =>
    clubAdmins.find(
      (admin) => admin.id !== excludeAdminId && admin.managedClubs.includes(clubId)
    ) ?? null

  // --- Create ---
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateFormState>(emptyCreateForm)
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const openCreateDialog = () => {
    setCreateForm(emptyCreateForm)
    setCreateError(null)
    setCreateDialogOpen(true)
  }

  const handleCreate = async () => {
    setIsCreating(true)
    setCreateError(null)

    if (createForm.managedClub) {
      const conflict = findConflictingAdmin(createForm.managedClub)
      if (conflict) {
        setCreateError(`ชมรมนี้มี ${conflict.firstName} ${conflict.lastName} เป็นผู้ดูแลอยู่แล้ว`)
        setIsCreating(false)
        return
      }
    }

    try {
      await api("/admin/users", { method: "POST", body: buildCreatePayload(createForm) })
      setCreateDialogOpen(false)
      await fetchData()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "ไม่สามารถสร้างบัญชีผู้ดูแลชมรมได้")
    } finally {
      setIsCreating(false)
    }
  }

  const isCreateValid =
    createForm.studentId.trim() !== "" &&
    createForm.firstName.trim() !== "" &&
    createForm.lastName.trim() !== "" &&
    createForm.email.trim() !== "" &&
    createForm.password.length >= 6

  // --- Edit ---
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditFormState>({ firstName: "", lastName: "", email: "", phone: "", managedClub: "" })
  const [editOriginalManagedClub, setEditOriginalManagedClub] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const openEditDialog = (admin: ClubAdmin) => {
    setEditingId(admin.id)
    setEditForm(clubAdminToEditForm(admin))
    setEditOriginalManagedClub(admin.managedClubs[0] ?? "")
    setEditError(null)
    setEditDialogOpen(true)
  }

  const handleEdit = async () => {
    if (!editingId) return
    setIsEditing(true)
    setEditError(null)

    if (editForm.managedClub && editForm.managedClub !== editOriginalManagedClub) {
      const conflict = findConflictingAdmin(editForm.managedClub, editingId)
      if (conflict) {
        setEditError(`ชมรมนี้มี ${conflict.firstName} ${conflict.lastName} เป็นผู้ดูแลอยู่แล้ว`)
        setIsEditing(false)
        return
      }
    }

    try {
      await api(`/admin/users/${editingId}`, {
        method: "PATCH",
        body: {
          firstName: editForm.firstName.trim(),
          lastName: editForm.lastName.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
        },
      })

      // Managed clubs live on a separate endpoint — only call it if the
      // admin actually changed the selection in this dialog.
      if (editForm.managedClub !== editOriginalManagedClub) {
        await api(`/admin/users/${editingId}/clubs`, {
          method: "PATCH",
          body: { managedClubs: editForm.managedClub ? [editForm.managedClub] : [] },
        })
      }

      setEditDialogOpen(false)
      await fetchData()
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "ไม่สามารถแก้ไขข้อมูลได้")
    } finally {
      setIsEditing(false)
    }
  }

  const isEditValid =
    editForm.firstName.trim() !== "" &&
    editForm.lastName.trim() !== "" &&
    editForm.email.trim() !== ""

  // --- Assign managed club ---
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [assignManagedClub, setAssignManagedClub] = useState("")
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const openAssignDialog = (admin: ClubAdmin) => {
    setAssigningId(admin.id)
    setAssignManagedClub(admin.managedClubs[0] ?? "")
    setAssignError(null)
    setAssignDialogOpen(true)
  }

  const handleAssign = async () => {
    if (!assigningId) return
    setIsAssigning(true)
    setAssignError(null)

    if (assignManagedClub) {
      const conflict = findConflictingAdmin(assignManagedClub, assigningId)
      if (conflict) {
        setAssignError(`ชมรมนี้มี ${conflict.firstName} ${conflict.lastName} เป็นผู้ดูแลอยู่แล้ว`)
        setIsAssigning(false)
        return
      }
    }

    try {
      await api(`/admin/users/${assigningId}/clubs`, {
        method: "PATCH",
        body: { managedClubs: assignManagedClub ? [assignManagedClub] : [] },
      })
      setAssignDialogOpen(false)
      await fetchData()
    } catch (err) {
      setAssignError(err instanceof Error ? err.message : "ไม่สามารถบันทึกชมรมที่ดูแลได้")
    } finally {
      setIsAssigning(false)
    }
  }

  // --- Delete ---
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    setSelectedId(id)
    setDeleteError(null)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!selectedId) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await api(`/admin/users/${selectedId}`, { method: "DELETE" })
      setDeleteDialogOpen(false)
      setSelectedId(null)
      await fetchData()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "ไม่สามารถลบบัญชีได้")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">จัดการผู้ดูแลชมรม</h1>
          <p className="text-muted-foreground">เพิ่ม แก้ไข และกำหนดชมรมที่ดูแลสำหรับบัญชีผู้ดูแลชมรม</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มผู้ดูแลชมรม
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาผู้ดูแลชมรม..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Club Admins Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg tracking-tight flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <UserCog className="h-4 w-4 text-primary" />
            </div>
            รายชื่อผู้ดูแลชมรม (<span className="numeric-font">{filteredAdmins.length}</span>)
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
                    <TableHead>ผู้ดูแลชมรม</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>เบอร์โทรศัพท์</TableHead>
                    <TableHead>ชมรมที่ดูแล</TableHead>
                    <TableHead className="text-right">การดำเนินการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdmins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {admin.firstName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">
                              {admin.firstName} {admin.lastName}
                            </div>
                            <div className="numeric-font text-sm text-muted-foreground">
                              {admin.studentId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                      <TableCell className="numeric-font text-muted-foreground">
                        {admin.phone || "-"}
                      </TableCell>
                      <TableCell>
                        {admin.managedClubs.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            {admin.managedClubs.map((clubId) => (
                              <Badge key={clubId} variant="outline" className="text-xs">
                                {clubNameById(clubId)}
                              </Badge>
                            ))}
                            {admin.managedClubs.length > 1 && (
                              <span
                                className="inline-flex items-center gap-1 text-xs text-destructive"
                                title="ผู้ดูแลชมรมควรดูแลได้เพียง 1 ชมรม กรุณาแก้ไข"
                              >
                                <TriangleAlert className="h-3.5 w-3.5" />
                                มีชมรมที่ดูแลมากกว่า 1 แห่ง
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">ยังไม่ได้กำหนด</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="กำหนดชมรมที่ดูแล"
                            onClick={() => openAssignDialog(admin)}
                          >
                            <Building2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(admin)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(admin.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredAdmins.length === 0 && (
                <div className="rounded-xl border border-dashed py-12 text-center">
                  <UserCog className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">ไม่พบผู้ดูแลชมรม</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ดูแลชมรม</DialogTitle>
            <DialogDescription>สร้างบัญชีผู้ดูแลชมรม (club_admin) ใหม่</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ca-student-id">รหัสนักศึกษา/รหัสพนักงาน</FieldLabel>
              <Input
                id="ca-student-id"
                value={createForm.studentId}
                onChange={(e) => setCreateForm((f) => ({ ...f, studentId: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ca-first-name">ชื่อ</FieldLabel>
              <Input
                id="ca-first-name"
                value={createForm.firstName}
                onChange={(e) => setCreateForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ca-last-name">นามสกุล</FieldLabel>
              <Input
                id="ca-last-name"
                value={createForm.lastName}
                onChange={(e) => setCreateForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ca-email">อีเมล</FieldLabel>
              <Input
                id="ca-email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ca-password">รหัสผ่าน</FieldLabel>
              <Input
                id="ca-password"
                type="password"
                placeholder="ตั้งรหัสผ่าน 6 ตัวขึ้นไป"
                value={createForm.password}
                onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ca-phone">เบอร์โทรศัพท์</FieldLabel>
              <Input
                id="ca-phone"
                value={createForm.phone}
                onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ca-managed-club">ชมรมที่ดูแล</FieldLabel>
              <Select
                value={createForm.managedClub || NO_CLUB_VALUE}
                onValueChange={(value) =>
                  setCreateForm((f) => ({ ...f, managedClub: value === NO_CLUB_VALUE ? "" : value }))
                }
              >
                <SelectTrigger id="ca-managed-club" className="w-full">
                  <SelectValue placeholder="เลือกชมรม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CLUB_VALUE}>ไม่ระบุ</SelectItem>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {createError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {createError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleCreate} disabled={!isCreateValid || isCreating}>
              {isCreating ? "กำลังสร้าง..." : "เพิ่มผู้ดูแลชมรม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลผู้ดูแลชมรม</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลพื้นฐานและชมรมที่ดูแลของบัญชีนี้</DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="ca-edit-first-name">ชื่อ</FieldLabel>
              <Input
                id="ca-edit-first-name"
                value={editForm.firstName}
                onChange={(e) => setEditForm((f) => ({ ...f, firstName: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ca-edit-last-name">นามสกุล</FieldLabel>
              <Input
                id="ca-edit-last-name"
                value={editForm.lastName}
                onChange={(e) => setEditForm((f) => ({ ...f, lastName: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ca-edit-email">อีเมล</FieldLabel>
              <Input
                id="ca-edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ca-edit-phone">เบอร์โทรศัพท์</FieldLabel>
              <Input
                id="ca-edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ca-edit-managed-club">ชมรมที่ดูแล</FieldLabel>
              <Select
                value={editForm.managedClub || NO_CLUB_VALUE}
                onValueChange={(value) =>
                  setEditForm((f) => ({ ...f, managedClub: value === NO_CLUB_VALUE ? "" : value }))
                }
              >
                <SelectTrigger id="ca-edit-managed-club" className="w-full">
                  <SelectValue placeholder="เลือกชมรม" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_CLUB_VALUE}>ไม่ระบุ</SelectItem>
                  {clubs.map((club) => (
                    <SelectItem key={club.id} value={club.id}>
                      {club.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {editError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {editError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleEdit} disabled={!isEditValid || isEditing}>
              {isEditing ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Clubs Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>กำหนดชมรมที่ดูแล</DialogTitle>
            <DialogDescription>เลือกชมรมที่ผู้ดูแลชมรมนี้จะดูแล</DialogDescription>
          </DialogHeader>

          <Select
            value={assignManagedClub || NO_CLUB_VALUE}
            onValueChange={(value) => setAssignManagedClub(value === NO_CLUB_VALUE ? "" : value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="เลือกชมรม" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_CLUB_VALUE}>ไม่ระบุ</SelectItem>
              {clubs.map((club) => (
                <SelectItem key={club.id} value={club.id}>
                  {club.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {assignError && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {assignError}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleAssign} disabled={isAssigning}>
              {isAssigning ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบบัญชีผู้ดูแลชมรม</DialogTitle>
            <DialogDescription>
              คุณต้องการลบบัญชีผู้ดูแลชมรมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
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
              {isDeleting ? "กำลังลบ..." : "ลบบัญชี"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
