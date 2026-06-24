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
