<template>
  <div class="flex flex-col items-center justify-center py-20 gap-4">
    <div class="w-10 h-10 border-[3px] border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
    <p class="text-gray-400 text-sm"><slot>加载中...</slot></p>
  </div>
</template>
