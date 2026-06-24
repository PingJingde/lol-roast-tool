/**
 * Data fetcher using lolso1.com API
 * Replaces the old scraping-based approach
 */
import type { PlayerData } from '@/types'
import { apiPost, apiGet } from './lolso1Api'
import { getCached, setCache } from '@/utils/cache'

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

interface SearchRequest {
  player: string
  serverId?: string
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

  // Check cache
  const cached = getCached<PlayerData>(cacheKey)
  if (cached) return cached

  // Step 1: Server info (resolves name to puuid)
  const searchName = summonerName.includes('#')
    ? summonerName
    : `${summonerName}#${region}`

  const serverInfo = await apiPost<ServerInfoResponse>('/league/player/server_info', {
    player: searchName,
  } as SearchRequest)

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
