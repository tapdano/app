<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button color="primary" default-href="/local-wallet/assets"></ion-back-button>
        </ion-buttons>
        <ion-title>Mint SoulBound Asset</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <ion-item>
            <ion-input v-model="form.name" label="Name"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="form.image" label="Image URL"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="form.description" label="Description"></ion-input>
          </ion-item>
          <ion-button @click="mintAsset">Write a Tag & Mint</ion-button>
        </div>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal" />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton } from '@ionic/vue';
import { getCurrentLocalWallet } from '@/utils/StorageUtils';
import { loadWallet } from '@/utils/CryptoUtils';
import { Transaction, ForgeScript } from '@meshsdk/core';
import type { Mint, AssetMetadata } from '@meshsdk/core';
import NFCModal from '@/components/NFCModal.vue';
import { TapDanoService } from 'tapdano';
import { hexToBase64 } from '@/utils/StringUtils';

const router = useRouter();
const route = useRoute();
const walletName = ref('');

const form = ref({
  name: 'TapDano Token',
  image: 'ipfs://QmRzicpReutwCkM6aotuKjErFCUD213DpwPq6ByuzMJaua',
  description: 'Minted by TapDano.com'
});

const nfcModal = ref<InstanceType<typeof NFCModal>>();
const loading = ref(false);

const mintAsset = async () => {
  if (!nfcModal.value) return;
  try {
    loading.value = true;
    const currentWallet = await getCurrentLocalWallet();
    const wallet = await loadWallet(currentWallet.mnemonic);
    const tx = new Transaction({ initiator: wallet });
    const forgeScript = ForgeScript.withOneSignature(currentWallet.baseAddr);
    const policyId = tx.getPolicyIdFromForgeScript(forgeScript);

    const tapDanoService = new TapDanoService();
    nfcModal.value.openModal(1);
    nfcModal.value.onModalClose(() => {
      tapDanoService.cancel();
    });
    const tag = await tapDanoService.setPolicyId(policyId);
    nfcModal.value.incrementProgress();
    await nfcModal.value.closeModal(500);    
    
    tx.mintAsset(
      forgeScript,
      {
        assetName: hexToBase64(tag.PublicKey as string),
        assetQuantity: '1',
        metadata: {
          "name": form.value.name,
          "image": form.value.image,
          "mediaType": "image/jpg",
          "soulBoundId1": tag.PublicKey?.slice(0, 64),
          "soulBoundId2": tag.PublicKey?.slice(64, 128),
          "soulBoundId3": tag.PublicKey?.slice(128, 192),
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
    router.back();
  } catch (error) {
    if (error && error != 'canceled') {
      await nfcModal.value.closeModal(0);
      console.error(error);
      alert(error);
    }
  }
  loading.value = false;
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/local-wallet/assets/mint') {
    loading.value = false;
    const currentWallet = await getCurrentLocalWallet();
    if (currentWallet == null) {
      router.replace('/local-wallets');
      return;
    }
    walletName.value = currentWallet.name;
  }
}, { immediate: true });
</script>

<style scoped>
ion-button {
  display: block;
  height: 50px;
  margin-top: 20px;
}

ion-item .input-container {
  display: flex;
  align-items: center;
  width: 100%;
}

ion-item .input-container ion-textarea {
  flex: 1;
  margin-right: 10px;
}

ion-item .input-container ion-button{
  margin: 20px 0;
  height: 40px;
}
</style>