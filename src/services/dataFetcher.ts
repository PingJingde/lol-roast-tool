/**
 * Data fetcher using lolso1.com API
 * Auto-logins on first call using credentials from .env
 */
import type { PlayerData } from '@/types'
import { apiPost, apiGet } from './lolso1Api'
import { getCached, setCache } from '@/utils/cache'

let loginPromise: Promise<boolean> | null = null

async function ensureLogin(): Promise<boolean> {
  try {
    await apiGet('/user/me')
    return true
  } catch { /* need login */ }

  if (loginPromise) return loginPromise

  loginPromise = (async () => {
    const email = import.meta.env.VITE_LOLSO1_EMAIL
    const password = import.meta.env.VITE_LOLSO1_PASSWORD
    if (!email || !password) {
      console.warn('No lolso1 credentials. Set VITE_LOLSO1_EMAIL and VITE_LOLSO1_PASSWORD in .env')
      return false
    }
    try {
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

// ===== Real API response types =====

interface ServerInfoData {
  puuid: string
  serverId: string
}

interface QueueStats {
  wins: number
  losses: number
  leaguePoints: number
  provisionalGamesRemaining: number
  queueType: string
  tier?: string
  rank?: string
}

interface OverviewData {
  base: {
    puuid: string
    gameName: string
    tagLine: string
    level: number
    profileIconId: number
  }
  ranked: {
    queues: Record<string, QueueStats>
  }
}

interface CardData {
  tier?: string
  rank?: string
  leaguePoints?: number
  wins?: number
  losses?: number
  winRate?: number
  kda?: { kills: number; deaths: number; assists: number }
}

// ===== Main fetch function =====

export async function fetchPlayerData(
  summonerName: string,
  region: string
): Promise<PlayerData> {
  const cacheKey = `lolso1_${summonerName}`

  if (!(await ensureLogin())) throw new Error('请先登录 lolso1.com')

  const cached = getCached<PlayerData>(cacheKey)
  if (cached) return cached

  // Step 1: Resolve name → puuid + serverId
  const [gameName, tagLine = ''] = summonerName.includes('#')
    ? summonerName.split('#')
    : [summonerName, '']

  let serverInfo: ServerInfoData
  try {
    serverInfo = await apiPost<ServerInfoData>('/league/player/server_info', {
      gameName: gameName.trim(),
      tagLine: tagLine.trim(),
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('QUOTA') || msg.includes('权限') || msg.includes('免费')) {
      throw new Error('今日免费查询次数已用完，请明天再试或购买会员')
    }
    throw e
  }

  if (!serverInfo?.puuid) throw new Error('未找到该召唤师')

  // Step 2: Get overview (name, level, ranked stats)
  const overview = await apiPost<OverviewData>('/league/player/overview', {
    puuid: serverInfo.puuid,
    serverId: serverInfo.serverId,
  })

  const solo = overview?.ranked?.queues?.['RANKED_SOLO_5x5']
  const totalGames = (solo?.wins || 0) + (solo?.losses || 0)
  const winRate = totalGames > 0 ? Math.round((solo!.wins / totalGames) * 10000) / 100 : 0

  // Step 3: Get card data for tier and KDA (if available)
  let cardData: CardData | null = null
  try {
    cardData = await apiPost<CardData>('/league/player/card_data', {
      puuid: serverInfo.puuid,
      serverId: serverInfo.serverId,
    })
  } catch {
    // card_data might fail for new accounts
  }

  // Build player data
  const player: PlayerData = {
    summonerName: overview?.base?.gameName || gameName,
    region: serverInfo.serverId || region,
    tier: normalizeTier(cardData?.tier || solo?.tier),
    winRate,
    kda: {
      kills: cardData?.kda?.kills || 0,
      deaths: cardData?.kda?.deaths || 0,
      assists: cardData?.kda?.assists || 0,
    },
    totalGames: cardData?.wins !== undefined
      ? (cardData.wins || 0) + (cardData.losses || 0)
      : totalGames,
    champions: [], // TODO: add champion mastery endpoint
  }

  setCache(cacheKey, player)
  return player
}

// ===== Helpers =====

const TIER_MAP: Record<string, string> = {
  'CHALLENGER': '王者', 'GRANDMASTER': '宗师', 'MASTER': '大师',
  'DIAMOND': '钻石', 'EMERALD': '翡翠', 'PLATINUM': '铂金',
  'GOLD': '黄金', 'SILVER': '白银', 'BRONZE': '青铜', 'IRON': '黑铁',
}

function normalizeTier(raw?: string): PlayerData['tier'] {
  if (!raw) return '未定级'
  const upper = raw.toUpperCase().trim()
  for (const [key, value] of Object.entries(TIER_MAP)) {
    if (upper.includes(key)) return value as PlayerData['tier']
  }
  return '未定级'
}

export async function checkLoginStatus(): Promise<boolean> {
  try { await apiGet('/user/me'); return true } catch { return false }
}

export async function getCurrentUser() {
  return apiGet<{ id: string; username: string; email: string }>('/user/me')
}

export { apiPost, apiGet }
