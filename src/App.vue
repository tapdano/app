<template>
  <ion-app>
    <ion-split-pane content-id="main-content">
      <ion-menu v-if="showMenu" content-id="main-content" type="overlay">
        <ion-content>
          <ion-img src="/logo.png" style="width: 100%; max-width: 50%; height: auto; margin: 0 auto;"></ion-img>
          <ion-list id="inbox-list">
            <h1 class="logo-h1">TapDano</h1>
            <ion-menu-toggle :auto-hide="false" v-for="(p, i) in appPages" :key="i">
              <ion-item @click="selectedIndex = i" router-direction="root" :router-link="p.url" lines="none" :detail="false" class="hydrated" :class="{ selected: selectedIndex === i }">
                <ion-icon aria-hidden="true" slot="start" :ios="p.iosIcon" :md="p.mdIcon"></ion-icon>
                <ion-label>{{ p.title }}</ion-label>
              </ion-item>
            </ion-menu-toggle>
          </ion-list>
        </ion-content>
      </ion-menu>
      <ion-router-outlet id="main-content"></ion-router-outlet>
    </ion-split-pane>
  </ion-app>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue';
import { Storage } from '@ionic/storage';
import {
  IonApp,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonMenuToggle,
  IonRouterOutlet,
  IonSplitPane,
  IonImg
} from '@ionic/vue';
import {
  walletOutline,
  walletSharp,
  cardOutline,
  cardSharp,
  settingsOutline,
  settingsSharp
} from 'ionicons/icons';
import { useRoute } from 'vue-router';

const route = useRoute();

const storage = new Storage();
storage.create();

const appPages = ref([
{
    title: 'My Wallets',
    url: '/my-wallets',
    iosIcon: walletOutline,
    mdIcon: walletSharp,
  },
  {
    title: 'Tag Manager',
    url: '/my-tags',
    iosIcon: cardOutline,
    mdIcon: cardSharp,
  },
  {
    title: 'Settings',
    url: '/settings',
    iosIcon: settingsOutline,
    mdIcon: settingsSharp,
  }
]);

const selectedIndex = ref(0);
const path = '/' + window.location.pathname.split('/')[1];
if (path !== undefined) {
  selectedIndex.value = appPages.value.findIndex((page) => page.url.toLowerCase().indexOf(path.toLowerCase()) != -1);
}
const showMenu = computed(() => route.path != '/demo-auth' && !route.path.includes('/signed') && !route.path.includes('/poa'));

watch(() => route.path, async (newPath) => {
  selectedIndex.value = appPages.value.findIndex((page) => page.url.toLowerCase().indexOf(newPath.toLowerCase()) != -1);
});

onMounted(() => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) loadingScreen.style.display = 'none';
});
</script>

<style scoped>
ion-menu ion-content {
  --background: var(--ion-item-background, var(--ion-background-color, #fff));
}

ion-menu.md ion-content {
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 20px;
  --padding-bottom: 20px;
}

ion-menu.md ion-list#inbox-list {
  border-bottom: 1px solid var(--ion-color-step-150, #d7d8da);
}

ion-menu.md ion-item {
  --padding-start: 10px;
  --padding-end: 10px;
  border-radius: 4px;
}

ion-menu.md ion-item.selected {
  --background: rgba(var(--ion-color-primary-rgb), 0.14);
}

ion-menu.md ion-item.selected ion-icon {
  color: var(--ion-color-primary);
}

ion-menu.md ion-item ion-icon {
  color: #616e7e;
}

ion-menu.md ion-item ion-label {
  font-weight: 500;
}

ion-menu.ios ion-content {
  --padding-bottom: 20px;
}

ion-menu.ios ion-list {
  padding: 20px 0 0 0;
}

ion-menu.ios ion-item {
  --padding-start: 16px;
  --padding-end: 16px;
  --min-height: 50px;
}

ion-menu.ios ion-item.selected ion-icon {
  color: var(--ion-color-primary);
}

ion-menu.ios ion-item ion-icon {
  font-size: 24px;
  color: #73849a;
}

ion-item.selected {
  --color: var(--ion-color-primary);
}

.logo-h1 {
  text-align: center;
  margin: 0 0 40px 0;
}

.list-md {
  padding-top: 0;
}
</style>
