import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import WalletTabBar from '../components/WalletTabBar.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/welcome'
  },
  {
    path: '/welcome',
    component: () => import ('../views/welcome.vue')
  },
  {
    path: '/new',
    component: () => import ('../views/new.vue')
  },
  {
    path: '/restore',
    component: () => import ('../views/restore.vue')
  },
  {
    path: '/settings',
    component: () => import ('../views/settings.vue')
  },
  {
    path: '/wallet',
    component: WalletTabBar,
    children: [
      {
        path: '/wallet/main',
        component: () => import ('../views/wallet/main.vue')
      },
      {
        path: '/wallet/transactions',
        component: () => import ('../views/wallet/transactions.vue')
      },
      {
        path: '/wallet/settings',
        component: () => import ('../views/wallet/settings.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
