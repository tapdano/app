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
        <div v-if="qrCodeUrl">
          <img :src="qrCodeUrl" alt="QR Code" />
          <ion-textarea v-model="qrCodeLink" :auto-grow="true" @click="() => copyToClipboard(qrCodeLink as string)" :readonly="true"></ion-textarea>
        </div>
      </div>
    </ion-modal>
    <ion-modal :is-open="isResultModalOpen" @didDismiss="closeResultModal">
      <div class="wrapper">
        <h1>Signature Received</h1>
        <ion-item>
          <ion-textarea v-model="resultData.messageHash" label="Message Hash" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(resultData.messageHash)" :readonly="true"></ion-textarea>
        </ion-item>
        <ion-item>
          <ion-textarea v-model="resultData.publicKey" label="Public Key" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(resultData.publicKey)" :readonly="true"></ion-textarea>
        </ion-item>
        <ion-item>
          <ion-textarea v-model="resultData.signature" label="Signature" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(resultData.signature)" :readonly="true"></ion-textarea>
        </ion-item>
        <ion-item>
          <ion-textarea v-model="resultData.policyId" label="Policy ID" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(resultData.policyId)" :readonly="true"></ion-textarea>
        </ion-item>
        <ion-item>
          <ion-textarea v-model="resultData.soulBoundId" label="SoulBound ID" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(resultData.soulBoundId)" :readonly="true"></ion-textarea>
        </ion-item>
        <ion-item>
          <p>
            isSignatureValid: 
            <ion-icon :icon="resultData.isSignatureValid ? checkmarkCircle : closeCircle" :color="resultData.isSignatureValid ? 'success' : 'danger'"></ion-icon>
          </p>
        </ion-item>
        <ion-item>
          <p>
            isMatchSoulBoundId: 
            <ion-icon :icon="resultData.isMatchSoulBoundId ? checkmarkCircle : closeCircle" :color="resultData.isMatchSoulBoundId ? 'success' : 'danger'"></ion-icon>
          </p>
        </ion-item>
      </div>
    </ion-modal>
  </ion-content>
</template>
 
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonContent, IonModal, IonButton, IonItem, IonTextarea, IonIcon } from '@ionic/vue';
import { getBlockfrostURL, getBlockfrostAPI, getNetworkName, fetchWalletAssets, fetchAssetMetadata } from '@/utils/CryptoUtils';
import { Storage } from '@ionic/storage';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { calculateSHA256 } from '@/utils/StringUtils';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';

const Lucid = (window as any).Lucid.Lucid;
const Blockfrost = (window as any).Lucid.Blockfrost;

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
const isResultModalOpen = ref(false);
const qrCodeUrl = ref<string | null>(null);
const qrCodeLink = ref<string | undefined>(undefined);
const lastAsset = ref<Asset>();
const resultData = ref({
  messageHash: '',
  publicKey: '',
  signature: '',
  policyId: '',
  soulBoundId: '',
  isMatchSoulBoundId: false,
  isSignatureValid: false,
});

let channel: any = null;

const proofSoulBound = async (asset: Asset) => {
  lastAsset.value = asset;
  const challenge = await generateRandom256BitHex();
  const message = {
    action: 'AUTH',
    challenge: challenge
  };
  const messageString = JSON.stringify(message);
  const messageHash = await calculateSHA256(JSON.stringify(message, null, 4));

  const encodedMessage = encodeURIComponent(messageString);
  let url = new URL(location.href);
  
  const clientUrl = encodeURIComponent(url.protocol + '//' + url.host + '/signed');
  const link = url.protocol + '//' + url.host + `/tag/signing?message=${encodedMessage}&client=${clientUrl}`;
  const linkQr = url.protocol + '//' + url.host + `/tag/signing` + encodeURIComponent(`?message=${messageString}&client=${url.protocol + '//' + url.host + '/signed'}`);

  qrCodeLink.value = link;
  qrCodeUrl.value = `https://quickchart.io/qr?text=${linkQr}`;
  isQRCodeModalOpen.value = true;
  await waitSignResponse(messageHash);
}

async function waitSignResponse(messageHash: string) {
  await channel.subscribe(messageHash, async (message: any) => {
    isQRCodeModalOpen.value = false;
    isResultModalOpen.value = true;
    const data = JSON.parse(message.data);
    const isMatchSoulBoundId = data.publicKey == lastAsset.value?.soulBoundId;
    const isSignatureValid = await (window as any).nobleEd25519.verify(data.signature, data.messageHash, data.publicKey);

    resultData.value = {
      messageHash: data.messageHash,
      publicKey: data.publicKey,
      signature: data.signature,
      policyId: data.policyId,
      soulBoundId: lastAsset.value?.soulBoundId || '',
      isMatchSoulBoundId,
      isSignatureValid,
    };
    await storage.set('SignResponse', JSON.stringify(resultData.value));

    await channel.unsubscribe(messageHash);
  });
}

function closeQRCodeModal() {
  isQRCodeModalOpen.value = false;
}

function closeResultModal() {
  isResultModalOpen.value = false;
}

onMounted(async () => {
  const lucid = await Lucid.new(
    new Blockfrost(await getBlockfrostURL(), await getBlockfrostAPI()),
    await getNetworkName(),
  );

  const api = await window.cardano.nami.enable();
  lucid.selectWallet(api);

  await storage.create();
  let wAssets = null;
  //wAssets = await storage.get('wAssets');
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

  const ably = new (window as any).Ably.Realtime('iTZ0XA.06wqDQ:ZI6bW8YuX0nbFqg522l6iQ1N6u382WlHzczw4M2_fe8');
  await ably.connection.once('connected');
  channel = ably.channels.get('tapdano');

  //resultData.value = JSON.parse(await storage.get('SignResponse'));
  //isResultModalOpen.value = true;
});

const formatIpfsUrl = (url: string) => {
  return url?.replace('ipfs://', 'https://ipfs.io/ipfs/');
};

async function generateRandom256BitHex() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
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
  margin: 0 0 20px 0;
}

ion-modal p {
  text-align: center;
}

ion-textarea {
  max-width: 300px;
  margin: 0 auto;
  font-size: 10px;
}

ion-modal .wrapper {
  padding: 30px;
  border-radius: 20px;
}

ion-modal img {
  display: block;
  margin: 20px auto;
  width: 250px;
  height: 250px;
  background-color: #FFF;
  padding: 10px;
  border-radius: 20px;
}

ion-modal a {
  text-align: center;
  display: block;
  margin-top: 10px;
  color: #007bff;
  text-decoration: none;
}
</style>
