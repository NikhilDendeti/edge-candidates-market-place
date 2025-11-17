/**
 * Data anonymization helpers
 */

export type RedactedArray = []

const DEFAULT_DOMAIN_MASK = '**'
const MAX_ALIAS_MOD = 100000

function stableHash(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Generate deterministic candidate alias like "candidate-12345"
 */
export function getCandidateAlias(id: string): string {
  const normalized = id || 'unknown'
  const hash = stableHash(normalized)
  const aliasNumber = (hash % MAX_ALIAS_MOD) + 1
  return `candidate-${aliasNumber}`
}

/**
 * Mask email into pattern like "as************9@**.**"
 */
export function maskEmail(email?: string | null): string {
  const fallback = '************@**.**'
  if (!email) {
    return fallback
  }

  const [localPart, domainPart] = email.split('@')

  if (!localPart || !domainPart) {
    return '************@**.**'
  }

  const maskedLocal = maskLocalPart(localPart)
  const maskedDomain = domainPart
    .split('.')
    .filter(Boolean)
    .map(() => DEFAULT_DOMAIN_MASK)
    .join('.')

  const safeDomain = maskedDomain || DEFAULT_DOMAIN_MASK
  return `${maskedLocal}@${safeDomain}`
}

function maskLocalPart(local: string): string {
  if (local.length <= 2) {
    const start = local.slice(0, 1) || '*'
    const end = local.slice(-1) || '*'
    return `${start}*******${end}`
  }

  const keepStart = Math.min(2, local.length - 1)
  const start = local.slice(0, keepStart)
  const end = local.slice(-1)
  const stars = '*'.repeat(Math.max(local.length - keepStart - 1, 1))
  return `${start}${stars}${end}`
}

/**
 * Return a redacted empty array for URL fields
 */
export function redactToEmptyArray(): RedactedArray {
  return []
}

/**
 * Mask phone numbers, keeping first and last character visible
 */
export function maskPhone(phone?: string | null): string | undefined {
  if (!phone) return undefined

  const digits = phone.toString()
  if (digits.length <= 2) {
    return `${digits.slice(0, 1)}*${digits.slice(-1)}`
  }

  const first = digits[0]
  const last = digits[digits.length - 1]
  const stars = '*'.repeat(Math.max(digits.length - 2, 1))
  return `${first}${stars}${last}`
}


