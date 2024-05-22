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
          <ion-input v-model="form.name" label="Name"></ion-input>
        </ion-item>
        <ion-item>
          <ion-input v-model="form.image" label="Image URL"></ion-input>
        </ion-item>
        <ion-item>
          <ion-input v-model="form.description" label="Description"></ion-input>
        </ion-item>
        <ion-item>
          <div class="input-container">
            <!--<ion-input v-model="form.soulBoundId" label="SoulBoundId"></ion-input>-->
            <ion-textarea v-model="form.soulBoundId" label="SoulBoundId" :label-placement="'stacked'" :auto-grow="true"></ion-textarea>
            <ion-button @click="scanTag">Scan a Tag</ion-button>
          </div>
        </ion-item>
        <ion-button @click="mintAsset">Mint Asset</ion-button>
      </div>
      <NFCModal ref="nfcModal" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonTextarea, IonInput, IonButton } from '@ionic/vue';
import { getCurrentWallet } from '@/utils/StorageUtils';
import { loadWallet } from '@/utils/CryptoUtils';
import { Transaction, ForgeScript } from '@meshsdk/core';
import type { Mint, AssetMetadata } from '@meshsdk/core';
import NFCModal from '@/components/NFCModal.vue';
import { TagParser } from '@/utils/TagParser';

const router = useRouter();
const route = useRoute();
const walletName = ref('');

const form = ref({
  name: 'TapDano Token',
  image: 'ipfs://QmRzicpReutwCkM6aotuKjErFCUD213DpwPq6ByuzMJaua',
  soulBoundId: '',
  description: 'Minted by TapDano.com'
});

const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const scanTag = async () => {
  try {
    if (nfcModal.value) {
      const tagContent = await nfcModal.value.ExecuteCommand();
      const tag = new TagParser(tagContent);
      form.value.soulBoundId = tag.PublicKey || '';
    }
  } catch (error) {
    console.error(error);
    alert(error);
  }
};

const mintAsset = async () => {
  try {
    const currentWallet = await getCurrentWallet();
    const wallet = loadWallet(currentWallet.mnemonic);
    const tx = new Transaction({ initiator: wallet });
    const forgeScript = ForgeScript.withOneSignature(currentWallet.baseAddr);
    tx.mintAsset(
      forgeScript,
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