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
  Mail,
  Clock
} from "lucide-react"

export default function AdminSettingsPage() {
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
                <FieldLabel>จำนวนชั่วโมงที่ต้องการ (ต่อปี)</FieldLabel>
                <Input type="number" defaultValue="36" />
              </Field>
            </FieldGroup>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">บังคับครบก่อนจบการศึกษา</p>
                <p className="text-sm text-muted-foreground">
                  นักศึกษาต้องมีชั่วโมงจิตอาสาครบตามกำหนดก่อนสำเร็จการศึกษา
                </p>
              </div>
              <Switch defaultChecked />
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

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              ตั้งค่าอีเมล
            </CardTitle>
            <CardDescription>
              การตั้งค่าสำหรับส่งอีเมลจากระบบ
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel>SMTP Server</FieldLabel>
                <Input defaultValue="smtp.university.ac.th" />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>SMTP Port</FieldLabel>
                <Input type="number" defaultValue="587" />
              </Field>
            </FieldGroup>
            <FieldGroup>
              <Field>
                <FieldLabel>อีเมลผู้ส่ง</FieldLabel>
                <Input defaultValue="noreply@university.ac.th" type="email" />
              </Field>
            </FieldGroup>
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
          <Button variant="outline">ยกเลิก</Button>
          <Button>บันทึกการตั้งค่า</Button>
        </div>
      </div>
    </div>
  )
}
