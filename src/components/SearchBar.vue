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
