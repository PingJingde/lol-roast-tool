import type { PlayerData } from '@/types'

/**
 * Fetch player data — tries real API first, falls back to mock
 */
export async function fetchPlayerData(summonerName: string, region: string): Promise<PlayerData> {
  // Try real API via Vercel serverless function
  try {
    const res = await fetch(
      `/api/summoner?name=${encodeURIComponent(summonerName)}&region=${encodeURIComponent(region)}`,
      { signal: AbortSignal.timeout(10000) }
    )
    if (res.ok) {
      const data = await res.json()
      if (!data.error) {
        data._isMock = false
        return data as PlayerData
      }
    }
  } catch {
    // API unavailable — fall through to mock
  }

  // Fallback: generate mock data
  const mockPlayer = generateMockPlayer(summonerName, region)
  mockPlayer._isMock = true
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
