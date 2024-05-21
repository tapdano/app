<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/wallet/assets"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ walletName }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="mint-form">
        <ion-item>
          <ion-label position="floating">Name</ion-label>
          <ion-input v-model="form.name"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Image URL</ion-label>
          <ion-input v-model="form.image"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">SoulBoundId</ion-label>
          <ion-input v-model="form.soulBoundId"></ion-input>
        </ion-item>
        <ion-item>
          <ion-label position="floating">Description</ion-label>
          <ion-input v-model="form.description"></ion-input>
        </ion-item>
        <ion-button @click="mintAsset">Mint Asset</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton } from '@ionic/vue';
import { getCurrentWallet } from '@/utils/StorageUtils';
import { loadWallet } from '@/utils/CryptoUtils';
import { Transaction, ForgeScript } from '@meshsdk/core';
import type { Mint, AssetMetadata } from '@meshsdk/core';

const router = useRouter();
const route = useRoute();
const walletName = ref('');

const form = ref({
  name: 'TapDano Token',
  image: 'ipfs://QmRzicpReutwCkM6aotuKjErFCUD213DpwPq6ByuzMJaua',
  soulBoundId: '',  // Este será preenchido dinamicamente abaixo
  description: 'This NFT was minted by TapDano (https://tapdano.com).'
});

const mintAsset = async () => {
  try {
    const currentWallet = await getCurrentWallet();
    const wallet = loadWallet(currentWallet.mnemonic);
    const tx = new Transaction({ initiator: wallet });
    tx.mintAsset(
      ForgeScript.withOneSignature(currentWallet.baseAddr),
      {
        assetName: form.value.name,
        assetQuantity: '1',
        metadata: {
          "name": form.value.name,
          "image": form.value.image,
          "mediaType": "image/jpg",
          "soulBoundId": form.value.soulBoundId,
          "description": form.value.description
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
  if (newPath === '/wallet/assets/mint') {
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
      return;
    }
    walletName.value = currentWallet.name;
    form.value.soulBoundId = currentWallet.baseAddr.slice(0, 64);
  }
}, { immediate: true });
</script>

<style scoped>
ion-button {
  display: block;
  height: 50px;
  margin-top: 20px;
}

#mint-form {
  padding: 20px;
}
</style>