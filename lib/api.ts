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