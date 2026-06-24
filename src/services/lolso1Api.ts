/**
 * HMAC-SHA256 signature for lolso1.com API
 * Matches the signing logic from lolso1.com's frontend
 */

// In dev, Vite proxy forwards /api/* → r1.lolso1.com/*
// In prod, Vercel rewrites do the same
const API_BASE = import.meta.env.DEV ? '/api' : '/api'
const SIGN_KEY = 'bnGke6jCHJLKvPt9N4DRhMCLCj9TVYG9'

/**
 * SHA-256 hash, returns hex string
 */
async function sha256(message: string): Promise<string> {
  const data = new TextEncoder().encode(message)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * HMAC-SHA256, returns hex string
 */
async function hmacSha256(key: string, message: string): Promise<string> {
  const keyData = new TextEncoder().encode(key)
  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sig))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Normalize value for signing (sorted keys, stable JSON)
 */
function normalizeForSign(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (value instanceof Date) return JSON.stringify(value.toISOString())
  if (Array.isArray(value)) return `[${value.map(v => normalizeForSign(v) || 'null').join(',')}]`
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>).sort()
    return `{${keys
      .filter(k => (value as Record<string, unknown>)[k] !== undefined)
      .map(k => `${JSON.stringify(k)}:${normalizeForSign((value as Record<string, unknown>)[k]) || 'null'}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

/**
 * Generate random hex nonce (32 chars)
 */
function generateNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Add HMAC signature headers to a Request
 */
async function signRequest(request: Request): Promise<Request> {
  const url = new URL(request.url)
  const method = request.method.toUpperCase()
  const timestamp = String(Math.floor(Date.now() / 1000))
  const nonce = generateNonce()

  // Build body hash
  let bodyStr = ''
  if (request.body) {
    try {
      const clone = request.clone()
      const raw = await clone.text()
      if (raw) {
        // Try JSON parse for normalization
        try {
          bodyStr = normalizeForSign(JSON.parse(raw))
        } catch {
          bodyStr = raw
        }
      }
    } catch {
      // no body
    }
  }
  const bodyHash = await sha256(bodyStr)

  // Sort query params
  const sortedParams = [...url.searchParams.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')

  // Build sign string
  const signString = [
    'v1',
    method,
    url.pathname,
    sortedParams,
    bodyHash,
    timestamp,
    nonce,
  ].join('\n')

  const signature = await hmacSha256(SIGN_KEY, signString)

  // Create new request with headers
  const headers = new Headers(request.headers)
  headers.set('x-leso-sign-version', 'v1')
  headers.set('x-leso-timestamp', timestamp)
  headers.set('x-leso-nonce', nonce)
  headers.set('x-leso-signature', signature)

  return new Request(request, { headers })
}

/**
 * Fetch with lolso1.com HMAC signing
 * Automatically signs requests to /league/* paths
 */
export async function signedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
  const pathname = new URL(url, API_BASE).pathname

  let request = new Request(
    url.startsWith('http') || url.startsWith('/api') ? url : `${API_BASE}${url}`,
    {
      ...init,
      credentials: 'include',
    }
  )

  // Sign league API requests
  if (pathname.startsWith('/league/') && pathname !== '/league/player/public-meta') {
    request = await signRequest(request)
  }

  return fetch(request)
}

/**
 * API response wrapper
 */
interface ApiResponse<T = unknown> {
  errCode: string
  data: T
  message?: string
}

export async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  const res = await signedFetch(url.toString())
  if (!res.ok) throw new Error(`API ${res.status}`)
  const json: ApiResponse<T> = await res.json()
  if (json.errCode && json.errCode !== '0000' && json.errCode !== '0') {
    throw new Error(json.message || `API error: ${json.errCode}`)
  }
  return json.data
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await signedFetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  const json: ApiResponse<T> = await res.json()
  if (json.errCode && json.errCode !== '0000' && json.errCode !== '0') {
    throw new Error(json.message || `API error: ${json.errCode}`)
  }
  return json.data
}

export { API_BASE, SIGN_KEY }
