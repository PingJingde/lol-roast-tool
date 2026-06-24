/**
 * Data fetcher using lolso1.com API
 * Auto-logins on first call using credentials from .env
 */
import type { PlayerData } from '@/types'
import { apiPost, apiGet } from './lolso1Api'
import { getCached, setCache } from '@/utils/cache'

let loginPromise: Promise<boolean> | null = null

/**
 * Auto-login with stored credentials
 */
async function ensureLogin(): Promise<boolean> {
  // Already logged in?
  try {
    await apiGet('/user/me')
    return true
  } catch {
    // Need to login
  }

  // Use existing login promise if in-flight
  if (loginPromise) return loginPromise

  loginPromise = (async () => {
    const email = import.meta.env.VITE_LOLSO1_EMAIL
    const password = import.meta.env.VITE_LOLSO1_PASSWORD

    if (!email || !password) {
      console.warn('No lolso1 credentials configured. Set VITE_LOLSO1_EMAIL and VITE_LOLSO1_PASSWORD in .env')
      return false
    }

    try {
      // Try login with common field formats
      await apiPost('/user/login', { account: email, password })
      console.log('✅ Auto-logged into lolso1.com')
      return true
    } catch (e) {
      console.error('❌ Auto-login failed:', e)
      return false
    }
  })()

  return loginPromise
}

interface ServerInfoResponse {
  summonerName: string
  tagLine?: string
  puuid: string
  serverId: string
  displayName?: string
}

interface OverviewResponse {
  tier: string
  rank?: string
  leaguePoints?: number
  winRate?: number
  kda?: { kills: number; deaths: number; assists: number }
  totalGames?: number
  recentChampions?: Array<{
    championName: string
    winRate: number
    games: number
  }>
}

/**
 * Search for a summoner and get their data
 * Player format: "name#tag" or just "name"
 */
export async function fetchPlayerData(
  summonerName: string,
  region: string
): Promise<PlayerData> {
  const cacheKey = `lolso1_${region}_${summonerName}`

  // Ensure logged in
  const loggedIn = await ensureLogin()
  if (!loggedIn) throw new Error('请先登录 lolso1.com')

  // Check cache
  const cached = getCached<PlayerData>(cacheKey)
  if (cached) return cached

  // Step 1: Server info (resolves name to puuid)
  const [gameName, tagLine = ''] = summonerName.includes('#')
    ? summonerName.split('#')
    : [summonerName, '']

  const serverInfo = await apiPost<ServerInfoResponse>('/league/player/server_info', {
    gameName: gameName.trim(),
    tagLine: tagLine.trim(),
  })

  if (!serverInfo || !serverInfo.puuid) {
    throw new Error('未找到该召唤师')
  }

  // Step 2: Get overview
  const overview = await apiPost<OverviewResponse>('/league/player/overview', {
    puuid: serverInfo.puuid,
    serverId: serverInfo.serverId,
  })

  // Step 3: Build PlayerData
  const player: PlayerData = {
    summonerName: serverInfo.displayName || serverInfo.summonerName,
    region: serverInfo.serverId || region,
    tier: normalizeTier(overview?.tier),
    winRate: Math.round((overview?.winRate || 0) * 100) / 100,
    kda: {
      kills: overview?.kda?.kills || 0,
      deaths: overview?.kda?.deaths || 0,
      assists: overview?.kda?.assists || 0,
    },
    totalGames: overview?.totalGames || 0,
    champions: (overview?.recentChampions || []).map(c => ({
      name: c.championName,
      winRate: Math.round(c.winRate * 100) / 100,
      games: c.games,
    })),
  }

  // Cache
  setCache(cacheKey, player)
  return player
}

/**
 * Check if user is logged in
 */
export async function checkLoginStatus(): Promise<boolean> {
  try {
    await apiGet('/user/me')
    return true
  } catch {
    return false
  }
}

/**
 * Get current user info
 */
export async function getCurrentUser() {
  return apiGet<{ id: string; username: string; email: string }>('/user/me')
}

const TIER_MAP: Record<string, string> = {
  'CHALLENGER': '王者',
  'GRANDMASTER': '宗师',
  'MASTER': '大师',
  'DIAMOND': '钻石',
  'EMERALD': '翡翠',
  'PLATINUM': '铂金',
  'GOLD': '黄金',
  'SILVER': '白银',
  'BRONZE': '青铜',
  'IRON': '黑铁',
}

function normalizeTier(raw?: string): PlayerData['tier'] {
  if (!raw) return '未定级'
  const upper = raw.toUpperCase().trim()
  for (const [key, value] of Object.entries(TIER_MAP)) {
    if (upper.includes(key)) return value as PlayerData['tier']
  }
  return '未定级'
}

export { apiPost, apiGet }
