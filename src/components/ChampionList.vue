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
