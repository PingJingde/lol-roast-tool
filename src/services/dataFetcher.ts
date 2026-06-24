import type { PlayerData } from '@/types'
import { getCached, setCache } from '@/utils/cache'

// CORS proxy URL — replace with actual Cloudflare Worker URL in production
const CORS_PROXY = 'https://cors-proxy.example.workers.dev/'

interface RawPlayerInfo {
  name: string
  tier: string
  winRate: string
  totalGames: string
  kda: string
}

/**
 * Fetch player data from lolhelper.cn through CORS proxy
 */
export async function fetchPlayerData(summonerName: string, region: string): Promise<PlayerData> {
  const cacheKey = `${region}_${summonerName}`

  // 1. Check cache
  const cached = getCached<PlayerData>(cacheKey)
  if (cached) return cached

  // 2. Fetch through CORS proxy
  // NOTE: Actual URL and parsing logic needs adjustment based on lolhelper.cn's real API/page structure
  const proxyUrl = `${CORS_PROXY}https://lolhelper.cn/api/query?region=${encodeURIComponent(region)}&name=${encodeURIComponent(summonerName)}`

  const response = await fetch(proxyUrl, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new Error(`数据获取失败: HTTP ${response.status}`)
  }

  const raw: RawPlayerInfo = await response.json()

  // 3. Parse and normalize
  const player: PlayerData = parsePlayerData(raw, region)

  // 4. Cache
  setCache(cacheKey, player)

  return player
}

/**
 * Parse raw lolhelper.cn response into PlayerData
 * NOTE: Field mapping needs adjustment based on actual API
 */
function parsePlayerData(raw: RawPlayerInfo, region: string): PlayerData {
  const [k, d, a] = (raw.kda || '0/0/0').split('/').map(Number)

  return {
    summonerName: raw.name || '',
    region,
    tier: normalizeTier(raw.tier),
    winRate: parseFloat(raw.winRate) || 0,
    kda: { kills: k, deaths: d, assists: a },
    totalGames: parseInt(raw.totalGames) || 0,
    champions: [], // Champions may come from separate endpoint
  }
}

const TIER_MAP: Record<string, PlayerData['tier']> = {
  'challenger': '王者',
  'grandmaster': '宗师',
  'master': '大师',
  'diamond': '钻石',
  'emerald': '翡翠',
  'platinum': '铂金',
  'gold': '黄金',
  'silver': '白银',
  'bronze': '青铜',
  'iron': '黑铁',
}

function normalizeTier(raw: string): PlayerData['tier'] {
  const lower = raw.toLowerCase().trim()
  for (const [key, value] of Object.entries(TIER_MAP)) {
    if (lower.includes(key)) return value
  }
  return '未定级'
}
