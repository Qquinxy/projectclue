"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { mockClubs } from "@/lib/mock-data"
import { CLUB_CATEGORIES } from "@/lib/types"
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Users,
  Eye
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

export default function AdminClubsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedClub, setSelectedClub] = useState<string | null>(null)

  const filteredClubs = mockClubs.filter((club) =>
    club.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    club.advisorName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleDelete = (clubId: string) => {
    setSelectedClub(clubId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    // In real app, this would call an API
    setDeleteDialogOpen(false)
    setSelectedClub(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">จัดการชมรม</h1>
          <p className="text-muted-foreground">เพิ่ม แก้ไข และลบข้อมูลชมรม</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          เพิ่มชมรมใหม่
        </Button>
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
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            รายชื่อชมรม ({filteredClubs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                {filteredClubs.map((club) => {
                  const category = CLUB_CATEGORIES.find(c => c.value === club.category)
                  const isFull = club.memberCount >= club.maxMembers
                  
                  return (
                    <TableRow key={club.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
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
                          <span className="font-medium">{club.memberCount}</span>
                          <span className="text-muted-foreground">/ {club.maxMembers}</span>
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
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDelete(club.id)}
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
            <DialogTitle>ยืนยันการลบชมรม</DialogTitle>
            <DialogDescription>
              คุณต้องการลบชมรมนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              ลบชมรม
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
