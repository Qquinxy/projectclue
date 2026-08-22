"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api } from "@/lib/api"
import type { Club } from "@/lib/types"
import { Search, UserCheck, Loader2, AlertCircle } from "lucide-react"

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

// The API returns clubs/members keyed by _id, not id — normalize here so the
// club selector and member list below use real ids.
function normalizeClub(club: RawClub): Club {
  return { ...club, id: club.id ?? club._id ?? "" }
}

interface ClubMember {
  id: string
  joinedAt: string
  student: {
    id: string
    studentId: string
    firstName: string
    lastName: string
  }
}

interface RawClubMember extends Omit<ClubMember, "id"> {
  id?: string
  _id?: string
}

interface ClubMembersResponse {
  success: boolean
  message?: string
  data: {
    members: RawClubMember[]
  }
}

function normalizeMember(member: RawClubMember): ClubMember {
  return { ...member, id: member.id ?? member._id ?? "" }
}

export default function AdminMembersPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedClubId, setSelectedClubId] = useState<string | null>(null)
  const [members, setMembers] = useState<ClubMember[]>([])
  const [isLoadingClubs, setIsLoadingClubs] = useState(true)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClubs = async () => {
      setIsLoadingClubs(true)
      setError(null)
      try {
        const response = await api<ClubsResponse>("/clubs")
        const list = (response.data?.clubs ?? []).map(normalizeClub)
        setClubs(list)
        setSelectedClubId((current) => current ?? list[0]?.id ?? null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อชมรมได้")
      } finally {
        setIsLoadingClubs(false)
      }
    }

    fetchClubs()
  }, [])

  const fetchMembers = useCallback(async (clubId: string) => {
    setIsLoadingMembers(true)
    setError(null)
    try {
      const response = await api<ClubMembersResponse>(`/clubs/${clubId}/members`)
      setMembers((response.data?.members ?? []).map(normalizeMember))
    } catch (err) {
      setError(err instanceof Error ? err.message : "ไม่สามารถโหลดรายชื่อสมาชิกได้")
    } finally {
      setIsLoadingMembers(false)
    }
  }, [])

  useEffect(() => {
    if (selectedClubId) {
      fetchMembers(selectedClubId)
    }
  }, [selectedClubId, fetchMembers])

  const filteredMembers = members.filter((member) =>
    member.student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.student.studentId.includes(searchQuery)
  )

  return (
    <div className="space-y-8 md:space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">จัดการสมาชิก</h1>
        <p className="text-muted-foreground">ดูรายชื่อสมาชิกของแต่ละชมรม</p>
      </div>

      {/* Club selector & search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <Select
              value={selectedClubId ?? undefined}
              onValueChange={(value) => setSelectedClubId(value)}
              disabled={isLoadingClubs || clubs.length === 0}
            >
              <SelectTrigger className="md:w-64">
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
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาสมาชิก..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg tracking-tight flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <UserCheck className="h-4 w-4 text-primary" />
            </div>
            รายชื่อสมาชิก (<span className="numeric-font">{filteredMembers.length}</span>)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="rounded-xl border border-dashed py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : isLoadingClubs || isLoadingMembers ? (
            <div className="flex items-center justify-center rounded-xl border border-dashed py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>นักศึกษา</TableHead>
                    <TableHead>วันที่เข้าร่วม</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {member.student.firstName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">
                              {member.student.firstName} {member.student.lastName}
                            </div>
                            <div className="numeric-font text-sm text-muted-foreground">
                              {member.student.studentId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="numeric-font text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredMembers.length === 0 && (
                <div className="rounded-xl border border-dashed py-12 text-center">
                  <UserCheck className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    ไม่พบข้อมูลสมาชิก
                  </h3>
                  <p className="text-muted-foreground">
                    ลองเปลี่ยนชมรมหรือคำค้นหา
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
