export interface Club {
  id: string
  name: string
  description: string
  category: ClubCategory
  image: string
  memberCount: number
  maxMembers: number
  advisorName: string
  contactEmail: string
  contactPhone: string
  meetingSchedule: string
  location: string
  requirements: string[]
  benefits: string[]
  createdAt: string
}

export type ClubCategory = 
  | "volunteer" 
  | "academic" 
  | "sports" 
  | "arts" 
  | "technology" 
  | "social"

export interface Activity {
  id: string
  clubId: string
  clubName: string
  title: string
  description: string
  date: string
  startTime: string
  endTime: string
  location: string
  maxParticipants: number
  currentParticipants: number
  volunteerHours: number
  type: ActivityType
  status: ActivityStatus
  image: string
  requirements: string[]
}

export type ActivityType = "volunteer" | "workshop" | "meeting" | "event" | "training"
export type ActivityStatus = "upcoming" | "ongoing" | "completed" | "cancelled"

export interface Student {
  id: string
  studentId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  faculty: string
  major: string
  year: number
  role: "student" | "club_admin" | "superadmin"
  profileImage: string
  totalVolunteerHours: number
  managedClubs: string[]
}

export interface ClubMembership {
  id: string
  studentId: string
  clubId: string
  role: MemberRole
  joinedAt: string
  status: MembershipStatus
}

export type MemberRole = "member" | "committee" | "president" | "vice_president" | "secretary" | "treasurer"
export type MembershipStatus = "pending" | "active" | "inactive" | "rejected"

export interface ActivityParticipation {
  id: string
  studentId: string
  activityId: string
  registeredAt: string
  attendedAt: string | null
  status: ParticipationStatus
  hoursEarned: number
}

export type ParticipationStatus = "registered" | "attended" | "absent" | "cancelled"

export interface VolunteerRecord {
  studentId: string
  totalHours: number
  activitiesCompleted: number
  activities: {
    activityId: string
    activityTitle: string
    date: string
    hours: number
  }[]
}

export const CLUB_CATEGORIES: { value: ClubCategory; label: string; color: string }[] = [
  { value: "volunteer", label: "จิตอาสา", color: "bg-emerald-500" },
  { value: "academic", label: "วิชาการ", color: "bg-blue-500" },
  { value: "sports", label: "กีฬา", color: "bg-orange-500" },
  { value: "arts", label: "ศิลปะ", color: "bg-pink-500" },
  { value: "technology", label: "เทคโนโลยี", color: "bg-cyan-500" },
  { value: "social", label: "สังคม", color: "bg-amber-500" },
]

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "volunteer", label: "กิจกรรมจิตอาสา" },
  { value: "workshop", label: "เวิร์คช็อป" },
  { value: "meeting", label: "ประชุม" },
  { value: "event", label: "กิจกรรมพิเศษ" },
  { value: "training", label: "อบรม" },
]

export const MEMBER_ROLES: { value: MemberRole; label: string }[] = [
  { value: "president", label: "ประธานชมรม" },
  { value: "vice_president", label: "รองประธาน" },
  { value: "secretary", label: "เลขานุการ" },
  { value: "treasurer", label: "เหรัญญิก" },
  { value: "committee", label: "กรรมการ" },
  { value: "member", label: "สมาชิก" },
]
