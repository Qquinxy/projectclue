const API_URL = process.env.NEXT_PUBLIC_API_URL ?? ""

// Where the "Sign in with Google" button sends the browser. The backend
// performs the whole OAuth dance and redirects back with a session cookie.
export function googleAuthUrl(): string {
  const origin = API_URL.replace(/\/api\/?$/, "")
  return `${origin}/api/auth/google`
}

// Maps the `?error=` code the backend redirects to (see googleAuth.controller.js)
// to a user-facing Thai message.
export function googleErrorMessage(code: string | null): string | null {
  switch (code) {
    case "google_denied":
      return "คุณปฏิเสธการอนุญาตจาก Google"
    case "google_unverified_email":
      return "อีเมลของ Google ยังไม่ได้รับการยืนยันโดย Google"
    case "google_state":
      return "การตรวจสอบสิทธิ์ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง"
    case "google_no_code":
    case "google_token_failed":
    case "google_userinfo_failed":
    case "google_failed":
      return "เข้าสู่ระบบด้วย Google ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
    default:
      return code ? "เข้าสู่ระบบด้วย Google ไม่สำเร็จ" : null
  }
}