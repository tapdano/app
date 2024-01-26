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
        <h1>Settings</h1>
        <ion-input ref="walletMnemonicRef" v-model="walletMnemonic" label="Mnemonic" :label-placement="'stacked'" @click="copyToClipboard"></ion-input>
        <ion-button color="danger" @click="deleteWallet">
          Delete Wallet
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton, IonInput } from '@ionic/vue';
import { toastController } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

const walletName = ref('');
const walletMnemonic = ref('');
const walletMnemonicRef = ref<HTMLElement | null>(null);

const copyToClipboard = async () => {
  if (walletMnemonicRef.value) {
    const inputElement = (walletMnemonicRef.value as any).$el.querySelector('input');
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
  if (newPath === '/wallet/settings') {
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
    walletMnemonic.value = wallets[currentIndex].wallet.mnemonic;
  }
}, { immediate: true });

const deleteWallet = async () => {
  const confirmation = confirm('Are you sure you want to delete this wallet?');
  if (confirmation) {
    let wallets = await storage.get('wallets');
    const currentIndex = await storage.get('currentWallet');
    if (wallets && wallets[currentIndex]) {
      wallets.splice(currentIndex, 1);
      await storage.set('wallets', wallets);
      await storage.remove('currentWallet');
      router.push('/my-wallets');
    }
  }
};
</script>

<style scoped>
#container {
  margin: 20px;
}

ion-button[color="danger"] {
  --background: #f1453d;
}
</style>