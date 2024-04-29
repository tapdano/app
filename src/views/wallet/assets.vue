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
        <h1>Assets</h1>
        <div style="text-align: center;margin-top: 20px;">
          <ion-button @click="mintAsset">Mint Asset</ion-button>
        </div>
      </div>
    </ion-content>

    <NFCModal :is-open="showModal" @cancel="handleModalCancel" @dismiss="handleModalDismiss"></NFCModal>

    <WalletTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import WalletTabBar from '../../components/WalletTabBar.vue';
import { getCurrentWallet } from '@/utils/StorageUtils';
import { accessNFCTag, cancelNFCTagReading } from '@/utils/NFCUtils';
import { entropyToMnemonic, decryptEntropy, validateMnemonic, createWallet, loadWallet } from '@/utils/CryptoUtils';
import NFCModal from '@/components/NFCModal.vue';
import { Transaction, ForgeScript } from '@meshsdk/core';
import type { Mint, AssetMetadata } from '@meshsdk/core';

const router = useRouter();
const route = useRoute();
const walletName = ref('');
const showModal = ref(false);

const handleModalCancel = () => {
  showModal.value = false;
  cancelNFCTagReading();
};

const handleModalDismiss = () => {
  showModal.value = false;
};

const mintAsset = async () => {
  try {
    const currentWallet = await getCurrentWallet();
    showModal.value = true;
    const encryptedEntropy = await accessNFCTag() as string;
    const entropy = await decryptEntropy(encryptedEntropy, currentWallet.encriptionKey, currentWallet.iv);
    showModal.value = false;
    const mnemonic = entropyToMnemonic(entropy);
    if (!validateMnemonic(mnemonic)) {
      alert('Entropy invalid.');
      return;
    }
    const cryptoWallet = await createWallet(mnemonic);
    if (cryptoWallet.baseAddr != currentWallet.baseAddr) {
      alert('Wrong Wallet.');
      return;
    }

    const wallet = loadWallet(mnemonic);
    const tx = new Transaction({ initiator: wallet });
    tx.mintAsset(
      ForgeScript.withOneSignature(currentWallet.baseAddr),
      {
        assetName: 'TapDano Token',
        assetQuantity: '1',
        metadata: {
          "name": "TapDano Token",
          "image": "ipfs://QmRzicpReutwCkM6aotuKjErFCUD213DpwPq6ByuzMJaua",
          "mediaType": "image/jpg",
          "soulBoundId": cryptoWallet.baseAddr.slice(0, 64),
          "description": "This NFT was minted by TapDano (https://tapdano.com)."
        } as AssetMetadata,
        label: '721',
        recipient: cryptoWallet.baseAddr,
      } as Mint,
    );

    const unsignedTx = await tx.build();
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);

    alert('Success! TxID: ' + txHash);
  } catch (error) {
    showModal.value = false;
    console.error(error);
    alert(error);
  }
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/wallet/assets') {
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
      return;
    }
    walletName.value = currentWallet.name;
    //load here
  }
}, { immediate: true });
</script>

<style scoped>
#container {
  margin: 20px;
}

h1 {
  text-align: center;
}
</style>
