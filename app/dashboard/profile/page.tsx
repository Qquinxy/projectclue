import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getCurrentStudent, mockMemberships, mockParticipations } from "@/lib/mock-data"
import { 
  User, 
  Mail, 
  Phone, 
  Building, 
  BookOpen,
  Calendar,
  Users,
  Award
} from "lucide-react"

export default function ProfilePage() {
  const student = getCurrentStudent()
  
  const activeMemberships = mockMemberships.filter(
    m => m.studentId === student.id && m.status === "active"
  ).length
  
  const attendedActivities = mockParticipations.filter(
    p => p.studentId === student.id && p.status === "attended"
  ).length
  
  const totalVolunteerHours = mockParticipations
    .filter(p => p.studentId === student.id && p.status === "attended")
    .reduce((sum, p) => sum + p.hoursEarned, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">โปรไฟล์</h1>
        <p className="text-muted-foreground">ข้อมูลส่วนตัวและสถิติของคุณ</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              ข้อมูลส่วนตัว
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center">
                <Avatar className="h-24 w-24">
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl">
                    {student.firstName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <Badge className="mt-3">นักศึกษาปี {student.year}</Badge>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {student.firstName} {student.lastName}
                  </h2>
                  <p className="text-muted-foreground">รหัสนักศึกษา: <span className="numeric-font">{student.studentId}</span></p>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">อีเมล</div>
                      <div className="font-medium text-foreground text-sm truncate max-w-[200px]">
                        {student.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">เบอร์โทรศัพท์</div>
                      <div className="font-medium text-foreground">{student.phone}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">คณะ</div>
                      <div className="font-medium text-foreground">{student.faculty}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">สาขาวิชา</div>
                      <div className="font-medium text-foreground">{student.major}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">สถิติของคุณ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="numeric-font text-2xl font-bold text-foreground">{activeMemberships}</div>
                <div className="text-sm text-muted-foreground">ชมรมที่เข้าร่วม</div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-accent" />
              </div>
              <div>
                <div className="numeric-font text-2xl font-bold text-foreground">{attendedActivities}</div>
                <div className="text-sm text-muted-foreground">กิจกรรมที่เข้าร่วม</div>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-chart-3/10 flex items-center justify-center">
                <Award className="h-6 w-6 text-chart-3" />
              </div>
              <div>
                <div className="numeric-font text-2xl font-bold text-foreground">{totalVolunteerHours}</div>
                <div className="text-sm text-muted-foreground">ชั่วโมงจิตอาสา</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Academic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            ข้อมูลทางการศึกษา
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">ชั้นปี</div>
              <div className="text-xl font-semibold text-foreground">ปี <span className="numeric-font">{student.year}</span></div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">คณะ</div>
              <div className="text-xl font-semibold text-foreground">{student.faculty}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">สาขาวิชา</div>
              <div className="text-xl font-semibold text-foreground">{student.major}</div>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">สถานะ</div>
              <div className="text-xl font-semibold text-primary">กำลังศึกษา</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
