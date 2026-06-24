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
import { generateAIRoast } from '@/engine/deepseekAI'
import { matchTemplate } from '@/engine/templateRoast'
import { containsSensitive, filterSensitive, SAFE_FALLBACK } from '@/utils/filter'

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

    // Use template engine for roast
    let result = matchTemplate(player.value)

    // If template didn't get a high-grade match, use AI
    if (!result || result.grade === 'C') {
      result = await generateAIRoast(player.value)
    }

    // Safety check
    if (result && containsSensitive(result.text)) {
      result.text = filterSensitive(result.text)
      // If filtered to almost nothing, use safe fallback
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
})
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

    <div v-if="error" class="text-center py-20">
      <p class="text-red-400 text-lg">{{ error }}</p>
      <button
        class="mt-4 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
        @click="$router.push('/')"
      >
        ← 返回搜索
      </button>
    </div>

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

    <div v-else-if="!loading && !error" class="text-center py-20 text-gray-500">
      <p class="text-lg">未找到该召唤师</p>
    </div>
  </div>
</template>
