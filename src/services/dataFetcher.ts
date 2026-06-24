/**
 * Data fetcher using lolso1.com API
 * Auto-logins on first call using credentials from .env
 */
import type { PlayerData, ChampionStat } from '@/types'
import { apiPost, apiGet } from './lolso1Api'
import { getCached, setCache } from '@/utils/cache'

let loginPromise: Promise<boolean> | null = null

async function ensureLogin(): Promise<boolean> {
  try { await apiGet('/user/me'); return true } catch { /* need login */ }
  if (loginPromise) return loginPromise
  loginPromise = (async () => {
    const email = import.meta.env.VITE_LOLSO1_EMAIL
    const password = import.meta.env.VITE_LOLSO1_PASSWORD
    if (!email || !password) return false
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

interface CardDataResponse {
  gameName: string
  level: number
  rankedStats: Record<string, { wins: number; losses: number; leaguePoints: number; tier?: string; rank?: string }>
  matchHistory: {
    summary: {
      winRate: number
      win: number
      lose: number
      count: number
      averageKda: number
    }
    games: Array<{
      championName: string
      kills: number
      deaths: number
      assists: number
      win: boolean
      gameMode: string
    }>
    champions: Record<string, { id: number; count: number; win: number; lose: number; winRate: number }>
  }
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

  let serverInfo: { puuid: string; serverId: string }
  try {
    serverInfo = await apiPost<{ puuid: string; serverId: string }>('/league/player/server_info', {
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

  // Step 2: Get card_data (contains ALL the good stuff)
  const card = await apiPost<CardDataResponse>('/league/player/card_data', {
    puuid: serverInfo.puuid,
    serverId: serverInfo.serverId,
  })

  const summary = card?.matchHistory?.summary
  const games = card?.matchHistory?.games || []

  // Calculate win rate from games (summary may not exist in all responses)
  const wins = games.filter(g => g.win).length
  const totalGamesFromHistory = games.length
  const calculatedWinRate = totalGamesFromHistory > 0
    ? Math.round((wins / totalGamesFromHistory) * 10000) / 100
    : (summary ? Math.round(summary.winRate * 10000) / 100 : 0)

  // Build champion stats from games (which have championName)
  const championAgg: Record<string, { wins: number; games: number }> = {}
  for (const g of games) {
    if (!g.championName) continue
    if (!championAgg[g.championName]) championAgg[g.championName] = { wins: 0, games: 0 }
    championAgg[g.championName].games++
    if (g.win) championAgg[g.championName].wins++
  }

  const championList: ChampionStat[] = Object.entries(championAgg)
    .map(([name, c]) => ({
      name,
      winRate: Math.round((c.wins / c.games) * 10000) / 100,
      games: c.games,
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 8)

  // Calculate KDA from all games
  const totalKills = games.reduce((s, g) => s + (g.kills || 0), 0)
  const totalDeaths = games.reduce((s, g) => s + (g.deaths || 0), 0)
  const totalAssists = games.reduce((s, g) => s + (g.assists || 0), 0)

  // Get tier from ranked stats
  let tier: PlayerData['tier'] = '未定级'
  if (card?.rankedStats) {
    for (const q of Object.values(card.rankedStats)) {
      if (q.tier) { tier = normalizeTier(q.tier); break }
    }
    // If no tier but has ranked games, try inferring
    if (tier === '未定级') {
      for (const q of Object.values(card.rankedStats)) {
        if ((q.wins + q.losses) > 0) { tier = '未定级'; break }
      }
    }
  }

  const player: PlayerData = {
    summonerName: card?.gameName || gameName,
    region: serverInfo.serverId || region,
    tier,
    winRate: calculatedWinRate,
    kda: {
      kills: totalKills,
      deaths: totalDeaths || 0,
      assists: totalAssists,
    },
    totalGames: totalGamesFromHistory || summary?.count || 0,
    champions: championList,
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

export { apiPost, apiGet }
