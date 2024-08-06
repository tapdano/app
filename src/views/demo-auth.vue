<template>
  <ion-content class="ion-padding">
    <div id="container">
      <h1>TapDano - Demo Auth</h1>
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <div v-if="assets.length > 0" class="assets-container">
            <div v-for="asset in assets" :key="asset.unit" class="asset-item">
              <img :src="formatIpfsUrl(asset.image)" :alt="asset.name" class="asset-image" />
              <h2>{{ asset.name }}</h2>
              <ion-button @click="proofSoulBound(asset)">Proof SoulBound</ion-button>
            </div>
          </div>
          <div v-else class="no-items-message">No assets found!</div>
        </div>
      </div>
    </div>
    <ion-modal :is-open="isQRCodeModalOpen" @didDismiss="closeQRCodeModal">
      <div class="wrapper">
        <h1>Oops, your device doesn't have NFC!</h1>
        <p>Please access the link below on a device with NFC to proceed</p>
      </div>
    </ion-modal>
  </ion-content>
</template>
 
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonButtons, IonContent, IonHeader, IonPage, IonModal, IonButton, IonTitle, IonToolbar } from '@ionic/vue';
import { getBlockfrostURL, getBlockfrostAPI, getNetworkName, fetchWalletAssets, fetchAssetMetadata } from '@/utils/CryptoUtils';
import { Storage } from '@ionic/storage';

const Lucid = (window as any).Lucid.Lucid;
const Data = (window as any).Lucid.Data;
const Blockfrost = (window as any).Lucid.Blockfrost;
const Constr = (window as any).Lucid.Constr;

const storage = new Storage();

interface Asset {
  unit: string;
  quantity: string;
  soulBoundId: string;
  name: string;
  image: string;
  description: string;
}

const loading = ref(true);
const assets = ref<Asset[]>([]);
const isQRCodeModalOpen = ref(false);

const proofSoulBound = (asset: Asset) => {
  isQRCodeModalOpen.value = true;
}

function closeQRCodeModal() {
  isQRCodeModalOpen.value = false;
}

onMounted(async () => {
  const lucid = await Lucid.new(
    new Blockfrost(await getBlockfrostURL(), await getBlockfrostAPI()),
    await getNetworkName(),
  );

  const api = await window.cardano.nami.enable();
  lucid.selectWallet(api);

  await storage.create();
  let wAssets = await storage.get('wAssets');
  if (!wAssets) {
    wAssets = [];
    const walletAssets = await fetchWalletAssets(await lucid.wallet.address());
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
    await storage.set('wAssets', wAssets);
  }
  assets.value = wAssets;
  loading.value = false;
});

const formatIpfsUrl = (url: string) => {
  return url?.replace('ipfs://', 'https://ipfs.io/ipfs/');
};
</script>

<style scoped>
h1 {
  text-align: center;
}

.loading-message {
  margin-top: 30px;
}

.assets-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  max-width: 500px;
  margin:0 auto;
}

.asset-item {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 20px;
  margin: 10px;
  text-align: center;
  width: calc(50% - 20px);
}

.asset-image {
  width: 100%;
  height: auto;
  border-radius: 10px;
}

ion-modal {
  --width: fit-content;
  --min-width: 250px;
  --height: fit-content;
  --border-radius: 6px;
  --box-shadow: 0 28px 48px rgba(0, 0, 0, 0.4);
}

ion-modal h1 {
  margin: 20px 20px 10px 20px;
}

ion-modal .wrapper {
  padding: 50px;
}
</style>
