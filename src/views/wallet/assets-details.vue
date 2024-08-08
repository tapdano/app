<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button color="primary" default-href="/wallet/assets"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ asset?.onchain_metadata.name }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <img :src="formatIpfsUrl(asset?.onchain_metadata.image)" :alt="asset?.onchain_metadata.name" class="asset-detail-image" />
          <h2>{{ asset?.onchain_metadata.name }}</h2>
          <p class="small">{{ asset?.fingerprint }}</p>
          <p>SoulBoundId: {{ asset?.onchain_metadata.soulBoundId }}</p>
          <p>{{ asset?.onchain_metadata.description }}</p>
          <div class="buttons-box">
            <ion-button @click="viewOnExplorer">View on Explorer</ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonBackButton, IonButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { fetchAssetFull, getCExplorerURL } from '@/utils/CryptoUtils';
import { formatIpfsUrl } from '@/utils/StringUtils';
import { AssetFull } from '@meshsdk/core';

const route = useRoute();
const loading = ref(true);
const asset = ref<AssetFull>();

const viewOnExplorer = async () => {
  const explorerUrl =  await getCExplorerURL() + '/asset/' + asset.value?.fingerprint;
  window.open(explorerUrl, '_blank');
};

watch(() => route.path, async (newPath) => {
  if (newPath.startsWith('/wallet/assets/') && newPath != '/wallet/assets/mint') {
    loading.value = true;
    try {
      const unit = route.params.unit as string;
      const assetFull = await fetchAssetFull(unit);
      asset.value = assetFull;
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
}

.small{
  margin-top: -10px;
  font-size: 0.9em;
}

.buttons-box {
  text-align: center;
}

ion-button {
  display: block;
  margin-bottom: 10px;
  height: 40px;
}
</style>