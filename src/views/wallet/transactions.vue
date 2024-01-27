<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ walletName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <h1>Transactions</h1>
      </div>
    </ion-content>

    <WalletTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { getCurrentWallet } from '@/utils/StorageUtils';
import WalletTabBar from '../../components/WalletTabBar.vue';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

const walletName = ref('');

watch(() => route.path, async (newPath) => {
  if (newPath === '/wallet/transactions') {
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
      return;
    }
    walletName.value = currentWallet.name;
  }
}, { immediate: true });
</script>

<style scoped>
#container {
  margin: 20px;
}
</style>
