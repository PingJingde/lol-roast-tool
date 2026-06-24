import type { PlayerData } from '@/types'
import { getCached, setCache } from '@/utils/cache'

// Free public CORS proxy
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
]

interface RawPlayerInfo {
  name: string
  tier: string
  winRate: string
  totalGames: string
  kda: string
}

/**
 * Fetch player data — tries real data first, falls back to demo mock
 */
export async function fetchPlayerData(summonerName: string, region: string): Promise<PlayerData> {
  const cacheKey = `${region}_${summonerName}`

  // 1. Check cache
  const cached = getCached<PlayerData>(cacheKey)
  if (cached) return cached

  // 2. Try real fetch through CORS proxy
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}https://lolhelper.cn/api/query?region=${encodeURIComponent(region)}&name=${encodeURIComponent(summonerName)}`
      const response = await fetch(proxyUrl, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      if (response.ok) {
        const raw: RawPlayerInfo = await response.json()
        const player: PlayerData = parsePlayerData(raw, region)
        player._isMock = false
        setCache(cacheKey, player)
        return player
      }
    } catch {
      continue
    }
  }

  // 3. All fetches failed — generate demo mock data
  const mockPlayer = generateMockPlayer(summonerName, region)
  mockPlayer._isMock = true
  setCache(cacheKey, mockPlayer)
  return mockPlayer
}

/**
 * Generate deterministic mock data from summoner name
 */
function generateMockPlayer(name: string, region: string): PlayerData {
  // Hash the name to get consistent results per player
  const seed = hashString(name + region)

  const tiers: PlayerData['tier'][] = [
    '黑铁', '青铜', '白银', '黄金', '铂金', '翡翠', '钻石', '大师', '宗师', '王者',
  ]
  const champs = [
    '亚索', '劫', '永恩', '盲僧', '薇恩', '卡莎', '金克丝', '德莱文',
    '锤石', '猫咪', '璐璐', 'EZ', '盖伦', '诺手', '剑姬', '锐雯',
  ]

  const tierIdx = seededRand(seed, 0, tiers.length)
  const winRate = 35 + seededRand(seed, 1, 30)
  const totalGames = 50 + seededRand(seed, 2, 1500)
  const kills = (seededRand(seed, 3, 80) / 10)
  const deaths = (seededRand(seed, 4, 100) / 12)
  const assists = (seededRand(seed, 5, 120) / 10)

  const champCount = 1 + seededRand(seed, 6, 4)
  const champions = []
  const usedChamps = new Set<number>()
  for (let i = 0; i < champCount; i++) {
    let idx = seededRand(seed, 7 + i, champs.length)
    while (usedChamps.has(idx)) idx = (idx + 1) % champs.length
    usedChamps.add(idx)
    champions.push({
      name: champs[idx],
      winRate: 30 + seededRand(seed, 10 + i, 40),
      games: 10 + seededRand(seed, 14 + i, 300),
    })
  }

  return {
    summonerName: name,
    region,
    tier: tiers[tierIdx],
    winRate,
    kda: { kills, deaths, assists },
    totalGames,
    champions,
  }
}

function hashString(s: string): number {
  let hash = 0
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    hash = ((hash << 5) - hash) + c
    hash |= 0
  }
  return Math.abs(hash)
}

function seededRand(seed: number, offset: number, max: number): number {
  let s = seed + offset * 16807
  s = (s * 1103515245 + 12345) & 0x7fffffff
  return s % max
}

function parsePlayerData(raw: RawPlayerInfo, region: string): PlayerData {
  const [k, d, a] = (raw.kda || '0/0/0').split('/').map(Number)

  return {
    summonerName: raw.name || '',
    region,
    tier: normalizeTier(raw.tier),
    winRate: parseFloat(raw.winRate) || 0,
    kda: { kills: k, deaths: d, assists: a },
    totalGames: parseInt(raw.totalGames) || 0,
    champions: [],
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
