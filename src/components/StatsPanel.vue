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
