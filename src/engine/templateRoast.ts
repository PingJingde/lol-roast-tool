import type { PlayerData, RoastTemplate, RoastResult, ChampionStat } from '@/types'
import templatesData from './templates.json'

const templates = templatesData as RoastTemplate[]

// Tier order from low to high for "tierBelow" comparison
const TIER_ORDER: string[] = [
  '黑铁', '青铜', '白银', '黄金', '铂金', '翡翠', '钻石', '大师', '宗师', '王者',
]

/**
 * Template matching engine: iterate all templates, return highest-scoring match
 */
export function matchTemplate(player: PlayerData): RoastResult | null {
  let bestMatch: { template: RoastTemplate; score: number } | null = null

  for (const template of templates) {
    const condition = template.condition

    // Empty condition = fallback template, lowest priority
    if (Object.keys(condition).length === 0) {
      if (!bestMatch || bestMatch.score < 0) {
        bestMatch = { template, score: 0 }
      }
      continue
    }

    if (matchesCondition(player, condition)) {
      const score = calculateScore(condition)
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { template, score }
      }
    }
  }

  if (!bestMatch) return null

  const text = interpolateText(bestMatch.template.text, player)
  return {
    text,
    grade: bestMatch.template.grade,
    source: 'template',
    templateId: bestMatch.template.id,
  }
}

function matchesCondition(player: PlayerData, condition: RoastTemplate['condition']): boolean {
  if (condition.winRateBelow !== undefined && player.winRate >= condition.winRateBelow) return false
  if (condition.winRateAbove !== undefined && player.winRate <= condition.winRateAbove) return false

  if (condition.deathsAboveKillsRatio !== undefined) {
    if (player.kda.deaths <= player.kda.kills * condition.deathsAboveKillsRatio) return false
  }

  if (condition.gamesAbove !== undefined && player.totalGames <= condition.gamesAbove) return false

  if (condition.tierBelow !== undefined) {
    const playerIdx = TIER_ORDER.indexOf(player.tier)
    const thresholdIdx = TIER_ORDER.indexOf(condition.tierBelow)
    if (playerIdx === -1 || thresholdIdx === -1 || playerIdx >= thresholdIdx) return false
  }

  if (condition.champions !== undefined) {
    const hasChampion = player.champions.some((c: ChampionStat) =>
      condition.champions!.some(cond => c.name.includes(cond))
    )
    if (!hasChampion) return false
  }

  if (condition.championWinRateBelow !== undefined || condition.championGamesAbove !== undefined) {
    const matchedChamp = player.champions.find((c: ChampionStat) => {
      if (condition.championWinRateBelow !== undefined && c.winRate >= condition.championWinRateBelow) return false
      if (condition.championGamesAbove !== undefined && c.games <= condition.championGamesAbove) return false
      return true
    })
    if (!matchedChamp) return false
  }

  return true
}

// Score based on condition specificity — more specific = higher score
function calculateScore(condition: RoastTemplate['condition']): number {
  let score = 0
  if (condition.winRateBelow !== undefined) score += 10
  if (condition.winRateAbove !== undefined) score += 10
  if (condition.deathsAboveKillsRatio !== undefined) score += 15
  if (condition.gamesAbove !== undefined) score += 5
  if (condition.tierBelow !== undefined) score += 10
  if (condition.champions !== undefined) score += 20  // Champion match is highest weight
  if (condition.championWinRateBelow !== undefined) score += 15
  if (condition.championGamesAbove !== undefined) score += 5
  return score
}

// Template variable interpolation
function interpolateText(text: string, player: PlayerData): string {
  // Find the worst-performing champion
  const worstChamp = player.champions.length > 0
    ? player.champions.reduce((a, b) => a.winRate < b.winRate ? a : b)
    : null

  return text
    .replace(/\{champion\}/g, worstChamp?.name || '未知英雄')
    .replace(/\{games\}/g, String(worstChamp?.games || player.totalGames))
    .replace(/\{winrate\}/g, `${worstChamp?.winRate || player.winRate}%`)
    .replace(/\{kda\}/g, `${player.kda.kills}/${player.kda.deaths}/${player.kda.assists}`)
    .replace(/\{tier\}/g, player.tier)
    .replace(/\{total_games\}/g, String(player.totalGames))
}
