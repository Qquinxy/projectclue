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
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { mockMemberships, mockStudents, mockClubs } from "@/lib/mock-data"
import { MEMBER_ROLES, type MembershipStatus } from "@/lib/types"
import { 
  Search, 
  UserCheck,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

const statusConfig = {
  pending: { label: "รอการอนุมัติ", color: "bg-accent/10 text-accent", icon: Clock },
  active: { label: "ใช้งาน", color: "bg-primary/10 text-primary", icon: CheckCircle },
  inactive: { label: "ไม่ใช้งาน", color: "bg-muted text-muted-foreground", icon: XCircle },
  rejected: { label: "ปฏิเสธ", color: "bg-destructive/10 text-destructive", icon: XCircle },
}

export default function AdminMembersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | "all">("all")
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [selectedMembership, setSelectedMembership] = useState<string | null>(null)
  const [actionType, setActionType] = useState<"approve" | "reject">("approve")

  // Join memberships with student and club data
  const membershipsWithDetails = mockMemberships.map((membership) => {
    const student = mockStudents.find(s => s.id === membership.studentId)
    const club = mockClubs.find(c => c.id === membership.clubId)
    return { ...membership, student, club }
  }).filter(m => m.student && m.club)

  const filteredMemberships = membershipsWithDetails.filter((membership) => {
    const matchesSearch = 
      membership.student?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      membership.student?.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      membership.student?.studentId.includes(searchQuery) ||
      membership.club?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || membership.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const pendingCount = membershipsWithDetails.filter(m => m.status === "pending").length

  const handleAction = (membershipId: string, action: "approve" | "reject") => {
    setSelectedMembership(membershipId)
    setActionType(action)
    setApproveDialogOpen(true)
  }

  const confirmAction = () => {
    // In real app, this would call an API
    setApproveDialogOpen(false)
    setSelectedMembership(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการสมาชิก</h1>
          <p className="text-muted-foreground">อนุมัติและจัดการสมาชิกชมรม</p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="gap-2">
            <Clock className="h-4 w-4" />
            {pendingCount} คำขอรอการอนุมัติ
          </Badge>
        )}
      </div>

      {/* Status Tabs */}
      <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as MembershipStatus | "all")}>
        <TabsList>
          <TabsTrigger value="all">ทั้งหมด</TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            รอการอนุมัติ
            {pendingCount > 0 && (
              <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="active">ใช้งาน</TabsTrigger>
          <TabsTrigger value="inactive">ไม่ใช้งาน</TabsTrigger>
          <TabsTrigger value="rejected">ปฏิเสธ</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสมาชิก..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            รายชื่อสมาชิก (<span className="numeric-font">{filteredMemberships.length}</span>)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>นักศึกษา</TableHead>
                  <TableHead>ชมรม</TableHead>
                  <TableHead>ตำแหน่ง</TableHead>
                  <TableHead>วันที่สมัคร</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead className="text-right">การดำเนินการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMemberships.map((membership) => {
                  const role = MEMBER_ROLES.find(r => r.value === membership.role)
                  const status = statusConfig[membership.status]
                  const StatusIcon = status.icon
                  
                  return (
                    <TableRow key={membership.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {membership.student?.firstName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">
                              {membership.student?.firstName} {membership.student?.lastName}
                            </div>
                            <div className="numeric-font text-sm text-muted-foreground">
                              {membership.student?.studentId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-foreground">{membership.club?.name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{role?.label}</Badge>
                      </TableCell>
                      <TableCell className="numeric-font text-muted-foreground">
                        {new Date(membership.joinedAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs gap-1", status.color)}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          {membership.status === "pending" ? (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => handleAction(membership.id, "approve")}
                              >
                                <CheckCircle className="mr-1 h-4 w-4" />
                                อนุมัติ
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleAction(membership.id, "reject")}
                              >
                                <XCircle className="mr-1 h-4 w-4" />
                                ปฏิเสธ
                              </Button>
                            </>
                          ) : (
                            <Button size="sm" variant="ghost">
                              ดูรายละเอียด
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredMemberships.length === 0 && (
            <div className="text-center py-12">
              <UserCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                ไม่พบข้อมูลสมาชิก
              </h3>
              <p className="text-muted-foreground">
                ลองเปลี่ยนตัวกรองหรือคำค้นหา
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve/Reject Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "ยืนยันการอนุมัติ" : "ยืนยันการปฏิเสธ"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve" 
                ? "คุณต้องการอนุมัติคำขอสมัครสมาชิกนี้หรือไม่?"
                : "คุณต้องการปฏิเสธคำขอสมัครสมาชิกนี้หรือไม่?"}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button 
              variant={actionType === "approve" ? "default" : "destructive"} 
              onClick={confirmAction}
            >
              {actionType === "approve" ? "อนุมัติ" : "ปฏิเสธ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
