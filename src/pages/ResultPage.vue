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

// Temporary mock data — will be replaced in M2 with real data fetching
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
        <!-- Left: Data -->
        <div>
          <StatsPanel :player="player" />
          <ChampionList :champions="player.champions" />
        </div>
        <!-- Right: Roast -->
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
