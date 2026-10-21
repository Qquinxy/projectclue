import { toast } from "@/hooks/use-toast"

const recentNotifications = new Map<string, ReturnType<typeof setTimeout>>()

export function notifyOnce(
  key: string,
  title: string,
  description?: string,
  variant: "default" | "destructive" = "default"
) {
  if (recentNotifications.has(key)) return
  const timeout = setTimeout(() => recentNotifications.delete(key), 1800)
  recentNotifications.set(key, timeout)
  toast({ title, description, variant })
}
