<template>
  <ion-content class="ion-padding">
    <div id="container">
      <div class="logo-petro"></div>
      <h1>Proof of Attendance</h1>
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <img :src="formatIpfsUrl(asset?.onchain_metadata.image)" :alt="asset?.onchain_metadata.name" class="asset-detail-image" />
          <h2>{{ asset?.onchain_metadata.name }}</h2>
          <p class="small">{{ asset?.fingerprint }}</p>
          <p>Hash: {{ asset?.onchain_metadata.hash }}</p>
          <p>SoulBoundId: {{ asset?.onchain_metadata.soulBoundId }}</p>
          <p>Signature: {{ asset?.onchain_metadata.signature1 ? asset?.onchain_metadata.signature1 + asset?.onchain_metadata.signature2 : 'Virtual' }}</p>
          <p>{{ asset?.onchain_metadata.description }}</p>
          <div class="buttons-box">
            <ion-button @click="viewOnExplorer">View on Explorer</ion-button>
          </div>
        </div>
      </div>
    </div>
  </ion-content>
  <NFCModalPetro ref="nfcModal"></NFCModalPetro>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonContent, IonButton } from '@ionic/vue';
import { createHash } from 'crypto';
import { useRoute } from 'vue-router';
import { fetchAssetFull, getCExplorerURL } from '@/utils/CryptoUtils';
import { hexToBase64, utf8ToHex } from '@/utils/StringUtils';
import { AssetFull } from '@meshsdk/core';
import { formatIpfsUrl } from '@/utils/StringUtils';
import NFCModalPetro from '@/components/NFCModalPetro.vue';

const loading = ref(true);
const asset = ref<AssetFull>();
const nfcModal = ref<InstanceType<typeof NFCModalPetro> | null>(null);

const route = useRoute();

watch(() => route.path, async (newPath) => {
  if (newPath === '/poa-verify') {
    try {
      loading.value = true;
      const code = route.query.code as string;
      const email = route.query.email as string;
      const hash = sha256(code + email);
      const policyId = 'adaf8c08e46ea27b1e2901b648c0c3f0f78626353a4c7fc739ec30c5';
      const unit = policyId + utf8ToHex(hexToBase64(hash));
      const assetFull = await fetchAssetFull(unit);
      asset.value = assetFull;
      console.log(assetFull);
    } catch (error) {
      alert('Confirmação não encontrada, tente novamente em alguns instantes.');
    }
    loading.value = false;
  }
}, { immediate: true });

const viewOnExplorer = async () => {
  const explorerUrl =  await getCExplorerURL() + '/' + asset.value?.fingerprint;
  window.open(explorerUrl, '_blank');
};

function sha256(str: string) {
  const hash = createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
}
</script>

<style scoped>
#container {
  padding: 0;
}

.logo-petro {
  background-image: url('/logo-petrobras.png');
  background-repeat: no-repeat;
  background-color: #FFF;
  background-position: center;
  background-size: 80% auto;
  height: 120px;
  margin: -20px -20px 0 -20px;
}

h1 {
  margin: 30px 0;
}
</style>