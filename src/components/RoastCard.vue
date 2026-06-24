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
  <div class="bg-gradient-to-br from-gray-900 to-gray-950 rounded-xl p-6 border border-yellow-600/30 relative min-h-[200px]">
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
