import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import WalletTabBar from '../components/WalletTabBar.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/NFC-Wallet'
  },
  {
    path: '/NFC-Wallet',
    component: () => import ('../views/NFC-Wallet.vue')
  },
  {
    path: '/NFC-Wallet/Index',
    component: WalletTabBar,
    children: [
      {
        path: '/NFC-Wallet/Index',
        component: () => import ('../views/NFC-Wallet/Index.vue')
      },
      {
        path: '/NFC-Wallet/Transactions',
        component: () => import ('../views/NFC-Wallet/Transactions.vue')
      },
      {
        path: '/NFC-Wallet/Settings',
        component: () => import ('../views/NFC-Wallet/Settings.vue')
      }
    ]
  },
  {
    path: '/NFT-Authentication',
    component: () => import ('../views/NFT-Authentication.vue')
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router
