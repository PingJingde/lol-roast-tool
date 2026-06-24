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

function saveSearch(name: string, region: string) {
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
