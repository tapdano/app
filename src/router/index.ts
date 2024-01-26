import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import WalletTabBar from '../components/WalletTabBar.vue';

import { Storage } from '@ionic/storage';

const storage = new Storage();
storage.create();

const routes: Array<RouteRecordRaw> = [
  {
    path: '/welcome',
    component: () => import ('../views/welcome.vue')
  },
  {
    path: '/my-wallets',
    component: () => import ('../views/my-wallets.vue')
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
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach(async (to, from, next) => {
  if (to.path === '/') {
    const wallets = await storage.get('wallets') || [];
    if (wallets.length > 0) {
      const currentIndex = await storage.get('currentWallet');
      if (!(currentIndex===null) && wallets[currentIndex]) {
        next('/wallet/main');
      } else {
        next('/my-wallets');
      }
    } else {
      next('/welcome');
    }
  } else {
    next();
  }
});

export default router
