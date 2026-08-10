import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Award } from "lucide-react"
import type { Activity } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ActivityCardProps {
  activity: Activity
}

const statusColors = {
  upcoming: "bg-primary/10 text-primary",
  ongoing: "bg-accent/10 text-accent",
  completed: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
}

const statusLabels = {
  upcoming: "กำลังจะมา",
  ongoing: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
}

export function ActivityCard({ activity }: ActivityCardProps) {
  const spotsLeft = activity.maxParticipants - activity.currentParticipants
  const isFull = spotsLeft <= 0

  return (
    <Link href={`/activities/${activity.id}`}>
      <Card className="h-full hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 shrink-0">
              <Calendar className="h-5 w-5 text-accent" />
            </div>
            <div className="flex gap-2">
              <Badge className={cn("text-xs", statusColors[activity.status])}>
                {statusLabels[activity.status]}
              </Badge>
              {activity.volunteerHours > 0 && (
                <Badge variant="outline" className="text-xs">
                  <Award className="h-3 w-3 mr-1" />
                  <span className="numeric-font">{activity.volunteerHours}</span>&nbsp;ชม.
                </Badge>
              )}
            </div>
          </div>
          <p className="text-xs text-primary mb-1">{activity.clubName}</p>
          <h3 className="font-medium text-foreground mb-1 line-clamp-1">
            {activity.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {activity.description}
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span className="numeric-font">
                {new Date(activity.date).toLocaleDateString("th-TH", {
                  month: "short",
                  day: "numeric"
                })}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span className="numeric-font">{activity.startTime}</span>
            </span>
            <span className={cn(isFull && "text-destructive")}>
              {isFull ? "เต็ม" : (
                <>
                  เหลือ <span className="numeric-font">{spotsLeft}</span> ที่
                </>
              )}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
