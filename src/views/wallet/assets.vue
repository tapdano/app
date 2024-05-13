<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button default-href="/my-wallets" color="primary"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ walletName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <div style="text-align: center;margin-top: 20px;">
          <ion-button @click="mintAsset">Mint Asset</ion-button>
        </div>
      </div>
    </ion-content>

    <WalletTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import WalletTabBar from '../../components/WalletTabBar.vue';
import { getCurrentWallet } from '@/utils/StorageUtils';
import { loadWallet } from '@/utils/CryptoUtils';
import { Transaction, ForgeScript } from '@meshsdk/core';
import type { Mint, AssetMetadata } from '@meshsdk/core';

const router = useRouter();
const route = useRoute();
const walletName = ref('');

const mintAsset = async () => {
  try {
    const currentWallet = await getCurrentWallet();
    const wallet = loadWallet(currentWallet.mnemonic);
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
          "soulBoundId": wallet.getBaseAddress().slice(0, 64),
          "description": "This NFT was minted by TapDano (https://tapdano.com)."
        } as AssetMetadata,
        label: '721',
        recipient: wallet.getBaseAddress(),
      } as Mint,
    );

    const unsignedTx = await tx.build();
    const signedTx = await wallet.signTx(unsignedTx);
    const txHash = await wallet.submitTx(signedTx);

    alert('Success! TxID: ' + txHash);
  } catch (error) {
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
</style>
