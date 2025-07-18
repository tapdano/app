<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/my-wallets"></ion-back-button>
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
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonButton, IonTextarea, IonItem } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { getCurrentMyWallet } from '@/utils/StorageUtils';
import WalletTabBar from '../../components/MyWalletTabBar.vue';
import NFCModal from '@/components/NFCModal.vue';
import { calculateSHA256 } from '@/utils/StringUtils';
import { TapDanoService } from 'tapdano';
import { randomBytes } from 'crypto';
import { ec as EC } from 'elliptic';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);
const walletName = ref('');
const walletMnemonic = ref('');
const walletReceiveAddress = ref('');
const walletStakingAddress = ref('');
const isMnemonicVisible = ref(false);

watch(() => route.path, async (newPath) => {
  if (newPath === '/my-wallet/settings') {
    const currentWallet = await getCurrentMyWallet();
    if (currentWallet == null) {
      router.replace('/my-wallets');
      return;
    }
    walletName.value = currentWallet.name;
    walletReceiveAddress.value = currentWallet.baseAddr;
    walletStakingAddress.value = currentWallet.rewardAddr;
    walletMnemonic.value = '';
    isMnemonicVisible.value = false;
  }
}, { immediate: true });

const checkTwoFactor = async (wallet: any) => {
  if (!nfcModal.value) return;
  try {
    const tapDanoService = new TapDanoService();
    nfcModal.value.openModal(1);
    nfcModal.value.onModalClose(() => {
      tapDanoService.cancel();
    });
    const hash = await calculateSHA256(randomBytes(64).toString('hex'));
    const tag = await tapDanoService.signData(hash);
    nfcModal.value.incrementProgress();
    await nfcModal.value.closeModal(500);
    const ec = new EC('secp256k1');
    var key = ec.keyFromPublic(wallet.tag.PublicKey, 'hex');
    return key.verify(hash, tag.LastSignature as string);
  } catch (error) {
    if (error && error != 'canceled') {
      await nfcModal.value.closeModal(0);
      console.error(error);
      alert(error);
    }
    return false;
  }
};

const getRecoveryPhrase = async () => {
  try {
    const currentWallet = await getCurrentMyWallet();
    if (!(await checkTwoFactor(currentWallet))) {
      alert('Error, authentication failed.');
      return;
    }
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
    let wallets = await storage.get('my-wallets');
    const currentIndex = await storage.get('currentMyWallet');
    if (wallets && wallets[currentIndex]) {
      wallets.splice(currentIndex, 1);
      await storage.set('my-wallets', wallets);
      await storage.remove('currentMyWallet');
      router.push('/my-wallets');
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