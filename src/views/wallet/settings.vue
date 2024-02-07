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
        <div id="myWalletBox">
          <ion-textarea v-model="walletReceiveAddress" label="Receive Address" :label-placement="'stacked'"
            :auto-grow="true" @click="() => copyToClipboard(walletReceiveAddress, true)" :readonly="true"></ion-textarea>
          <ion-textarea v-model="walletStakingAddress" label="Staking Address" :label-placement="'stacked'"
            :auto-grow="true" @click="() => copyToClipboard(walletStakingAddress, true)" :readonly="true"></ion-textarea>
        </div>
        <ion-textarea v-show="isMnemonicVisible" v-model="walletMnemonic" label="Recovery phrase" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(walletMnemonic, true)" :readonly="true"></ion-textarea>
        <div style="text-align: center;margin-top: 20px;">
          <ion-button @click="getRecoveryPhrase">Get Recovery phrase</ion-button>
        </div>
        <div style="text-align: center;">
          <ion-button color="danger" @click="deleteWallet">Delete Wallet</ion-button>
        </div>
      </div>
    </ion-content>

    <NFCModal :is-open="showModal" @cancel="handleModalCancel" @dismiss="handleModalDismiss"></NFCModal>

    <WalletTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton, IonTextarea } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { accessNFCTag, cancelNFCTagReading } from '@/utils/NFCUtils';
import { getCurrentWallet } from '@/utils/StorageUtils';
import { entropyToMnemonic, validateMnemonic, createWallet } from '@/utils/CryptoUtils';
import WalletTabBar from '../../components/WalletTabBar.vue';
import NFCModal from '@/components/NFCModal.vue';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

const walletName = ref('');
const walletMnemonic = ref('');
const walletReceiveAddress = ref('');
const walletStakingAddress = ref('');
const showModal = ref(false);
const isMnemonicVisible = ref(false);

const handleModalCancel = () => {
  showModal.value = false;
  cancelNFCTagReading();
};

const handleModalDismiss = () => {
  showModal.value = false;
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/wallet/settings') {
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
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
    const currentWallet = await getCurrentWallet();
    showModal.value = true;
    const entropy = await accessNFCTag() as string;
    showModal.value = false;
    const mnemonic = entropyToMnemonic(entropy);
    if (!validateMnemonic(mnemonic)) {
      alert('Entropy invalid.');
      return;
    }
    const cryptoWallet = createWallet(mnemonic);
    if (cryptoWallet.baseAddr != currentWallet.baseAddr) {
      alert('Wrong Wallet.');
      return;
    }
    walletMnemonic.value = cryptoWallet.mnemonic;
    isMnemonicVisible.value = true;
  } catch (error) {
    showModal.value = false;
    console.error(error);
    alert(error);
  }
};

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

h1 {
  text-align: center;
}

ion-button[color="danger"] {
  --background: #f1453d;
}
</style>