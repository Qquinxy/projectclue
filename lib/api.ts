const API_URL = process.env.NEXT_PUBLIC_API_URL

if (!API_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined")
}

type ApiOptions = Omit<RequestInit, "body"> & {
  body?: unknown
}

export async function api<T = unknown>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { body, headers, ...rest } = options

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong")
  }

  return data
}

// Multipart variant of `api` for file uploads — no Content-Type header, so
// the browser sets the correct multipart boundary itself.
export async function apiUpload<T = unknown>(
  endpoint: string,
  formData: FormData,
  options: Omit<RequestInit, "body" | "method"> = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    method: "POST",
    credentials: "include",
    body: formData,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || "Something went wrong")
  }

  return data
}

// Authenticated binary response for private media such as participation
// evidence. The blob is never exposed through the public /uploads route.
export async function apiBlob(endpoint: string): Promise<Blob> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    let message = "ไม่สามารถโหลดไฟล์ได้ กรุณาลองอีกครั้ง"
    try {
      const data = await response.json()
      if (data?.message) message = data.message
    } catch {
      // Keep the safe fallback for non-JSON error responses.
    }
    throw new Error(message)
  }

  return response.blob()
}

// Binary download variant of `api` (CSV / XLSX export). The endpoint answers
// with a file on success and with the usual JSON error envelope on failure —
// including 403 when a club_admin asks for an activity outside their clubs,
// and 404 when there is nothing to export — so failures are surfaced as a
// thrown Error carrying the server's message instead of saving a junk file.
export async function apiDownload(
  endpoint: string,
  fallbackFilename: string
): Promise<void> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method: "GET",
    credentials: "include",
  })

  if (!response.ok) {
    let message = "ไม่สามารถดาวน์โหลดไฟล์ได้"
    try {
      const data = await response.json()
      if (data?.message) message = data.message
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    throw new Error(message)
  }

  // Prefer the server's filename (RFC 5987 UTF-8 form first, so Thai activity
  // names survive), falling back to the caller's suggestion.
  const disposition = response.headers.get("Content-Disposition") ?? ""
  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  const asciiMatch = disposition.match(/filename="([^"]+)"/i)
  let filename = fallbackFilename
  if (utf8Match?.[1]) {
    try {
      filename = decodeURIComponent(utf8Match[1])
    } catch {
      filename = asciiMatch?.[1] ?? fallbackFilename
    }
  } else if (asciiMatch?.[1]) {
    filename = asciiMatch[1]
  }

  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

// Uploaded files are stored/served relative to the API's origin (e.g.
// "/uploads/clubs/xxx.jpg"), not under the "/api" prefix — resolve against
// that origin here. Values that are already absolute (legacy pasted URLs)
// pass through unchanged.
export function resolveImageUrl(path?: string | null): string {
  if (!path) return ""
  if (/^https?:\/\//i.test(path)) return path
  // API_URL is validated non-empty at module load above.
  const origin = API_URL!.replace(/\/api\/?$/, "")
  return `${origin}${path}`
}
