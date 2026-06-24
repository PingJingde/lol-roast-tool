// ===== 玩家数据 =====
export interface PlayerData {
  summonerName: string
  region: string
  tier: Tier
  winRate: number       // 0-100 百分比
  kda: KDA
  totalGames: number
  champions: ChampionStat[]
}

export type Tier =
  | '王者' | '宗师' | '大师'
  | '钻石' | '翡翠' | '铂金'
  | '黄金' | '白银' | '青铜' | '黑铁'
  | '未定级'

export interface KDA {
  kills: number
  deaths: number
  assists: number
}

export interface ChampionStat {
  name: string
  winRate: number       // 0-100
  games: number
}

// ===== 锐评引擎 =====
export interface RoastResult {
  text: string
  grade: 'S' | 'A' | 'B' | 'C'
  source: 'template' | 'ai'
  templateId?: string   // 模板命中时记录ID
}

export interface RoastTemplate {
  id: string
  condition: MatchCondition
  text: string
  grade: 'S' | 'A' | 'B' | 'C'
  tags: string[]
}

export interface MatchCondition {
  winRateBelow?: number
  winRateAbove?: number
  deathsAboveKillsRatio?: number  // deaths > kills * ratio
  gamesAbove?: number
  tierBelow?: Tier
  champions?: string[]
  championWinRateBelow?: number
  championGamesAbove?: number
}

// ===== 搜索 =====
export interface SearchRecord {
  summonerName: string
  region: string
  timestamp: number
}

// ===== 组件 Props =====
export interface SearchBarProps {
  loading: boolean
}

export interface PlayerHeaderProps {
  player: PlayerData
}

export interface StatsPanelProps {
  player: PlayerData
}

export interface ChampionListProps {
  champions: ChampionStat[]
}

export interface RoastCardProps {
  roast: RoastResult | null
  loading: boolean
}
