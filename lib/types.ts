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
  club: {
    id: string
    name: string
  }
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
  // A club_admin may manage any number of clubs.
  managedClubs: string[]
  // Set by the backend on account creation and by the Google OAuth flow.
  // Retained for display/record only — it is not a login gate.
  emailVerified?: boolean
  emailVerifiedAt?: string | null
  // Super Admin-equivalent appointment held by a club_admin. Granting it
  // activates it immediately; `elevatedAdmin === true` is what grants the
  // permissions.
  elevatedAdmin?: boolean
}

// Binary club membership only — the backend has no membership role or
// approval status. See clubmemberships in the backend-development skill.
export interface ClubMembership {
  id: string
  club: {
    id: string
    name: string
  }
  joinedAt: string
}

export type ParticipationStatus = "registered" | "attended" | "absent" | "cancelled"

// Selectable academic reference values (faculties / years / majors) the admin
// manages under /admin/reference-data; the register form and profile editor
// render them as Select options.
export interface ReferenceDataItem {
  id: string
  type: "faculty" | "year" | "major"
  value: string
  label: string
  sortOrder: number
}

export interface ActivityParticipation {
  id: string
  activity: {
    id: string
    title: string
    club: {
      id: string
      name: string
    }
  }
  status: ParticipationStatus
  registeredAt: string
  attendedAt: string | null
  hoursEarned: number
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
