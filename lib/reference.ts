import { useEffect, useState } from "react"
import { api } from "./api"
import type { ReferenceDataItem, Student } from "./types"

export interface ReferenceLists {
  faculties: ReferenceDataItem[]
  years: ReferenceDataItem[]
  majors: ReferenceDataItem[]
}

const EMPTY: ReferenceLists = { faculties: [], years: [], majors: [] }

// Fetches the selectable faculties / years / majors once. Mirrors the
// backend's ReferenceData model, grouped client-side for convenience.
export async function fetchReferenceLists(): Promise<ReferenceLists> {
  try {
    const res = await api<{
      success: boolean
      data: { referenceData: ReferenceDataItem[] }
    }>("/reference-data")
    const items = res.data?.referenceData ?? []
    return {
      faculties: items.filter((i) => i.type === "faculty"),
      years: items.filter((i) => i.type === "year"),
      majors: items.filter((i) => i.type === "major"),
    }
  } catch {
    // Network/API unavailable — callers fall back to static lists.
    return EMPTY
  }
}

// Same rule the backend's joinClub enforces: phone, faculty, major and year
// must all be filled in before a student can join a club. Google-login
// accounts start without these until the profile is completed.
export function isProfileComplete(user: Pick<Student, "phone" | "faculty" | "major" | "year"> | null): boolean {
  if (!user) return false
  return Boolean(
    user.phone?.trim() &&
    user.faculty?.trim() &&
    user.major?.trim() &&
    user.year
  )
}

// Keeps a Select from dropping the user's existing value just because it is
// no longer (or not yet) in the admin-managed list — e.g. a major typed in
// before majors became reference data. Returns items plus the current value
// appended as a synthetic option when missing.
export function withCurrentValue(
  items: ReferenceDataItem[],
  current: string | number,
  type: ReferenceDataItem["type"]
): ReferenceDataItem[] {
  const text = String(current).trim()
  if (!text || items.some((i) => i.value === text)) return items
  return [{ id: `${type}-${text}`, type, value: text, label: text, sortOrder: -1 }, ...items]
}

// Convenience hook for the register form and the profile editor — loads the
// selectable lists once on mount and reports loading state.
export function useReferenceLists() {
  const [lists, setLists] = useState<ReferenceLists>(EMPTY)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    fetchReferenceLists().then((value) => {
      if (!mounted) return
      setLists(value)
      setIsLoading(false)
    })
    return () => {
      mounted = false
    }
  }, [])

  return { lists, isLoading }
}