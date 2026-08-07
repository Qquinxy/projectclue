"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { mockActivities } from "@/lib/mock-data"
import { ACTIVITY_TYPES, type ActivityStatus } from "@/lib/types"
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Calendar,
  Eye,
  Award
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

export default function AdminActivitiesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | "all">("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null)

  const filteredActivities = mockActivities.filter((activity) => {
    const matchesSearch = 
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.clubName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || activity.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleDelete = (activityId: string) => {
    setSelectedActivity(activityId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    setDeleteDialogOpen(false)
    setSelectedActivity(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการกิจกรรม</h1>
          <p className="text-muted-foreground">เพิ่ม แก้ไข และจัดการกิจกรรมของชมรม</p>
        </div>
        <Button>
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            รายการกิจกรรม ({filteredActivities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                {filteredActivities.map((activity) => {
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
                        {activity.clubName}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(activity.date).toLocaleDateString("th-TH", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {activity.startTime} - {activity.endTime}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={cn("font-medium", isFull && "text-destructive")}>
                            {activity.currentParticipants}
                          </span>
                          <span className="text-muted-foreground">/ {activity.maxParticipants}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.volunteerHours > 0 ? (
                          <Badge variant="secondary" className="gap-1">
                            <Award className="h-3 w-3" />
                            {activity.volunteerHours}
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
                          <Button asChild variant="ghost" size="icon">
                            <Link href={`/activities/${activity.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon">
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
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการลบกิจกรรม</DialogTitle>
            <DialogDescription>
              คุณต้องการลบกิจกรรมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              ลบกิจกรรม
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
