import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import { Storage } from '@ionic/storage';

const storage = new Storage();
storage.create();

const routes: Array<RouteRecordRaw> = [
  {
    path: '/registration',
    component: () => import ('../views/registration.vue')
  },
  {
    path: '/authentication',
    component: () => import ('../views/authentication.vue')
  },
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
    component: () => import ('../views/new.vue'),
    props: { route: 'new' }
  },
  {
    path: '/restore',
    component: () => import ('../views/new.vue'),
    props: { route: 'restore' }
  },
  {
    path: '/settings',
    component: () => import ('../views/settings.vue')
  },
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

  const wallets = await storage.get('wallets') || [];
  if (wallets.length == 0) {
    next('/welcome');
    return;
  }

  const currentIndex = await storage.get('currentWallet');
  if (!(currentIndex === null) && wallets[currentIndex]) {
    next('/wallet/main');
  } else {
    next('/my-wallets');
  }
});

export default router