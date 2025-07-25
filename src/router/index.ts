import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
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
    path: '/new-my-wallet',
    component: () => import ('../views/new-my-wallet.vue'),
    props: { route: 'new' }
  },
  {
    path: '/restore-my-wallet',
    component: () => import ('../views/new-my-wallet.vue'),
    props: { route: 'restore' }
  },
  {
    path: '/my-wallet/main',
    component: () => import ('../views/my-wallet/main.vue')
  },
  {
    path: '/my-wallet/transactions',
    component: () => import ('../views/my-wallet/transactions.vue')
  },
  {
    path: '/my-wallet/assets',
    component: () => import ('../views/my-wallet/assets.vue')
  },
  {
    path: '/my-wallet/assets/:unit',
    component: () => import ('../views/my-wallet/assets-details.vue')
  },
  {
    path: '/my-wallet/settings',
    component: () => import ('../views/my-wallet/settings.vue')
  },
  {
    path: '/local-wallets',
    component: () => import ('../views/local-wallets.vue')
  },
  {
    path: '/new-local-wallet',
    component: () => import ('../views/new-local-wallet.vue'),
    props: { route: 'new' }
  },
  {
    path: '/restore-local-wallet',
    component: () => import ('../views/new-local-wallet.vue'),
    props: { route: 'restore' }
  },
  {
    path: '/local-wallet/main',
    component: () => import ('../views/local-wallet/main.vue')
  },
  {
    path: '/local-wallet/transactions',
    component: () => import ('../views/local-wallet/transactions.vue')
  },
  {
    path: '/local-wallet/assets',
    component: () => import ('../views/local-wallet/assets.vue')
  },
  {
    path: '/local-wallet/assets/mint',
    component: () => import ('../views/local-wallet/assets-mint.vue')
  },
  {
    path: '/local-wallet/assets/:unit',
    component: () => import ('../views/local-wallet/assets-details.vue')
  },
  {
    path: '/local-wallet/settings',
    component: () => import ('../views/local-wallet/settings.vue')
  },
  {
    path: '/my-tags',
    component: () => import ('../views/my-tags.vue')
  },
  {
    path: '/choose-tag',
    component: () => import ('../views/choose-tag.vue')
  },
  {
    path: '/new-tag',
    component: () => import ('../views/new-tag.vue'),
    props: { route: 'new' }
  },
  {
    path: '/restore-tag',
    component: () => import ('../views/new-tag.vue'),
    props: { route: 'restore' }
  },
  {
    path: '/tag/main',
    component: () => import ('../views/tag/main.vue')
  },
  {
    path: '/tag/signing',
    component: () => import ('../views/tag/signing.vue')
  },
  {
    path: '/tag/settings',
    component: () => import ('../views/tag/settings.vue')
  },
  {
    path: '/settings',
    component: () => import ('../views/settings.vue')
  },
  {
    path: '/test',
    component: () => import ('../views/test.vue')
  },
  {
    path: '/demo-auth',
    component: () => import ('../views/demo-auth.vue')
  },
  {
    path: '/signed',
    component: () => import ('../views/signed.vue')
  },
  {
    path: '/demo',
    component: () => import ('../views/demo.vue')
  },
  {
    path: '/dash',
    component: () => import ('../views/dash.vue')
  },
  {
    path: '/poa',
    component: () => import ('../views/poa.vue')
  },
  {
    path: '/poa-virtual',
    component: () => import ('../views/poa.vue')
  },
  {
    path: '/poa-verify',
    component: () => import ('../views/poa-verify.vue')
  }
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
});

router.beforeEach(async (to, from, next) => {
  /*
  if (to.path === '/registration') {
    next();
    return;
  }

  const registrationInfo = await storage.get('registrationInfo') || null;
  if (!registrationInfo) {
    next('/registration');
    return;
  }

  if (to.path !== '/authentication') {
    const authenticationInfo = JSON.parse(sessionStorage.getItem('authenticationInfo') || 'null');
    if (!authenticationInfo) {
      next('/authentication');
      return;
    }
  }
  */
 
  if (to.path !== '/') {
    next();
    return;
  }

  const wallets = await storage.get('my-wallets') || [];
  if (wallets.length == 0) {
    next('/welcome');
    return;
  }

  const currentIndex = await storage.get('currentMyWallet');
  if (!(currentIndex === null) && wallets[currentIndex]) {
    next('/my-wallet/main');
  } else {
    next('/my-wallets');
  }
});

export default router