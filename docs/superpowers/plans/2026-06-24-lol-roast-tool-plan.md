# LOL 审判之眼 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个英雄联盟玩家战绩查询 & 锐评 Web 工具——输入召唤师名称+大区，展示战绩数据并生成毒舌幽默锐评。

**Architecture:** 纯前端 SPA — Vue 3 + TypeScript + Tailwind CSS + Vite，通过 CORS 代理获取 lolhelper.cn 数据，双引擎（模板匹配 + DeepSeek AI）生成锐评，部署到 Vercel。

**Tech Stack:** Vue 3 (Composition API), TypeScript, Tailwind CSS, Vite, Vue Router, Vitest

---

## 文件结构总览

```
lol-roast-tool/
├── index.html                          # Vite 入口 HTML
├── package.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
├── tsconfig.json
├── tsconfig.app.json
├── env.d.ts
├── src/
│   ├── main.ts                         # 应用入口
│   ├── App.vue                         # 根组件（RouterView）
│   ├── style.css                       # Tailwind 指令 + 全局样式
│   ├── router/
│   │   └── index.ts                    # 路由配置
│   ├── pages/
│   │   ├── SearchPage.vue             # 搜索首页
│   │   └── ResultPage.vue             # 结果页
│   ├── components/
│   │   ├── SearchBar.vue              # 搜索栏（大区+名称）
│   │   ├── RecentSearches.vue         # 最近搜索记录
│   │   ├── PlayerHeader.vue           # 召唤师基本信息
│   │   ├── StatsPanel.vue             # 数据面板
│   │   ├── ChampionList.vue           # 常用英雄列表
│   │   ├── RoastCard.vue              # 锐评卡片
│   │   └── LoadingSpinner.vue         # 加载动画
│   ├── engine/
│   │   ├── templateRoast.ts           # 模板匹配引擎
│   │   ├── templates.json             # 模板库（50+条）
│   │   └── deepseekAI.ts             # DeepSeek AI 调用
│   ├── services/
│   │   └── dataFetcher.ts             # 数据获取 + CORS 代理
│   ├── utils/
│   │   ├── filter.ts                  # 敏感词过滤
│   │   └── cache.ts                   # localStorage 缓存
│   └── types/
│       └── index.ts                   # TypeScript 类型定义
└── public/
    └── favicon.ico
```

---

## 里程碑 M1：项目脚手架 + 搜索页面 + 静态 UI

### Task 1: 初始化 Vue 3 + Vite + TS 项目

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `env.d.ts`, `index.html`, `src/main.ts`, `src/App.vue`, `src/style.css`

- [ ] **Step 1: 用 Vite 脚手架创建项目**

```bash
cd D:\deepSeekGuiWorkSpace\lol-roast-tool
npm create vite@latest . -- --template vue-ts
```

Expected: 脚手架生成 package.json、vite.config.ts、tsconfig.json 等文件

- [ ] **Step 2: 安装 Tailwind CSS**

```bash
npm install -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 3: 配置 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
})
```

- [ ] **Step 4: 写入 src/style.css**

```css
@import "tailwindcss";

body {
  @apply bg-gray-950 text-gray-200 min-h-screen;
}
```

- [ ] **Step 5: 写入 src/App.vue 最简根组件**

```vue
<script setup lang="ts">
import { RouterView } from 'vue-router'
</script>

<template>
  <div class="min-h-screen bg-gray-950">
    <RouterView />
  </div>
</template>
```

- [ ] **Step 6: 安装 Vue Router**

```bash
npm install vue-router
```

- [ ] **Step 7: 写入 src/router/index.ts**

```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'search',
      component: () => import('@/pages/SearchPage.vue'),
    },
    {
      path: '/result',
      name: 'result',
      component: () => import('@/pages/ResultPage.vue'),
    },
  ],
})

export default router
```

- [ ] **Step 8: 写入 src/main.ts**

```typescript
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
```

- [ ] **Step 9: 创建占位页面确认路由可用**

创建 `src/pages/SearchPage.vue`:
```vue
<template>
  <div class="text-center py-20 text-yellow-400 text-2xl">搜索页</div>
</template>
```

创建 `src/pages/ResultPage.vue`:
```vue
<template>
  <div class="text-center py-20 text-red-400 text-2xl">结果页</div>
</template>
```

- [ ] **Step 10: 启动开发服务器验证**

```bash
npm run dev
```

Expected: 浏览器打开 http://localhost:5173 显示"搜索页"，访问 /result 显示"结果页"

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "feat: scaffold Vue 3 + Vite + TS + Tailwind + Router"
```

---

### Task 2: TypeScript 类型定义

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: 写入完整类型定义**

```typescript
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
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts && git commit -m "feat: add TypeScript type definitions"
```

---

### Task 3: SearchBar 组件 + SearchPage

**Files:**
- Create: `src/components/SearchBar.vue`
- Modify: `src/pages/SearchPage.vue`

- [ ] **Step 1: 创建 SearchBar.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { SearchBarProps } from '@/types'

const props = withDefaults(defineProps<SearchBarProps>(), {
  loading: false,
})

const emit = defineEmits<{
  search: [summonerName: string, region: string]
}>()

const summonerName = ref('')
const region = ref('艾欧尼亚')

const regions = [
  '艾欧尼亚', '比尔吉沃特', '祖安', '诺克萨斯', '班德尔城',
  '德玛西亚', '皮尔特沃夫', '战争学院', '弗雷尔卓德', '巨神峰',
  '雷瑟守备', '无畏先锋', '裁决之地', '黑色玫瑰', '暗影岛',
  '恕瑞玛', '钢铁烈阳', '水晶之痕', '均衡教派', '扭曲丛林',
  '影流', '守望之海', '征服之海', '卡拉曼达', '巨龙之巢',
  '皮城警备', '男爵领域',
]

function handleSearch() {
  const name = summonerName.value.trim()
  if (!name) return
  emit('search', name, region.value)
}
</script>

<template>
  <div class="flex gap-3 items-center bg-gray-900/80 rounded-xl p-3 border border-gray-700/50 backdrop-blur">
    <select
      v-model="region"
      class="px-3 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 text-sm focus:border-yellow-500 focus:outline-none cursor-pointer"
    >
      <option v-for="r in regions" :key="r" :value="r">{{ r }}</option>
    </select>
    <input
      v-model="summonerName"
      type="text"
      placeholder="输入召唤师名称..."
      class="flex-1 px-4 py-2.5 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:border-yellow-500 focus:outline-none"
      @keyup.enter="handleSearch"
    />
    <button
      :disabled="loading || !summonerName.trim()"
      class="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-400 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 font-bold rounded-lg transition-colors flex items-center gap-2"
      @click="handleSearch"
    >
      <span v-if="loading" class="inline-block w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></span>
      <span>{{ loading ? '审判中...' : '⚡ 审判' }}</span>
    </button>
  </div>
</template>
```

- [ ] **Step 2: 更新 SearchPage.vue**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from '@/components/SearchBar.vue'

const router = useRouter()
const loading = ref(false)

function handleSearch(name: string, region: string) {
  loading.value = true
  router.push({
    path: '/result',
    query: { name, region },
  })
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen px-4">
    <!-- Logo 区域 -->
    <div class="text-center mb-10">
      <div class="text-7xl mb-4">🏟️</div>
      <h1 class="text-4xl font-extrabold text-yellow-400 tracking-tight mb-2">审判之眼</h1>
      <p class="text-gray-500 text-lg">输入召唤师名称，查看战绩与锐评</p>
    </div>

    <!-- 搜索栏 -->
    <div class="w-full max-w-lg">
      <SearchBar :loading="loading" @search="handleSearch" />
    </div>
  </div>
</template>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SearchBar.vue src/pages/SearchPage.vue && git commit -m "feat: add SearchBar component and SearchPage"
```

---

### Task 4: 结果页静态组件

**Files:**
- Create: `src/components/PlayerHeader.vue`, `src/components/StatsPanel.vue`, `src/components/ChampionList.vue`, `src/components/RoastCard.vue`, `src/components/LoadingSpinner.vue`, `src/pages/ResultPage.vue`

- [ ] **Step 1: 创建 LoadingSpinner.vue**

```vue
<template>
  <div class="flex flex-col items-center justify-center py-20 gap-4">
    <div class="w-10 h-10 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
    <p class="text-gray-400 text-sm"><slot>加载中...</slot></p>
  </div>
</template>
```

- [ ] **Step 2: 创建 PlayerHeader.vue**

```vue
<script setup lang="ts">
import type { PlayerHeaderProps } from '@/types'

defineProps<PlayerHeaderProps>()
</script>

<template>
  <div class="flex items-center gap-4 mb-6">
    <div class="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center text-2xl border border-gray-700">
      👤
    </div>
    <div>
      <h2 class="text-2xl font-bold text-yellow-400">{{ player.summonerName }}</h2>
      <p class="text-gray-400 text-sm">{{ player.region }} · {{ player.tier }}</p>
    </div>
  </div>
</template>
```

- [ ] **Step 3: 创建 StatsPanel.vue**

```vue
<script setup lang="ts">
import { computed } from 'vue'
import type { StatsPanelProps } from '@/types'

const props = defineProps<StatsPanelProps>()

const winRateColor = computed(() => {
  if (props.player.winRate >= 55) return 'text-green-400'
  if (props.player.winRate >= 48) return 'text-yellow-400'
  return 'text-red-400'
})
</script>

<template>
  <div class="bg-gray-900/60 rounded-xl p-5 border border-gray-700/50">
    <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">📊 战绩概览</h3>
    <div class="grid grid-cols-2 gap-4">
      <div>
        <div class="text-xs text-gray-500 mb-1">胜率</div>
        <div class="text-2xl font-bold" :class="winRateColor">{{ player.winRate }}%</div>
      </div>
      <div>
        <div class="text-xs text-gray-500 mb-1">总场次</div>
        <div class="text-2xl font-bold text-gray-200">{{ player.totalGames }}</div>
      </div>
      <div>
        <div class="text-xs text-gray-500 mb-1">KDA</div>
        <div class="text-2xl font-bold text-gray-200">
          {{ player.kda.kills }} / <span class="text-red-400">{{ player.kda.deaths }}</span> / {{ player.kda.assists }}
        </div>
      </div>
      <div>
        <div class="text-xs text-gray-500 mb-1">KDA 比率</div>
        <div class="text-2xl font-bold text-gray-200">
          {{ ((player.kda.kills + player.kda.assists) / Math.max(1, player.kda.deaths)).toFixed(1) }}
        </div>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 4: 创建 ChampionList.vue**

```vue
<script setup lang="ts">
import type { ChampionListProps } from '@/types'

defineProps<ChampionListProps>()
</script>

<template>
  <div class="bg-gray-900/60 rounded-xl p-5 border border-gray-700/50 mt-4">
    <h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">🎯 常用英雄</h3>
    <div v-if="champions.length === 0" class="text-gray-500 text-sm">暂无数据</div>
    <div v-for="champ in champions" :key="champ.name" class="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
      <span class="text-gray-200 font-medium">{{ champ.name }}</span>
      <div class="flex items-center gap-4 text-sm">
        <span :class="champ.winRate >= 50 ? 'text-green-400' : 'text-red-400'">{{ champ.winRate }}%</span>
        <span class="text-gray-500">{{ champ.games }}场</span>
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 5: 创建 RoastCard.vue（静态版本，暂不接引擎）**

```vue
<script setup lang="ts">
import type { RoastCardProps } from '@/types'

defineProps<RoastCardProps>()

const gradeColors: Record<string, string> = {
  S: 'bg-red-600 text-white',
  A: 'bg-orange-500 text-white',
  B: 'bg-yellow-500 text-gray-900',
  C: 'bg-gray-500 text-white',
}
</script>

<template>
  <div class="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl p-6 border border-yellow-600/30 relative">
    <!-- Loading -->
    <div v-if="loading" class="flex flex-col items-center gap-3 py-8">
      <div class="w-8 h-8 border-3 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
      <p class="text-gray-400 text-sm">AI 正在分析你的战绩...</p>
    </div>

    <!-- Result -->
    <template v-else-if="roast">
      <div
        v-if="roast.grade"
        class="absolute -top-3 right-4 px-3 py-1 rounded-full text-xs font-bold"
        :class="gradeColors[roast.grade]"
      >
        {{ roast.grade }} 级锐评
      </div>
      <h3 class="text-lg font-bold text-red-400 mb-3">⚡ 审判结果</h3>
      <p class="text-gray-300 text-lg leading-relaxed italic">"{{ roast.text }}"</p>
      <p class="text-gray-600 text-xs mt-4">
        {{ roast.source === 'ai' ? '🤖 由 DeepSeek 锐评引擎生成' : '📋 由模板引擎生成' }}
      </p>
    </template>

    <!-- Empty -->
    <div v-else class="text-center py-8 text-gray-500">
      <p class="text-lg">暂无锐评数据</p>
    </div>
  </div>
</template>
```

- [ ] **Step 6: 创建 ResultPage.vue（静态 mock 数据版本）**

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import type { PlayerData, RoastResult } from '@/types'
import PlayerHeader from '@/components/PlayerHeader.vue'
import StatsPanel from '@/components/StatsPanel.vue'
import ChampionList from '@/components/ChampionList.vue'
import RoastCard from '@/components/RoastCard.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const route = useRoute()
const loading = ref(true)
const player = ref<PlayerData | null>(null)
const roast = ref<RoastResult | null>(null)

// 临时 mock 数据，M2 替换为真实数据获取
setTimeout(() => {
  player.value = {
    summonerName: (route.query.name as string) || '疾风剑豪#12345',
    region: (route.query.region as string) || '艾欧尼亚',
    tier: '超凡大师',
    winRate: 48,
    kda: { kills: 2.1, deaths: 6.3, assists: 10.2 },
    totalGames: 234,
    champions: [
      { name: '亚索', winRate: 43, games: 234 },
      { name: '劫', winRate: 47, games: 189 },
      { name: '永恩', winRate: 41, games: 156 },
    ],
  }
  roast.value = {
    text: '你的亚索玩了 234 场，胜率 43%——建议去玩人机找找自信。每次E进人群的速度比回城还快，队友?信号都追不上你。',
    grade: 'S',
    source: 'template',
    templateId: 'yasuo_low_winrate',
  }
  loading.value = false
}, 1500)
</script>

<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <button
      class="text-gray-400 hover:text-yellow-400 transition-colors mb-6 flex items-center gap-2"
      @click="$router.push('/')"
    >
      ← 返回搜索
    </button>

    <LoadingSpinner v-if="loading && !player">正在查询战绩...</LoadingSpinner>

    <template v-else-if="player">
      <PlayerHeader :player="player" />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- 左侧：数据 -->
        <div>
          <StatsPanel :player="player" />
          <ChampionList :champions="player.champions" />
        </div>
        <!-- 右侧：锐评 -->
        <div>
          <RoastCard :roast="roast" :loading="loading" />
        </div>
      </div>
    </template>

    <div v-else class="text-center py-20 text-gray-500">
      <p class="text-lg">未找到该召唤师</p>
    </div>
  </div>
</template>
```

- [ ] **Step 7: 验证所有页面渲染正常**

```bash
npm run dev
```

手动检查: 搜索首页 → 点击审判 → 结果页展示 mock 数据（左右两栏布局）

- [ ] **Step 8: Commit**

```bash
git add src/components/ src/pages/ && git commit -m "feat: add result page with all static components and mock data"
```

---

## 里程碑 M2：数据获取 + 解析

### Task 5: 数据获取服务

**Files:**
- Create: `src/services/dataFetcher.ts`
- Create: `src/utils/cache.ts`

- [ ] **Step 1: 创建 localStorage 缓存工具 `src/utils/cache.ts`**

```typescript
const CACHE_PREFIX = 'lol_roast_'
const CACHE_TTL = 5 * 60 * 1000 // 5 分钟

export function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const { data, timestamp } = JSON.parse(raw)
    if (Date.now() - timestamp > CACHE_TTL) {
      localStorage.removeItem(CACHE_PREFIX + key)
      return null
    }
    return data as T
  } catch {
    return null
  }
}

export function setCache<T>(key: string, data: T): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }))
  } catch {
    // localStorage 满了则忽略
  }
}
```

- [ ] **Step 2: 创建数据获取服务 `src/services/dataFetcher.ts`**

```typescript
import type { PlayerData, ChampionStat } from '@/types'
import { getCached, setCache } from '@/utils/cache'

// CORS 代理地址 — 部署时替换为实际的 Cloudflare Worker
const CORS_PROXY = 'https://cors-proxy.example.workers.dev/'

interface RawPlayerInfo {
  name: string
  tier: string
  winRate: string
  totalGames: string
  kda: string
}

/**
 * 从 lolhelper.cn 获取玩家数据
 */
export async function fetchPlayerData(summonerName: string, region: string): Promise<PlayerData> {
  const cacheKey = `${region}_${summonerName}`

  // 1. 检查缓存
  const cached = getCached<PlayerData>(cacheKey)
  if (cached) return cached

  // 2. 通过 CORS 代理请求 lolhelper.cn
  // NOTE: 实际 URL 和解析逻辑需根据 lolhelper.cn 的实际 API/页面结构调整
  const proxyUrl = `${CORS_PROXY}https://lolhelper.cn/api/query?region=${encodeURIComponent(region)}&name=${encodeURIComponent(summonerName)}`

  const response = await fetch(proxyUrl, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new Error(`数据获取失败: HTTP ${response.status}`)
  }

  const raw = await response.json()

  // 3. 解析并标准化数据
  const player: PlayerData = parsePlayerData(raw, region)

  // 4. 写入缓存
  setCache(cacheKey, player)

  return player
}

/**
 * 将 lolhelper.cn 原始响应解析为 PlayerData
 * NOTE: 字段映射需根据实际 API 调整
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
    champions: [], // 常用英雄可能来自另外的接口，先留空
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
```

- [ ] **Step 3: Commit**

```bash
git add src/services/dataFetcher.ts src/utils/cache.ts && git commit -m "feat: add data fetcher service with CORS proxy support"
```

---

### Task 6: ResultPage 接入真实数据

**Files:**
- Modify: `src/pages/ResultPage.vue`

- [ ] **Step 1: 重构 ResultPage 使用 fetchPlayerData**

替换 ResultPage.vue 的 `<script setup>` 部分：

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import type { PlayerData, RoastResult } from '@/types'
import { fetchPlayerData } from '@/services/dataFetcher'
import PlayerHeader from '@/components/PlayerHeader.vue'
import StatsPanel from '@/components/StatsPanel.vue'
import ChampionList from '@/components/ChampionList.vue'
import RoastCard from '@/components/RoastCard.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'

const route = useRoute()
const loading = ref(true)
const error = ref<string | null>(null)
const player = ref<PlayerData | null>(null)
const roast = ref<RoastResult | null>(null)

onMounted(async () => {
  const name = route.query.name as string
  const region = route.query.region as string

  if (!name || !region) {
    error.value = '缺少查询参数，请返回首页重新搜索'
    loading.value = false
    return
  }

  try {
    player.value = await fetchPlayerData(name, region)
    // M3 接入锐评引擎后替换此处
    roast.value = null
  } catch (e) {
    error.value = e instanceof Error ? e.message : '查询失败，请稍后重试'
  } finally {
    loading.value = false
  }
})
</script>
```

模板部分去除 mock setTimeout，保留原有 UI 结构。新增 error 状态展示：

```vue
<!-- 在 LoadingSpinner 之后加入 -->
<div v-if="error" class="text-center py-20">
  <p class="text-red-400 text-lg">{{ error }}</p>
  <button
    class="mt-4 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
    @click="$router.push('/')"
  >
    ← 返回搜索
  </button>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/ResultPage.vue && git commit -m "feat: wire ResultPage to real data fetcher with error handling"
```

---

## 里程碑 M3：锐评引擎

### Task 7: 模板库

**Files:**
- Create: `src/engine/templates.json`

- [ ] **Step 1: 创建初始模板库（50 条中先写核心 15 条，后续补全）**

```json
[
  {
    "id": "low_winrate_champ",
    "condition": { "championWinRateBelow": 45, "championGamesAbove": 100 },
    "text": "你的 {champion} 玩了 {games} 场，胜率 {winrate}——我建议你去玩人机找找自信。",
    "grade": "S",
    "tags": ["英雄梗", "低胜率"]
  },
  {
    "id": "feeder_kda",
    "condition": { "deathsAboveKillsRatio": 1.5 },
    "text": "KDA {kda}，你的死亡次数比你的补刀还稳定，对面打野看见你就像看见提款机。",
    "grade": "A",
    "tags": ["KDA梗", "高死亡率"]
  },
  {
    "id": "hardstuck_low_elo",
    "condition": { "tierBelow": "黄金", "gamesAbove": 500 },
    "text": "{tier} 段位，{total_games} 场——质量和数量你选了后者。峡谷质检员非你莫属。",
    "grade": "S",
    "tags": ["段位梗", "老玩家"]
  },
  {
    "id": "yasuo_otp",
    "condition": { "champions": ["亚索"], "championWinRateBelow": 48, "championGamesAbove": 50 },
    "text": "又一个亚索绝活哥——绝活指的是把队友活活气绝。E进人群的速度比回城还快，队友的问号信号都追不上你。",
    "grade": "S",
    "tags": ["英雄梗", "亚索"]
  },
  {
    "id": "zed_otp",
    "condition": { "champions": ["劫"], "championWinRateBelow": 48, "championGamesAbove": 50 },
    "text": "{champion} 玩了 {games} 场，胜率 {winrate}——你的影子比你的操作更有存在感。",
    "grade": "S",
    "tags": ["英雄梗", "劫"]
  },
  {
    "id": "yone_otp",
    "condition": { "champions": ["永恩"], "championWinRateBelow": 48, "championGamesAbove": 50 },
    "text": "{champion} {games} 场 {winrate}——封印解除的只有你的智商封印。双剑合璧，队友双倍血压。",
    "grade": "S",
    "tags": ["英雄梗", "永恩"]
  },
  {
    "id": "high_winrate_smurf",
    "condition": { "winRateAbove": 55 },
    "text": "胜率 {winrate}，KDA {kda}——你是代练还是炸鱼？建议自首。不过说实话，玩得不错 👍",
    "grade": "B",
    "tags": ["高胜率", "夸奖"]
  },
  {
    "id": "very_low_winrate",
    "condition": { "winRateBelow": 40, "gamesAbove": 50 },
    "text": "胜率 {winrate}，{total_games} 场——你不是在玩游戏，你是在做社会学实验：队友的忍耐极限到底在哪。",
    "grade": "S",
    "tags": ["低胜率", "整活"]
  },
  {
    "id": "bronze_silver_hardstuck",
    "condition": { "tierBelow": "黄金", "gamesAbove": 1000 },
    "text": "{tier}，{total_games} 场——你已经是峡谷非物质文化遗产：千年老妖怪。建议把号传给下一代继续上分。",
    "grade": "S",
    "tags": ["段位梗", "天牢"]
  },
  {
    "id": "kda_god",
    "condition": { "winRateAbove": 52 },
    "text": "KDA {kda}——KDA 玩家实锤了。队友在打团你在刷野，队友死了你在收兵。赢了你C，输了队友菜。",
    "grade": "A",
    "tags": ["KDA梗", "KDA怪"]
  },
  {
    "id": "support_main",
    "condition": { "champions": ["锤石", "璐璐", "猫咪", "娜美", "风女"] },
    "text": "主玩 {champion}？辅助玩家——峡谷最伟大的奉献者。输了怪AD，赢了辅助没作用，习惯了就好。",
    "grade": "B",
    "tags": ["辅助", "位置梗"]
  },
  {
    "id": "adc_main",
    "condition": { "champions": ["薇恩", "卡莎", "金克丝", "EZ", "德莱文"] },
    "text": "主玩 {champion}？ADC 玩家——峡谷最脆的存在，刺客的提款机，辅助的噩梦。打团先被秒是传统艺能。",
    "grade": "B",
    "tags": ["ADC", "位置梗"]
  },
  {
    "id": "no_champ_data",
    "condition": {},
    "text": "数据太少我都不好意思锐评你——多打几把再来吧，现在的你就像刚出新手村的勇者。",
    "grade": "C",
    "tags": ["无数据", "兜底"]
  },
  {
    "id": "mid_elo_average",
    "condition": { "winRateBelow": 52, "winRateAbove": 45 },
    "text": "胜率 {winrate}，{tier} 段位——标准的峡谷打工人。不强不弱，不悲不喜，上不去下不来，这就是你的 LOL 人生。",
    "grade": "A",
    "tags": ["普通", "中位"]
  },
  {
    "id": "lee_sin_otp",
    "condition": { "champions": ["盲僧", "李青"], "championGamesAbove": 50, "championWinRateBelow": 48 },
    "text": "{champion} {games} 场 {winrate}——一库一库把自己库库送掉。你的回旋踢成功率应该和彩票中奖率差不多。",
    "grade": "S",
    "tags": ["英雄梗", "盲僧"]
  }
]
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/templates.json && git commit -m "feat: add 15 roast templates covering common player archetypes"
```

---

### Task 8: 模板匹配引擎

**Files:**
- Create: `src/engine/templateRoast.ts`

- [ ] **Step 1: 创建模板匹配引擎**

```typescript
import type { PlayerData, RoastTemplate, RoastResult, ChampionStat } from '@/types'
import templatesData from './templates.json'

const templates = templatesData as RoastTemplate[]

// 段位排序（从低到高），用于 "低于某段位" 比较
const TIER_ORDER: string[] = [
  '黑铁', '青铜', '白银', '黄金', '铂金', '翡翠', '钻石', '大师', '宗师', '王者',
]

/**
 * 模板匹配引擎：遍历所有模板，返回评分最高的匹配结果
 */
export function matchTemplate(player: PlayerData): RoastResult | null {
  let bestMatch: { template: RoastTemplate; score: number } | null = null

  for (const template of templates) {
    const condition = template.condition

    // 空 condition 表示兜底模板，最低优先级
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
  // 胜率低于
  if (condition.winRateBelow !== undefined && player.winRate >= condition.winRateBelow) return false

  // 胜率高于
  if (condition.winRateAbove !== undefined && player.winRate <= condition.winRateAbove) return false

  // 死亡/击杀比率
  if (condition.deathsAboveKillsRatio !== undefined) {
    if (player.kda.deaths <= player.kda.kills * condition.deathsAboveKillsRatio) return false
  }

  // 总场次高于
  if (condition.gamesAbove !== undefined && player.totalGames <= condition.gamesAbove) return false

  // 段位低于
  if (condition.tierBelow !== undefined) {
    const playerIdx = TIER_ORDER.indexOf(player.tier)
    const thresholdIdx = TIER_ORDER.indexOf(condition.tierBelow)
    if (playerIdx === -1 || thresholdIdx === -1 || playerIdx >= thresholdIdx) return false
  }

  // 指定英雄
  if (condition.champions !== undefined) {
    const hasChampion = player.champions.some((c: ChampionStat) =>
      condition.champions!.some(cond => c.name.includes(cond))
    )
    if (!hasChampion) return false
  }

  // 常用英雄胜率低于（取最低胜率的英雄）
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

// 根据条件复杂度计分，越具体的匹配分越高
function calculateScore(condition: RoastTemplate['condition']): number {
  let score = 0
  if (condition.winRateBelow !== undefined) score += 10
  if (condition.winRateAbove !== undefined) score += 10
  if (condition.deathsAboveKillsRatio !== undefined) score += 15
  if (condition.gamesAbove !== undefined) score += 5
  if (condition.tierBelow !== undefined) score += 10
  if (condition.champions !== undefined) score += 20  // 英雄匹配权重最高
  if (condition.championWinRateBelow !== undefined) score += 15
  if (condition.championGamesAbove !== undefined) score += 5
  return score
}

// 模板变量插值
function interpolateText(text: string, player: PlayerData): string {
  // 找最低胜率的常用英雄
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
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/templateRoast.ts && git commit -m "feat: add template matching engine with scoring and interpolation"
```

---

### Task 9: DeepSeek AI 引擎

**Files:**
- Create: `src/engine/deepseekAI.ts`

- [ ] **Step 1: 创建 DeepSeek AI 调用模块**

```typescript
import type { PlayerData, RoastResult } from '@/types'
import { matchTemplate } from './templateRoast'

/**
 * 构建锐评 Prompt
 */
function buildPrompt(player: PlayerData): string {
  const champions = player.champions.map(c => `${c.name}(${c.winRate}% ${c.games}场)`).join('、')

  return `你是一个LOL锐评机器人，说话风格毒舌、幽默、一针见血。
  请根据以下玩家数据，生成一段100字以内的锐评：

  - 召唤师：${player.summonerName}
  - 段位：${player.tier}
  - 胜率：${player.winRate}%
  - KDA：${player.kda.kills}/${player.kda.deaths}/${player.kda.assists}
  - 常用英雄：${champions || '无数据'}
  - 总场次：${player.totalGames}

  要求：
  1. 语气像朋友间互相损，不要太恶意
  2. 针对具体数据吐槽，不要泛泛而谈
  3. 加点LOL玩家才懂的梗
  4. 禁止人身攻击和脏话
  5. 只返回锐评文本，不要其他内容`
}

/**
 * 调用 DeepSeek 网页版对话 API
 * NOTE: 需根据 DeepSeek 网页版实际 API 接口调整
 */
async function callDeepSeekWeb(prompt: string): Promise<string> {
  // DeepSeek 网页版对话接口
  // 如果网页版 API 不可用，可使用 DeepSeek 官方 API（需 Key）
  const response = await fetch('https://chat.deepseek.com/api/v0/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      stream: false,
    }),
    signal: AbortSignal.timeout(8000),
  })

  if (!response.ok) {
    throw new Error(`DeepSeek API 返回错误: ${response.status}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || data.content || ''
}

/**
 * AI 锐评引擎：调用 DeepSeek + 降级回模板
 */
export async function generateAIRoast(player: PlayerData): Promise<RoastResult> {
  try {
    const prompt = buildPrompt(player)
    const aiText = await callDeepSeekWeb(prompt)
    const text = aiText.trim()

    if (!text) throw new Error('AI 返回空内容')

    return {
      text,
      grade: 'A',  // AI 生成默认 A 级
      source: 'ai',
    }
  } catch {
    // AI 失败时回退到模板匹配
    const templateResult = matchTemplate(player)
    if (templateResult) return templateResult

    // 模板也没命中，返回兜底文案
    return {
      text: '数据太少，我都不好意思锐评你——多打几把再来吧。',
      grade: 'C',
      source: 'template',
      templateId: 'no_champ_data',
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/deepseekAI.ts && git commit -m "feat: add DeepSeek AI engine with fallback to template matching"
```

---

### Task 10: 敏感词过滤

**Files:**
- Create: `src/utils/filter.ts`

- [ ] **Step 1: 创建敏感词过滤工具**

```typescript
// 敏感词列表 — 实际部署时从配置加载
const SENSITIVE_WORDS = [
  // 政治相关
  '习近平', '习大大', '包子', '维尼',
  // 脏话（示例，实际需更全）
  'cnm', 'nmsl', 'sb', '傻逼', '操你', '他妈',
  // 歧视
  '支那', 'ching', 'nig',
]

/**
 * 检查文本是否包含敏感词
 */
export function containsSensitive(text: string): boolean {
  const lower = text.toLowerCase()
  return SENSITIVE_WORDS.some(word => lower.includes(word.toLowerCase()))
}

/**
 * 过滤敏感词，替换为 ***
 */
export function filterSensitive(text: string): string {
  let filtered = text
  for (const word of SENSITIVE_WORDS) {
    const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    filtered = filtered.replace(regex, '***')
  }
  return filtered
}

/**
 * 安全锐评文案兜底
 */
export const SAFE_FALLBACK = '这位召唤师的数据看起来很有故事，但我们还是留点面子吧。多练练，下次一定！'
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/filter.ts && git commit -m "feat: add sensitive word filter for roast content safety"
```

---

## 里程碑 M4：完整串联 + 测试

### Task 11: 串联所有模块到 ResultPage

**Files:**
- Modify: `src/pages/ResultPage.vue`

- [ ] **Step 1: 更新 ResultPage 接入锐评引擎和过滤**

在 ResultPage.vue 的 `onMounted` 中，数据获取成功后调用锐评引擎：

```typescript
import { generateAIRoast } from '@/engine/deepseekAI'
import { matchTemplate } from '@/engine/templateRoast'
import { containsSensitive, filterSensitive, SAFE_FALLBACK } from '@/utils/filter'

// 在 try 块中，fetchPlayerData 成功后：
try {
  player.value = await fetchPlayerData(name, region)

  // 用模板引擎生成锐评
  let result = matchTemplate(player.value)

  // 如果模板没命中高评级或没有结果，走 AI
  if (!result || result.grade === 'C') {
    result = await generateAIRoast(player.value)
  }

  // 安全检查
  if (result && containsSensitive(result.text)) {
    result.text = filterSensitive(result.text)
    // 过滤后如果全是 ***，则用兜底文案
    if (result.text.replace(/\*+/g, '').trim().length < 5) {
      result.text = SAFE_FALLBACK
    }
  }

  roast.value = result
} catch (e) {
  error.value = e instanceof Error ? e.message : '查询失败，请稍后重试'
} finally {
  loading.value = false
}
```

- [ ] **Step 2: 验证完整流程**

```bash
npm run dev
```

手动测试：搜索 → 等待数据加载 → 检查战绩数据显示 → 检查锐评卡片内容 → 返回搜索

- [ ] **Step 3: Commit**

```bash
git add src/pages/ResultPage.vue && git commit -m "feat: integrate roast engine with result page and safety filter"
```

---

### Task 12: RecentSearches 组件

**Files:**
- Create: `src/components/RecentSearches.vue`
- Modify: `src/pages/SearchPage.vue`

- [ ] **Step 1: 创建 RecentSearches.vue**

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { SearchRecord } from '@/types'

const emit = defineEmits<{
  select: [name: string, region: string]
}>()

const searches = ref<SearchRecord[]>([])

onMounted(() => {
  try {
    const raw = localStorage.getItem('lol_roast_searches')
    if (raw) searches.value = JSON.parse(raw)
  } catch {
    // ignore
  }
})

export function saveSearch(name: string, region: string) {
  const record: SearchRecord = { summonerName: name, region, timestamp: Date.now() }
  const existing = searches.value.filter(s => !(s.summonerName === name && s.region === region))
  searches.value = [record, ...existing].slice(0, 10)
  localStorage.setItem('lol_roast_searches', JSON.stringify(searches.value))
}

defineExpose({ saveSearch })
</script>

<template>
  <div v-if="searches.length > 0" class="w-full max-w-lg mt-6">
    <h3 class="text-xs text-gray-500 uppercase tracking-wide mb-3">最近搜索</h3>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="s in searches"
        :key="s.summonerName + s.region"
        class="px-3 py-1.5 text-sm bg-gray-800/60 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-yellow-400 transition-colors border border-gray-700/50"
        @click="emit('select', s.summonerName, s.region)"
      >
        {{ s.summonerName }} · {{ s.region }}
      </button>
    </div>
  </div>
</template>
```

- [ ] **Step 2: 更新 SearchPage.vue 集成 RecentSearches**

在 SearchPage.vue 中添加 RecentSearches 引用和保存逻辑。handleSearch 中调用 saveSearch。

- [ ] **Step 3: Commit**

```bash
git add src/components/RecentSearches.vue src/pages/SearchPage.vue && git commit -m "feat: add recent searches with localStorage persistence"
```

---

### Task 13: 编写测试

**Files:**
- Create: `src/engine/__tests__/templateRoast.test.ts`
- Create: `src/utils/__tests__/filter.test.ts`

- [ ] **Step 1: 安装 Vitest**

```bash
npm install -D vitest @vue/test-utils happy-dom
```

在 `vite.config.ts` 中加入 test 配置：

```typescript
/// <reference types="vitest" />
export default defineConfig({
  // ...现有配置
  test: {
    environment: 'happy-dom',
  },
})
```

在 `package.json` 添加 script：`"test": "vitest run"`

- [ ] **Step 2: 编写 templateRoast 测试 `src/engine/__tests__/templateRoast.test.ts`**

```typescript
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
  it('应匹配低胜率亚索模板', () => {
    const result = matchTemplate(basePlayer)
    expect(result).not.toBeNull()
    expect(result!.text).toContain('亚索')
    expect(result!.grade).toBe('S')
    expect(result!.source).toBe('template')
  })

  it('高胜率玩家应匹配夸奖模板', () => {
    const smurf: PlayerData = {
      ...basePlayer,
      winRate: 60,
      tier: '钻石',
      kda: { kills: 8, deaths: 2, assists: 6 },
      champions: [{ name: '卡莎', winRate: 65, games: 100 }],
    }
    const result = matchTemplate(smurf)
    expect(result).not.toBeNull()
    expect(result!.text).toContain('代练')
  })

  it('无数据时返回兜底模板', () => {
    const noob: PlayerData = {
      ...basePlayer,
      winRate: 50,
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
```

- [ ] **Step 3: 编写 filter 测试 `src/utils/__tests__/filter.test.ts`**

```typescript
import { describe, it, expect } from 'vitest'
import { containsSensitive, filterSensitive } from '../filter'

describe('containsSensitive', () => {
  it('应检测到敏感词', () => {
    expect(containsSensitive('你是傻逼')).toBe(true)
  })

  it('正常文本应通过', () => {
    expect(containsSensitive('你玩得不错')).toBe(false)
  })
})

describe('filterSensitive', () => {
  it('应替换敏感词', () => {
    const result = filterSensitive('你是傻逼吧')
    expect(result).not.toContain('傻逼')
    expect(result).toContain('***')
  })

  it('无敏感词应原样返回', () => {
    const result = filterSensitive('你玩得不错')
    expect(result).toBe('你玩得不错')
  })
})
```

- [ ] **Step 4: 运行测试**

```bash
npx vitest run
```

Expected: 5 tests passed

- [ ] **Step 5: Commit**

```bash
git add src/engine/__tests__/ src/utils/__tests__/ vite.config.ts package.json && git commit -m "test: add tests for template engine and sensitive word filter"
```

---

## 里程碑 M5：部署上线

### Task 14: 部署到 Vercel

**Files:**
- Create: `vercel.json`

- [ ] **Step 1: 创建 Vercel 配置 `vercel.json`**

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

- [ ] **Step 2: 构建生产版本并验证**

```bash
npm run build
```

Expected: `dist/` 目录生成成功，无报错

- [ ] **Step 3: 安装 Vercel CLI 并部署**

```bash
npm i -g vercel
vercel --prod
```

按提示完成：登录 Vercel → 选择项目 → 确认配置 → 等待部署

- [ ] **Step 4: 配置 CORS 代理环境变量**

在 Vercel Dashboard → Settings → Environment Variables 中设置：
```
VITE_CORS_PROXY=https://your-cors-proxy.workers.dev
```

- [ ] **Step 5: 验证线上环境**

打开 Vercel 分配的域名，测试搜索 → 结果展示完整流程

- [ ] **Step 6: Commit**

```bash
git add vercel.json && git commit -m "chore: add Vercel deployment config"
```

---

## 风险与待定项

| 风险 | 影响 | 缓解措施 |
|---|---|---|
| lolhelper.cn 无公开 API，需解析 HTML | 数据获取可能不稳定 | M2 先做灵活的解析器，预留多数据源 adapter |
| DeepSeek 网页版 API 随时可能变更 | AI 锐评可能不可用 | 模板引擎独立可用，AI 作为增强 |
| CORS 代理可能被限流 | 查询失败 | 多代理轮换 + 5 分钟缓存 |
| 敏感词过滤不全面 | 安全风险 | 部署前补充完整词库，可接入第三方审核 API |
