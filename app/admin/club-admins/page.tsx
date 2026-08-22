"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
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
  AlertCircle
} from "lucide-react"

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
  managedClubs: string[]
}

const emptyCreateForm: CreateFormState = {
  studentId: "",
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  phone: "",
  managedClubs: [],
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
  if (form.managedClubs.length > 0) payload.managedClubs = form.managedClubs
  return payload
}

interface EditFormState {
  firstName: string
  lastName: string
  email: string
  phone: string
  managedClubs: string[]
}

function clubAdminToEditForm(admin: ClubAdmin): EditFormState {
  return {
    firstName: admin.firstName,
    lastName: admin.lastName,
    email: admin.email,
    phone: admin.phone,
    managedClubs: admin.managedClubs,
  }
}

function sameClubIds(a: string[], b: string[]) {
  return a.length === b.length && a.every((id) => b.includes(id))
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
  const [editForm, setEditForm] = useState<EditFormState>({ firstName: "", lastName: "", email: "", phone: "", managedClubs: [] })
  const [editOriginalManagedClubs, setEditOriginalManagedClubs] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)

  const openEditDialog = (admin: ClubAdmin) => {
    setEditingId(admin.id)
    setEditForm(clubAdminToEditForm(admin))
    setEditOriginalManagedClubs(admin.managedClubs)
    setEditError(null)
    setEditDialogOpen(true)
  }

  const toggleEditManagedClub = (clubId: string, checked: boolean) => {
    setEditForm((f) => ({
      ...f,
      managedClubs: checked
        ? [...f.managedClubs, clubId]
        : f.managedClubs.filter((id) => id !== clubId),
    }))
  }

  const handleEdit = async () => {
    if (!editingId) return
    setIsEditing(true)
    setEditError(null)
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
      if (!sameClubIds(editForm.managedClubs, editOriginalManagedClubs)) {
        await api(`/admin/users/${editingId}/clubs`, {
          method: "PATCH",
          body: { managedClubs: editForm.managedClubs },
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

  // --- Assign managed clubs ---
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const [assignManagedClubs, setAssignManagedClubs] = useState<string[]>([])
  const [isAssigning, setIsAssigning] = useState(false)
  const [assignError, setAssignError] = useState<string | null>(null)

  const openAssignDialog = (admin: ClubAdmin) => {
    setAssigningId(admin.id)
    setAssignManagedClubs(admin.managedClubs)
    setAssignError(null)
    setAssignDialogOpen(true)
  }

  const toggleAssignedClub = (clubId: string, checked: boolean) => {
    setAssignManagedClubs((current) =>
      checked ? [...current, clubId] : current.filter((id) => id !== clubId)
    )
  }

  const handleAssign = async () => {
    if (!assigningId) return
    setIsAssigning(true)
    setAssignError(null)
    try {
      await api(`/admin/users/${assigningId}/clubs`, {
        method: "PATCH",
        body: { managedClubs: assignManagedClubs },
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
                          <div className="flex flex-wrap gap-1">
                            {admin.managedClubs.map((clubId) => (
                              <Badge key={clubId} variant="outline" className="text-xs">
                                {clubNameById(clubId)}
                              </Badge>
                            ))}
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
              <FieldLabel>ชมรมที่ดูแล</FieldLabel>
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border border-border p-3">
                {clubs.map((club) => (
                  <label key={club.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={createForm.managedClubs.includes(club.id)}
                      onCheckedChange={(checked) =>
                        setCreateForm((f) => ({
                          ...f,
                          managedClubs: checked
                            ? [...f.managedClubs, club.id]
                            : f.managedClubs.filter((id) => id !== club.id),
                        }))
                      }
                    />
                    {club.name}
                  </label>
                ))}
              </div>
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
              <FieldLabel>ชมรมที่ดูแล</FieldLabel>
              <div className="space-y-2 max-h-40 overflow-y-auto rounded-md border border-border p-3">
                {clubs.map((club) => (
                  <label key={club.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={editForm.managedClubs.includes(club.id)}
                      onCheckedChange={(checked) => toggleEditManagedClub(club.id, checked === true)}
                    />
                    {club.name}
                  </label>
                ))}
              </div>
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

          <div className="space-y-2 max-h-64 overflow-y-auto rounded-md border border-border p-3">
            {clubs.map((club) => (
              <label key={club.id} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={assignManagedClubs.includes(club.id)}
                  onCheckedChange={(checked) => toggleAssignedClub(club.id, checked === true)}
                />
                {club.name}
              </label>
            ))}
          </div>

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
