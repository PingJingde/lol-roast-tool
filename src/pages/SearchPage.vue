<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import SearchBar from '@/components/SearchBar.vue'
import RecentSearches from '@/components/RecentSearches.vue'

const router = useRouter()
const loading = ref(false)
const recentRef = ref<InstanceType<typeof RecentSearches>>()

function handleSearch(name: string, region: string) {
  loading.value = true
  recentRef.value?.saveSearch(name, region)
  router.push({
    path: '/result',
    query: { name, region },
  })
}

function handleSelectRecent(name: string, region: string) {
  handleSearch(name, region)
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen px-4">
    <!-- Logo 区域 -->
    <div class="text-center mb-10">
      <div class="text-7xl mb-4">🏟️</div>
      <h1 class="text-4xl font-extrabold text-yellow-400 tracking-tight mb-2">峡谷品鉴</h1>
      <p class="text-gray-500 text-lg">输入召唤师名称，查看战绩与锐评</p>
    </div>

    <!-- 搜索栏 -->
    <div class="w-full max-w-lg">
      <SearchBar :loading="loading" @search="handleSearch" />
    </div>

    <!-- 最近搜索 -->
    <RecentSearches ref="recentRef" @select="handleSelectRecent" />
  </div>
</template>
