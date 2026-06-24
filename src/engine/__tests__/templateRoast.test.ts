import { describe, it, expect } from 'vitest'
import { matchTemplate } from '../templateRoast'
import type { PlayerData } from '@/types'

const basePlayer: PlayerData = {
  summonerName: '测试玩家',
  region: '艾欧尼亚',
  tier: '黄金',
  winRate: 48,
  kda: { kills: 5, deaths: 8, assists: 3 },
  totalGames: 600,
  champions: [
    { name: '亚索', winRate: 42, games: 200 },
    { name: '盲僧', winRate: 45, games: 150 },
  ],
}

describe('matchTemplate', () => {
  it('should match low winrate Yasuo template', () => {
    const result = matchTemplate(basePlayer)
    expect(result).not.toBeNull()
    expect(result!.text).toContain('亚索')
    expect(result!.grade).toBe('S')
    expect(result!.source).toBe('template')
  })

  it('should match smurf compliment for high winrate player', () => {
    const smurf: PlayerData = {
      ...basePlayer,
      winRate: 60,
      tier: '钻石',
      kda: { kills: 8, deaths: 2, assists: 6 },
      champions: [{ name: '盖伦', winRate: 65, games: 100 }],
    }
    const result = matchTemplate(smurf)
    expect(result).not.toBeNull()
    expect(result!.text).toContain('代练')
  })

  it('should return fallback for player with little data', () => {
    const noob: PlayerData = {
      ...basePlayer,
      winRate: 40,
      totalGames: 10,
      tier: '白银',
      kda: { kills: 2, deaths: 3, assists: 4 },
      champions: [],
    }
    const result = matchTemplate(noob)
    expect(result).not.toBeNull()
    expect(result!.grade).toBe('C')
  })
})
