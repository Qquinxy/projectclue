// Mirror of the backend policy in src/utils/password.js. This exists to give
// immediate feedback in the UI — the backend enforces the same rules
// independently, so skipping the frontend gains an attacker nothing.
//
// Policy: at least 8 characters, with at least one uppercase letter, one
// lowercase letter, one digit and one special character (e.g. @ ! _ # $ %).

export const PASSWORD_MIN_LENGTH = 8

export interface PasswordRule {
  id: string
  label: string
  test: (password: string) => boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    id: "length",
    label: `อย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`,
    test: (pw) => pw.length >= PASSWORD_MIN_LENGTH,
  },
  { id: "uppercase", label: "มีตัวพิมพ์ใหญ่ (A-Z) อย่างน้อย 1 ตัว", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lowercase", label: "มีตัวพิมพ์เล็ก (a-z) อย่างน้อย 1 ตัว", test: (pw) => /[a-z]/.test(pw) },
  { id: "number", label: "มีตัวเลข (0-9) อย่างน้อย 1 ตัว", test: (pw) => /[0-9]/.test(pw) },
  {
    id: "special",
    label: "มีอักขระพิเศษ เช่น @ ! _ # $ % อย่างน้อย 1 ตัว",
    test: (pw) => /[^A-Za-z0-9]/.test(pw),
  },
]

export function getPasswordRuleStates(password: string) {
  return PASSWORD_RULES.map((rule) => ({ ...rule, passed: rule.test(password) }))
}

export function isStrongPassword(password: string): boolean {
  return PASSWORD_RULES.every((rule) => rule.test(password))
}

/** First unmet requirement, as a ready-to-display Thai message. */
export function getPasswordError(password: string): string | null {
  if (!password) return "กรุณากรอกรหัสผ่าน"
  const failed = PASSWORD_RULES.find((rule) => !rule.test(password))
  return failed ? `รหัสผ่านต้อง${failed.label}` : null
}
