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
      <div v-if="loading" class="loading-message">
        <div class="loading-spinner"></div>
      </div>
      <div v-else>
        <div id="container">
          <div style="text-align: center;margin-top: 20px;">
            <ion-button @click="mintAsset">Mint Asset</ion-button>
          </div>
          <div v-if="assets.length > 0" class="assets-container">
            <div v-for="asset in assets" :key="asset.soulBoundId" class="asset-item">
              <img :src="formatIpfsUrl(asset.image)" :alt="asset.name" class="asset-image" />
              <h2>{{ asset.name }}</h2>
              <p>{{ asset.description }}</p>
            </div>
          </div>
          <div v-else>
            <p>No assets found.</p>
          </div>
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
import { loadWallet, fetchWalletAssets, fetchAssetMetadata } from '@/utils/CryptoUtils';
import { Transaction, ForgeScript } from '@meshsdk/core';
import type { Mint, AssetMetadata } from '@meshsdk/core';

interface Asset {
  soulBoundId: string;
  name: string;
  image: string;
  description: string;
}

const router = useRouter();
const route = useRoute();
const walletName = ref('');
const loading = ref(true);
const assets = ref<Asset[]>([]);

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
    loading.value = true;
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
      return;
    }
    walletName.value = currentWallet.name;
    const walletAssets = await fetchWalletAssets(currentWallet.baseAddr);
    walletAssets.push(walletAssets[0]);
    const assetPromises = walletAssets.map(async (asset) => {
      const metadata = await fetchAssetMetadata(asset.unit);
      return metadata;
    });
    assets.value = await Promise.all(assetPromises);
    loading.value = false;
  }
}, { immediate: true });

const formatIpfsUrl = (url: string) => {
  return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
};
</script>

<style scoped>
ion-button {
  display: block;
  height: 50px;
}

.assets-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 20px;
}

.asset-item {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 20px;
  margin: 10px;
  text-align: center;
  max-width: 200px;
}

.asset-image {
  width: 100%;
  height: auto;
  border-radius: 10px;
}

.asset-item p {
  font-size: 0.8em;
}

.loading-message {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.loading-spinner {
  border: 8px solid #f3f3f3;
  border-radius: 50%;
  border-top: 8px solid #3498db;
  width: 60px;
  height: 60px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>