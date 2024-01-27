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
          <ion-input ref="walletAddressRef" v-model="walletAddress" label="My Wallet Address" :label-placement="'stacked'" @click="copyToClipboard"></ion-input>
        </div>
      </div>
    </ion-content>

    <WalletTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonInput, toastController } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import WalletTabBar from '../../components/WalletTabBar.vue';
import PriceChart from '../../components/PriceChart.vue';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

const walletName = ref('');
const walletAddress = ref('');
const walletAddressRef = ref<HTMLElement | null>(null);

const copyToClipboard = async () => {
  if (walletAddressRef.value) {
    const inputElement = (walletAddressRef.value as any).$el.querySelector('input');
    if (inputElement) {
      const textToCopy = inputElement.value;
      try {
        await navigator.clipboard.writeText(textToCopy);
        await showToast('Copied to the clipboard!');
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  }
};

const showToast = async (message: string) => {
  const toast = await toastController.create({
    message: message,
    duration: 2000,
    position: 'top',
  });
  return toast.present();
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/wallet/main') {
    const currentIndex = await storage.get('currentWallet');
    if (currentIndex === null) {
      router.push('/my-wallets');
      return;
    }

    const wallets = await storage.get('wallets');
    if (!wallets || !wallets[currentIndex]) {
      router.push('/my-wallets');
      return;
    }

    walletName.value = wallets[currentIndex].name;
    walletAddress.value = wallets[currentIndex].address;
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
