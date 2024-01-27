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
        <h1>ADA / USD</h1>
        <PriceChart />
        <div id="myWalletBox">
          <ion-input ref="walletAddressRef" v-model="walletAddress" label="My Wallet Address" :label-placement="'stacked'" @click="() => copyToClipboard(walletAddress, true)"></ion-input>
        </div>
      </div>
    </ion-content>

    <WalletTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonInput } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { getCurrentWallet } from '@/utils/StorageUtils';
import WalletTabBar from '../../components/WalletTabBar.vue';
import PriceChart from '../../components/PriceChart.vue';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

const walletName = ref('');
const walletAddress = ref('');
const walletAddressRef = ref<HTMLElement | null>(null);

watch(() => route.path, async (newPath) => {
  if (newPath === '/wallet/main') {
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
      return;
    }
    walletName.value = currentWallet.name;
    walletAddress.value = currentWallet.address;
  }
}, { immediate: true });
</script>

<style scoped>
#container {
  margin: 20px;
}
#myWalletBox{
  margin: 20px 0;
}
</style>
