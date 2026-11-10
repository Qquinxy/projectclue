"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { 
  Settings, 
  Bell, 
  Shield, 
  Database,
  Clock
} from "lucide-react"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { api } from "@/lib/api"

interface VolunteerHoursSettings {
  requiredVolunteerHours: number
  enforceVolunteerHoursBeforeGraduation: boolean
}

interface SettingsResponse {
  success: boolean
  data: { settings: VolunteerHoursSettings }
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<VolunteerHoursSettings | null>(null)
  const [savedSettings, setSavedSettings] = useState<VolunteerHoursSettings | null>(null)
  const [hoursInput, setHoursInput] = useState("")
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const applySettings = (value: VolunteerHoursSettings) => {
    setSettings(value)
    setSavedSettings(value)
    setHoursInput(String(value.requiredVolunteerHours))
  }

  useEffect(() => {
    let active = true
    api<SettingsResponse>("/admin/settings/volunteer-hours")
      .then((response) => { if (active) applySettings(response.data.settings) })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "โหลดการตั้งค่าไม่สำเร็จ")
      })
      .finally(() => { if (active) setIsLoadingSettings(false) })
    return () => { active = false }
  }, [])

  const saveSettings = async () => {
    if (!settings || isSaving) return
    const requiredVolunteerHours = Number(hoursInput)
    if (!/^\d+$/.test(hoursInput.trim()) || !Number.isSafeInteger(requiredVolunteerHours) || requiredVolunteerHours < 0 || requiredVolunteerHours > 10000) {
      setSaveError("กรุณาระบุชั่วโมงเป็นจำนวนเต็มตั้งแต่ 0 ถึง 10000")
      setSaveSuccess(false)
      return
    }
    setIsSaving(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const response = await api<SettingsResponse>("/admin/settings/volunteer-hours", {
        method: "PUT",
        body: { ...settings, requiredVolunteerHours },
      })
      applySettings(response.data.settings)
      setSaveSuccess(true)
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "บันทึกการตั้งค่าไม่สำเร็จ")
    } finally {
      setIsSaving(false)
    }
  }

  const resetSettings = () => {
    if (!savedSettings || isSaving) return
    setSettings(savedSettings)
    setHoursInput(String(savedSettings.requiredVolunteerHours))
    setSaveError(null)
    setSaveSuccess(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ตั้งค่าระบบ</h1>
        <p className="text-muted-foreground">จัดการการตั้งค่าทั่วไปของระบบ</p>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              ตั้งค่าทั่วไป
            </CardTitle>
            <CardDescription>
              การตั้งค่าพื้นฐานของระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel>ชื่อมหาวิทยาลัย</FieldLabel>
                <Input defaultValue="มหาวิทยาลัยตัวอย่าง" />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>อีเมลผู้ดูแลระบบ</FieldLabel>
                <Input defaultValue="admin@university.ac.th" type="email" />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>เบอร์โทรศัพท์ติดต่อ</FieldLabel>
                <Input defaultValue="02-xxx-xxxx" />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        {/* Volunteer Hours Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              ตั้งค่าชั่วโมงจิตอาสา
            </CardTitle>
            <CardDescription>
              กำหนดเกณฑ์ชั่วโมงจิตอาสาสำหรับนักศึกษา
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel>เกณฑ์ชั่วโมงจิตอาสาสะสมตลอดหลักสูตร</FieldLabel>
                <Input
                  id="required-volunteer-hours"
                  type="number"
                  min={0}
                  max={10000}
                  step={1}
                  value={hoursInput}
                  disabled={isLoadingSettings || !!loadError || isSaving}
                  onChange={(event) => { setHoursInput(event.target.value); setSaveSuccess(false); setSaveError(null) }}
                  aria-describedby="volunteer-hours-settings-status"
                />
                <p className="text-xs text-muted-foreground">ยอดสะสมตลอดหลักสูตร (0–10000 ชั่วโมง)</p>
              </Field>
            </FieldGroup>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">บังคับครบก่อนจบการศึกษา</p>
                <p className="text-sm text-muted-foreground">
                  นักศึกษาต้องมีชั่วโมงจิตอาสาครบตามกำหนดก่อนสำเร็จการศึกษา
                </p>
              </div>
              <Switch
                checked={settings?.enforceVolunteerHoursBeforeGraduation ?? false}
                disabled={isLoadingSettings || !!loadError || isSaving}
                onCheckedChange={(checked) => {
                  if (settings) {
                    setSettings({ ...settings, enforceVolunteerHoursBeforeGraduation: checked })
                    setSaveSuccess(false)
                    setSaveError(null)
                  }
                }}
                aria-label="กำหนดนโยบายชั่วโมงก่อนอนุมัติจบการศึกษา"
              />
            </div>
            <p className="text-xs text-muted-foreground">ค่านี้เป็นนโยบายสำหรับขั้นตอนอนุมัติจบการศึกษาในอนาคต ปัจจุบันระบบยังไม่มีขั้นตอนดังกล่าวและยังไม่มีการบังคับใช้</p>
            <div id="volunteer-hours-settings-status" aria-live="polite" className="min-h-5 text-sm">
              {isLoadingSettings && <span className="inline-flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />กำลังโหลดการตั้งค่า…</span>}
              {loadError && <span className="inline-flex items-center gap-2 text-destructive"><AlertCircle className="h-4 w-4" />โหลดการตั้งค่าไม่สำเร็จ: {loadError}</span>}
              {saveError && <span className="inline-flex items-center gap-2 text-destructive"><AlertCircle className="h-4 w-4" />{saveError}</span>}
              {saveSuccess && <span className="inline-flex items-center gap-2 text-primary"><CheckCircle2 className="h-4 w-4" />บันทึกการตั้งค่าสำเร็จ</span>}
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              การแจ้งเตือน
            </CardTitle>
            <CardDescription>
              ตั้งค่าการแจ้งเตือนอัตโนมัติ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">แจ้งเตือนเมื่อมีคำขอสมัครสมาชิกใหม่</p>
                <p className="text-sm text-muted-foreground">
                  ส่งอีเมลแจ้งเตือนเมื่อมีนักศึกษาสมัครเข้าร่วมชมรม
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">แจ้งเตือนก่อนกิจกรรม</p>
                <p className="text-sm text-muted-foreground">
                  ส่งอีเมลแจ้งเตือนผู้เข้าร่วมก่อนกิจกรรม 1 วัน
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">สรุปรายสัปดาห์</p>
                <p className="text-sm text-muted-foreground">
                  ส่งอีเมลสรุปกิจกรรมและสถิติรายสัปดาห์
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              ความปลอดภัย
            </CardTitle>
            <CardDescription>
              การตั้งค่าความปลอดภัยของระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">บังคับการยืนยันอีเมล</p>
                <p className="text-sm text-muted-foreground">
                  ผู้ใช้ต้องยืนยันอีเมลก่อนเข้าใช้งานระบบ
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">ต้องอนุมัติสมาชิกใหม่</p>
                <p className="text-sm text-muted-foreground">
                  ผู้ดูแลต้องอนุมัติคำขอสมัครสมาชิกก่อนเข้าร่วมชมรม
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              ฐานข้อมูล
            </CardTitle>
            <CardDescription>
              สถานะและการจัดการฐานข้อมูล
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="numeric-font text-2xl font-bold text-foreground">6</div>
                <div className="text-sm text-muted-foreground">ชมรม</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="numeric-font text-2xl font-bold text-foreground">6</div>
                <div className="text-sm text-muted-foreground">กิจกรรม</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="numeric-font text-2xl font-bold text-foreground">2</div>
                <div className="text-sm text-muted-foreground">นักศึกษา</div>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <div className="numeric-font text-2xl font-bold text-foreground">3</div>
                <div className="text-sm text-muted-foreground">สมาชิก</div>
              </div>
            </div>
            <div className="flex gap-4">
              <Button variant="outline">
                <Database className="mr-2 h-4 w-4" />
                สำรองข้อมูล
              </Button>
              <Button variant="outline">
                นำเข้าข้อมูล
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={resetSettings} disabled={!settings || isSaving}>ยกเลิก</Button>
          <Button onClick={() => void saveSettings()} disabled={!settings || isLoadingSettings || !!loadError || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? "กำลังบันทึก…" : "บันทึกการตั้งค่า"}
          </Button>
        </div>
      </div>
    </div>
  )
}
