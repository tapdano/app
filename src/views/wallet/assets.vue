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
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <div v-if="assets.length > 0" class="assets-container">
            <div v-for="asset in assets" :key="asset.unit" class="asset-item" @click="navigateToAssetDetails(asset)">
              <img :src="formatIpfsUrl(asset.image)" :alt="asset.name" class="asset-image" />
              <h2>{{ asset.name }}</h2>
            </div>
          </div>
          <div v-else class="no-items-message">No assets found!</div>
          <ion-button @click="navigateToMint">Mint SoulBound Asset</ion-button>
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
import { fetchWalletAssets, fetchAssetMetadata } from '@/utils/CryptoUtils';

interface Asset {
  unit: string;
  quantity: string;
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

const navigateToMint = () => {
  router.push('/wallet/assets/mint');
};

const navigateToAssetDetails = (asset: Asset) => {
  router.push({ path: `/wallet/assets/${asset.unit}` });
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
    try {
      const walletAssets = await fetchWalletAssets(currentWallet.baseAddr);
      const wAssets = [];
      for (const asset of walletAssets) {
        try {
          const metadata = await fetchAssetMetadata(asset.unit);
          wAssets.push({
            ...asset,
            ...metadata
          });
        } catch (error) {
        }
      }
      assets.value = wAssets;
    } catch (error) {
    }
    loading.value = false;
  }
}, { immediate: true });

const formatIpfsUrl = (url: string) => {
  return url?.replace('ipfs://', 'https://ipfs.io/ipfs/');
};
</script>

<style scoped>
ion-button {
  display: block;
  height: 50px;
  margin-top: 20px;
}

.assets-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.asset-item {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 20px;
  margin: 10px;
  text-align: center;
  width: calc(50% - 20px);
  cursor: pointer;
}

.asset-image {
  width: 100%;
  height: auto;
  border-radius: 10px;
}
</style>