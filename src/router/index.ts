import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'search',
      component: () => import('@/pages/SearchPage.vue'),
    },
    {
      path: '/result',
      name: 'result',
      component: () => import('@/pages/ResultPage.vue'),
    },
  ],
})

export default router
