<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button color="primary" default-href="/wallet/assets"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ asset.name }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <img :src="formatIpfsUrl(asset.image)" :alt="asset.name" class="asset-detail-image" />
          <h2>{{ asset.name }}</h2>
          <p>ID: {{ asset.unit }}</p>
          <p>Quantity: {{ asset.quantity }}</p>
          <p>SoulBoundId: {{ asset.soulBoundId }}</p>
          <p>{{ asset.description }}</p>
          <ion-button @click="viewOnExplorer">View on Explorer</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonBackButton, IonButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { fetchAssetFull } from '@/utils/CryptoUtils';

const route = useRoute();
const loading = ref(true);
const asset = ref(JSON.parse(route.query.asset as string));

const formatIpfsUrl = (url: string) => {
  return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
};

const viewOnExplorer = () => {
  const explorerUrl = `https://cexplorer.io/asset/${asset.value.fingerprint}`;
  window.open(explorerUrl, '_blank');
};

watch(() => route.path, async (newPath) => {
  if (newPath.startsWith('/wallet/assets/') && newPath != '/wallet/assets/mint') {
    loading.value = true;
    try {
      const assetFull = await fetchAssetFull(asset.value.unit);
      asset.value.fingerprint = assetFull.fingerprint;
    } catch (error) {
      console.log(error);
      alert(error);
    }
    loading.value = false;
  }
}, { immediate: true });
</script>

<style scoped>
.asset-detail-image {
  width: 100%;
  height: auto;
  border-radius: 10px;
  margin-bottom: 20px;
}
</style>