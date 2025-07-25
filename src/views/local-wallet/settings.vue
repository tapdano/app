<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/local-wallets"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ walletName }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <ion-item>
          <ion-textarea v-model="walletReceiveAddress" label="Receive Address" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(walletReceiveAddress)" :readonly="true"></ion-textarea>
        </ion-item>
        <ion-item>
          <ion-textarea v-model="walletStakingAddress" label="Staking Address" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(walletStakingAddress)" :readonly="true"></ion-textarea>
        </ion-item>
        <ion-item v-if="isMnemonicVisible">
          <ion-textarea v-model="walletMnemonic" label="Recovery phrase" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(walletMnemonic)" :readonly="true"></ion-textarea>
        </ion-item>
        <ion-button @click="getRecoveryPhrase">Get Recovery phrase</ion-button>
        <ion-button color="danger" @click="deleteWallet">Delete Wallet</ion-button>
      </div>
    </ion-content>
    <WalletTabBar />
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonButton, IonTextarea, IonItem } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { getCurrentLocalWallet } from '@/utils/StorageUtils';
import WalletTabBar from '../../components/LocalWalletTabBar.vue';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

const walletName = ref('');
const walletMnemonic = ref('');
const walletReceiveAddress = ref('');
const walletStakingAddress = ref('');
const isMnemonicVisible = ref(false);

watch(() => route.path, async (newPath) => {
  if (newPath === '/local-wallet/settings') {
    const currentWallet = await getCurrentLocalWallet();
    if (currentWallet == null) {
      router.replace('/local-wallets');
      return;
    }
    walletName.value = currentWallet.name;
    walletReceiveAddress.value = currentWallet.baseAddr;
    walletStakingAddress.value = currentWallet.rewardAddr;
    walletMnemonic.value = '';
    isMnemonicVisible.value = false;
  }
}, { immediate: true });

const getRecoveryPhrase = async () => {
  try {
    const currentWallet = await getCurrentLocalWallet();
    walletMnemonic.value = currentWallet.mnemonic;
    isMnemonicVisible.value = true;
  } catch (error) {
    console.error(error);
    alert(error);
  }
};

const deleteWallet = async () => {
  const confirmation = confirm('Are you sure you want to delete this wallet?');
  if (confirmation) {
    let wallets = await storage.get('local-wallets');
    const currentIndex = await storage.get('currentLocalWallet');
    if (wallets && wallets[currentIndex]) {
      wallets.splice(currentIndex, 1);
      await storage.set('local-wallets', wallets);
      await storage.remove('currentLocalWallet');
      router.push('/local-wallets');
    }
  }
};
</script>

<style scoped>
ion-button[color="danger"] {
  --background: #f1453d;
}

ion-button {
  display: block;
  margin-top: 20px;
  height: 60px;
}
</style>