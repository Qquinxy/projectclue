"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { api } from "@/lib/api"
import type { ReferenceDataItem } from "@/lib/types"
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  Building2,
  GraduationCap,
  BookOpen,
} from "lucide-react"

const TABS: { type: ReferenceDataItem["type"]; label: string; icon: typeof Building2 }[] = [
  { type: "faculty", label: "คณะ", icon: Building2 },
  { type: "year", label: "ชั้นปี", icon: GraduationCap },
  { type: "major", label: "สาขาวิชา", icon: BookOpen },
]

interface ReferenceDataResponse {
  success: boolean
  message?: string
  data: {
    referenceData: ReferenceDataItem[]
  }
}

interface RawReferenceItem extends Omit<ReferenceDataItem, "id"> {
  id?: string
  _id?: string
}

function normalizeItem(item: RawReferenceItem): ReferenceDataItem {
  return { ...item, id: item.id ?? item._id ?? "" }
}

const emptyForm = { value: "", label: "", sortOrder: "" }

export default function ReferenceDataPage() {
  const [items, setItems] = useState<ReferenceDataItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<ReferenceDataItem["type"]>("faculty")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ReferenceDataItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await api<ReferenceDataResponse>("/admin/reference-data")
      setItems((res.data?.referenceData ?? []).map(normalizeItem))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "ไม่สามารถโหลดข้อมูลได้")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setDialogOpen(true)
  }

  const openEdit = (item: ReferenceDataItem) => {
    setEditing(item)
    setForm({ value: item.value, label: item.label === item.value ? "" : item.label, sortOrder: String(item.sortOrder ?? 0) })
    setFormError(null)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    setFormError(null)
    const value = form.value.trim()

    if (editing) {
      if (!value) {
        setFormError("กรุณากรอกค่า")
        return
      }
    } else if (!value) {
      setFormError("กรุณากรอกค่า")
      return
    }

    setIsSaving(true)
    try {
      const base = editing ? `PATCH` : `POST`
      await api(`/admin/reference-data${editing ? `/${editing.id}` : ""}`, {
        method: base,
        body: {
          type: editing ? undefined : activeTab,
          value,
          label: form.label.trim() || undefined,
          sortOrder: form.sortOrder === "" ? undefined : Number(form.sortOrder),
        },
      })
      setDialogOpen(false)
      await fetchItems()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: ReferenceDataItem) => {
    if (!window.confirm(`ลบ "${item.label}" ออกจาก${TABS.find((t) => t.type === item.type)?.label ?? ""}?`)) return
    setIsDeleting(item.id)
    try {
      await api(`/admin/reference-data/${item.id}`, { method: "DELETE" })
      await fetchItems()
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "ลบไม่สำเร็จ")
    } finally {
      setIsDeleting(null)
    }
  }

  const tabItems = items.filter((i) => i.type === activeTab)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">ข้อมูลอ้างอิง</h1>
          <p className="text-muted-foreground">
            จัดการตัวเลือก คณะ / ชั้นปี / สาขาวิชา ที่ใช้ในหน้าลงทะเบียนและโปรไฟล์
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่ม
        </Button>
      </div>

      {loadError && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ReferenceDataItem["type"])}>
        <TabsList>
          {TABS.map((tab) => (
            <TabsTrigger key={tab.type} value={tab.type}>
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map((tab) => (
          <TabsContent key={tab.type} value={tab.type}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">รายการ{tab.label}</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : tabItems.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    ยังไม่มีรายการ คลิก "เพิ่ม" เพื่อเพิ่ม{tab.label}
                  </div>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">ลำดับ</TableHead>
                          <TableHead>ค่า</TableHead>
                          <TableHead>ชื่อที่แสดง</TableHead>
                          <TableHead className="w-36 text-right">จัดการ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tabItems.map((item, index) => (
                          <TableRow key={item.id}>
                            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="font-medium">{item.value}</TableCell>
                            <TableCell className="text-muted-foreground">{item.label}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button variant="ghost" size="icon" onClick={() => openEdit(item)} aria-label="แก้ไข">
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => handleDelete(item)}
                                  disabled={isDeleting === item.id}
                                  aria-label="ลบ"
                                >
                                  {isDeleting === item.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขรายการ" : "เพิ่มรายการ"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `แก้ไขข้อมูล${TABS.find((t) => t.type === editing.type)?.label ?? ""}`
                : `เพิ่ม${TABS.find((t) => t.type === activeTab)?.label ?? ""}ใหม่`}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            {!editing && (
              <Field>
                <FieldLabel htmlFor="ref-type">ประเภท</FieldLabel>
                <div className="text-sm font-medium text-foreground">
                  {TABS.find((t) => t.type === activeTab)?.label}
                </div>
              </Field>
            )}
            <Field>
              <FieldLabel htmlFor="ref-value">ค่า</FieldLabel>
              <Input
                id="ref-value"
                placeholder="เช่น คณะนิติศาสตร์ / ปี 5 / สาขาคอมพิวเตอร์กราฟิก"
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ref-label">ชื่อที่แสดง (ไม่บังคับ — ว่างไว้ใช้ค่าเดียวกัน)</FieldLabel>
              <Input
                id="ref-label"
                placeholder="ถ้าไม่กรอกจะแสดงเป็นค่า"
                value={form.label}
                onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="ref-sort">ลำดับการแสดง (ไม่บังคับ)</FieldLabel>
              <Input
                id="ref-sort"
                type="number"
                placeholder="0"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
              />
            </Field>
          </FieldGroup>

          {formError && (
            <div className="flex items-center gap-2 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isSaving}>
              ยกเลิก
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}