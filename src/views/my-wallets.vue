<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>My Wallets</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <div v-if="wallets.length === 0" class="no-items-message">Start your journey! Create or Restore a Wallet to begin.</div>
          <div v-else>
            <ion-list>
              <ion-item v-for="(wallet, index) in wallets" :key="index" @click="selectWallet(index)">
                {{ (wallet as any).name }}
              </ion-item>
            </ion-list>
          </div>
          <div id="buttons-box">
            <ion-button expand="block" @click="$router.push('/new-wallet')">Create a new wallet</ion-button>
            <ion-button expand="block" @click="$router.push('/restore-wallet')" fill="outline">Restore wallet</ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonButton } from '@ionic/vue';
import { Storage } from '@ionic/storage';

const storage = new Storage();
storage.create();

const router = useRouter();
const route = useRoute();
const wallets = ref([]);
const loading = ref(true);

const load = async () => {
  loading.value = true;
  const storedWallets = await storage.get('wallets') || [];
  wallets.value = storedWallets;
  loading.value = false;
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/my-wallets') {
    await load();
  }
}, { immediate: true });

const selectWallet = async (index: number) => {
  await storage.set('currentWallet', index);
  router.push('/wallet/main');
};
</script>

<style scoped>
#buttons-box {
  margin-top: 20px;
}
ion-button {
  min-height: 50px;
  margin-top: 10px;
}
</style>
