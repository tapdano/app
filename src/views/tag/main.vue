<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/my-tags"></ion-back-button>
        </ion-buttons>
        <ion-title>Tag</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <div v-if="loading">
          <p>Loading...</p>
        </div>
        <div v-else id="assetsArea">
          <h1>Balance</h1>
          <p>{{ adaBalance }} ADA</p>
          <div v-if="tagAssets.length > 0" class="assets-container">
            <div v-for="asset in tagAssets" :key="asset.unit" class="asset-item">
              <img :src="formatIpfsUrl(asset.image)" :alt="asset.name" class="asset-image" />
              <h2>{{ asset.name }}</h2>
              <p>Quantity: {{ asset.quantity }}</p>
              <p>SoulBound: <ion-icon :icon="(asset.soulBoundId == tagInfo?.PublicKey || (asset.tagId1 + asset.tagId2 + asset.tagId3) == tagInfo?.PublicKey) ? checkmarkCircle : closeCircle" :color="(asset.soulBoundId == tagInfo?.PublicKey || (asset.tagId1 + asset.tagId2 + asset.tagId3) == tagInfo?.PublicKey) ? 'success' : 'danger'"></ion-icon></p>
            </div>
          </div>
          <ion-button @click="openDepositModal" color="primary" expand="block">Deposit</ion-button>
          <ion-button @click="openWithdrawModal" color="primary" expand="block">Withdraw</ion-button>
        </div>
        <ion-list>
          <ion-item>
            <ion-label>
              <h3>PublicKey</h3>
              <p>{{ tagInfo?.PublicKey }}</p>
            </ion-label>
            <ion-button fill="clear" slot="end" @click="() => copyToClipboard(tagInfo?.PublicKey || '')">
              <ion-icon slot="icon-only" :icon="copyOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
        <ion-accordion-group>
          <ion-accordion value="moreInfo">
            <ion-item slot="header" lines="none">
              <ion-label>
                <h3>More Info</h3>
              </ion-label>
            </ion-item>
            <ion-list slot="content">
              <div class="wrapper">
                <ion-item v-for="(value, key) in tagInfo" :key="key">
                  <ion-label>
                    <h3>{{ key }}</h3>
                    <p>{{ value }}</p>
                  </ion-label>
                  <ion-button fill="clear" slot="end" @click="() => copyToClipboard(value as string)">
                    <ion-icon slot="icon-only" :icon="copyOutline"></ion-icon>
                  </ion-button>
                </ion-item>
              </div>
            </ion-list>
          </ion-accordion>
        </ion-accordion-group>
      </div>
      <ion-modal :is-open="isWithdrawModalOpen" @didDismiss="closeWithdrawModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Withdraw</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeWithdrawModal">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="wrapper">
            <ion-list>
              <ion-item>
                <ion-select label="Select the Wallet" v-model="withdrawWallet">
                  <ion-select-option v-for="wallet in wallets" :key="(wallet as any).name" :value="wallet">
                    {{ (wallet as any).name }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <ion-button expand="block" @click="withdrawFromWallet(withdrawWallet)">Withdraw</ion-button>
            </ion-list>
          </div>
        </ion-content>
      </ion-modal>
      <ion-modal :is-open="isDepositModalOpen" @didDismiss="closeDepositModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Deposit</ion-title>
            <ion-buttons slot="end">
              <ion-button @click="closeDepositModal">Close</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <div class="wrapper">
            <ion-list>
              <ion-item>
                <ion-select label="Select the Wallet" v-model="depositWallet" @ionChange="loadWalletAssets((depositWallet as any).baseAddr)">
                  <ion-select-option v-for="wallet in wallets" :key="(wallet as any).name" :value="wallet">
                    {{ (wallet as any).name }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item v-if="showDepositWalletBalance">
                <ion-input type="number" v-model.number="depositAmount" :label="`ADA Amount (Balance: ${depositWalletBalance})`" label-placement="floating"></ion-input>
              </ion-item>
              <ion-item v-for="asset in walletAssets" :key="asset.unit">
                <template v-if="parseInt(asset.quantity) > 1">
                  <ion-input type="number" v-model.number="asset.amount" :max="asset.quantity" :label="`TOKEN: ${ asset.name } (Balance: ${ asset.quantity })`" label-placement="floating"></ion-input>
                </template>
                <template v-else>
                  <ion-checkbox v-model="asset.selected">
                    NFT: {{ asset.name }}
                  </ion-checkbox>
                </template>
              </ion-item>
              <ion-button expand="block" :disabled="!showDepositWalletBalance" @click="depositFromWallet(depositWallet)">Deposit</ion-button>
            </ion-list>
          </div>
        </ion-content>
      </ion-modal>
    </ion-content>
    <TagTabBar />
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonCheckbox, IonAccordionGroup, IonAccordion, IonSelect, IonSelectOption, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonList, IonLabel, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonModal, IonInput } from '@ionic/vue';
import { getCurrentTag, getLocalWallets } from '@/utils/StorageUtils';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { Storage } from '@ionic/storage';
import { getBlockfrostURL, getBlockfrostAPI, getNetworkName, fetchWalletAssets, fetchAssetMetadata, fetchAccountInfo } from '@/utils/CryptoUtils';
import TagTabBar from '@/components/TagTabBar.vue';
import { copyOutline } from 'ionicons/icons';
import NFCModal from '@/components/NFCModal.vue';
import { TagParser, TapDanoService } from 'tapdano';
import { utf8ToHex, formatIpfsUrl, calculateSHA256FromHex } from '@/utils/StringUtils';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';

interface Asset {
  unit: string;
  quantity: string;
  soulBoundId: string;
  name: string;
  image: string;
  description: string;
  amount: number;
  selected: boolean;
  tagId1: string;
  tagId2: string;
  tagId3: string;
}

const Lucid = (window as any).Lucid.Lucid;
const Data = (window as any).Lucid.Data;
const Blockfrost = (window as any).Lucid.Blockfrost;
const Constr = (window as any).Lucid.Constr;

const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const IS_CACHE_ON = false;

const router = useRouter();
const route = useRoute();
const storage = new Storage();
const tagInfo = ref<TagParser | null>(null);
const adaBalance = ref(0);
const depositWalletBalance = ref(0);
const loading = ref(true);
const showDepositWalletBalance = ref(false);
const isWithdrawModalOpen = ref(false);
const isDepositModalOpen = ref(false);
const depositAmount = ref<number>(0);
const wallets = ref([]);
const depositWallet = ref(null);
const withdrawWallet = ref(null);
const walletAssets = ref<Asset[]>([]);
const tagAssets = ref<Asset[]>([]);

const validador = {
  type: "PlutusV2",
  script: "5903f901000032323232323232322323223225333007323253330093370e900118051baa0011323232330010013758602260246024602460246024602460246024601c6ea8c008c038dd50031129998080008a50132533300e323337686eb8c014c044dd50071b9232323371400200666e28004dcc19191919191b99333001001300e30173754018910100222533333301e00213232323232323300b00200133714911012800002533301b337100069007099b80483c80400c54ccc06ccdc4001a410004266e00cdc0241002800690068b299980e800899b8a4881035b5d2900004133714911035b5f2000375c603e604066600e0026603c980102415d003301e375266e2922010129000044bd70111981026103422c200033020375266601001000466e28dd718090009bae30150014bd701bac301b002375a60320026466ec0dd4180c8009ba7301a0013754004264a666036002266e292201027b7d00002133714911037b5f2000375c603a603c64646600200200644a66603c0022006266446604298103422c2000330213752666012012603c00466e292201023a2000333009009301f002337146eb8c04c004dd7180b000a5eb80c080004cc008008c084004cc0713010342207d003301c375200497ae03756004264a666036002266e29221025b5d00002133714911035b5f2000375c603a603c66600a00266038980102415d003301c375200497ae0223301e4c0103422c20003301e375266600c00c00466e28dd718080009bae30130014bd701bac002133005375a0040022646466e292210268270000132333001001337006e34009200133714911012700003222533301b3371000490000800899191919980300319b8000548004cdc599b80002533301e33710004900a0a40c02903719b8b33700002a66603c66e2000520141481805206e0043370c004901019b8300148080cdc70020011bae002222323300100100422533301b0011004133003301d00133002002301e001223233001001003225333016301400113371491101300000315333016337100029000099b8a489012d003300200233702900000089980299b8400148050cdc599b803370a002900a240c00066002002444a66602666e2400920001001133300300333708004900a19b8b3370066e14009201448180004dd7180298089baa30053011375400c6eb8c014c044dd50059bae301300214a2266006006002602600246020002601c60166ea800458c004c028dd50011180698070008a4c26caca66600a6006600c6ea80044c8c94ccc028c03400852616375c6016002600e6ea8004594ccc00cc004c010dd5001099191919299980518068010a4c2c6eb8c02c004c02c008dd7180480098029baa00216370e90002b9a5573aaae7955cfaba05742ae895d21",
};

let lucid: any;
let contractAddress: any;
let isInitialzied = false;

async function initialize() {
  await storage.create();
  lucid = await Lucid.new(
    new Blockfrost(await getBlockfrostURL(), await getBlockfrostAPI()),
    await getNetworkName(),
  );
  contractAddress = lucid.utils.validatorToAddress(validador);
}

watch(() => route.path, async (newPath) => {
  if (newPath === '/tag/main') {
    if (!isInitialzied) {
      isInitialzied = true;
      await initialize();
    }
    const currentTag = await getCurrentTag();
    if (currentTag == null) {
      router.push('/my-tags');
      return;
    }
    tagInfo.value = currentTag;
    await loadTagAssets(currentTag.PublicKey);
    loading.value = false;
  }
}, { immediate: true });

async function loadTagAssets(publicKey: string) {
  adaBalance.value = 0;
  try {
    let adaBalanceValue = null;
    if (IS_CACHE_ON) adaBalanceValue = await storage.get('adaBalanceValue');
    if (!adaBalanceValue) {
      const allScriptUtxo = await lucid.utxosAt(contractAddress);
      const utxoForTag = allScriptUtxo.filter((utxo: any) => {
        return utxo.datum && utxo.datum.toUpperCase().indexOf(compressPublicKey(publicKey).toUpperCase()) == 10;
      });
      adaBalanceValue = utxoForTag.reduce((sum: any, utxo: any) => sum + parseInt(utxo.assets.lovelace), 0) / 1e6;
      const totalAssets = utxoForTag.reduce((acc: any, utxo: any) => {
        for (const [asset, quantity] of Object.entries(utxo.assets)) {
          if (!acc[asset]) {
            acc[asset] = 0n;
          }
          acc[asset] += BigInt(quantity as any);
        }
        return acc;
      }, {});
      const totalAssetsArray = Object.entries(totalAssets).map(([asset, quantity]) => ({
        asset,
        quantity: quantity
      }));
      const tempTagAssets = [];
      for (const asset of totalAssetsArray) {
        try {
          if (asset.asset == 'lovelace') continue;
          const metadata = await fetchAssetMetadata(asset.asset);
          tempTagAssets.push({
            ...asset,
            ...metadata
          });
        } catch (error) {
        }
      }
      tagAssets.value = tempTagAssets;
      await storage.set('adaBalanceValue', JSON.stringify(adaBalanceValue));
    }
    adaBalance.value = adaBalanceValue;
  } catch (error) {
    console.error(error);
  }
}

async function loadWalletAssets(address: string) {
  walletAssets.value = [];
  showDepositWalletBalance.value = false;
  let wAssets = null;
  if (IS_CACHE_ON) wAssets = await storage.get('wAssets-' + address);
  if (!wAssets) {
    wAssets = [];
    const allWalletAssets = await fetchWalletAssets(address);
    for (const asset of allWalletAssets) {
      try {
        const metadata = await fetchAssetMetadata(asset.unit);
        wAssets.push({
          ...asset,
          ...metadata,
          amount: 0,
          selected: false
        });
      } catch (error) {
      }
    }
    await storage.set('wAssets-' + address, wAssets);
  }
  const accountInfo = await fetchAccountInfo(address);
  depositWalletBalance.value = accountInfo.balance / 1000000;
  showDepositWalletBalance.value = true;
  walletAssets.value = wAssets;
}

async function withdrawFromWallet(wallet: any) {
  if (nfcModal.value == null) return;
  try {
    if (!wallet) {
      alert('Select the Wallet');
      return;
    }
    closeWithdrawModal();
    lucid.selectWalletFromSeed(wallet.mnemonic);
    const publicKeyHash = lucid.utils.getAddressDetails(await lucid.wallet.address()).paymentCredential?.hash;
    const currentTag = await getCurrentTag();
    let utxoToCollect = [];
    const allScriptUtxo = await lucid.utxosAt(contractAddress);
    for (let i = 0; i < allScriptUtxo.length; i++) {
      if (allScriptUtxo[i].datum || allScriptUtxo[i].datumHash) {
        if (allScriptUtxo[i].datum.toUpperCase().indexOf(compressPublicKey(currentTag.PublicKey).toUpperCase()) == 10) {
          utxoToCollect.push(allScriptUtxo[i]);
          if (utxoToCollect.length === 20) break;
        }
      }
    }
    if (utxoToCollect.length === 0) {
      alert('No assets found');
      return;
    }

    const tapDanoService = new TapDanoService();
    nfcModal.value.openModal(utxoToCollect.length);
    nfcModal.value.onModalClose(() => {
      tapDanoService.cancel();
    });

    let tx = await lucid.newTx();
    for (let i = 0; i < utxoToCollect.length; i++) {
      const message = utxoToCollect[i].txHash + utf8ToHex(String(utxoToCollect[i].outputIndex)) + publicKeyHash;
      const tag = await tapDanoService.signData(await calculateSHA256FromHex(message));
      nfcModal.value.incrementProgress();
      const redeemer = Data.to(new Constr(0, [convertSignatureToRaw(tag.LastSignature as string)]));
      tx = tx.collectFrom([utxoToCollect[i]], redeemer);
    }
    await nfcModal.value.closeModal(500);
    tx = tx.addSigner(await lucid.wallet.address()).attachSpendingValidator(validador);
    tx = await tx.complete();
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log('TX:' + txHash);
    alert('Success!');
  } catch (error) {
    if (error && error != 'canceled') {
      await nfcModal.value.closeModal(0);
      console.error(error);
      alert(error);
    }
  }
}

async function depositFromWallet(wallet: any) {
  try {
    if (!wallet) {
      alert('Select the Wallet');
      return;
    }
    if (depositAmount.value == 0) {
      alert('Enter the ADA Amount');
      return;
    }

    closeDepositModal();
    lucid.selectWalletFromSeed(wallet.mnemonic);
    const currentTag = await getCurrentTag();
    const datum = Data.to(new Constr(0, [compressPublicKey(currentTag.PublicKey), "00"]));
    let tx = await lucid.newTx();

    tx = tx.payToContract(contractAddress, { inline: datum }, {
      lovelace: BigInt(depositAmount.value) * 1000000n,
    });

    const selectedAssets = walletAssets.value
      .filter((asset) => parseInt(asset.quantity) > 1 && asset.amount > 0 || asset.selected)
      .map((asset) => ({ id: asset.unit, amount: asset.amount || 1 }));

    for (let i = 0; i < selectedAssets.length; i++) {
      tx = tx.payToContract(contractAddress, { inline: datum }, {
        [selectedAssets[i].id]: BigInt(selectedAssets[i].amount)
      });
    }

    tx = await tx.complete();
    console.log('tx', tx);

    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log('TX:' + txHash);
    alert('Success!');
  } catch (error) {
    console.error(error);
  }
}

async function loadWallets() {
  wallets.value = await getLocalWallets();
}

function openWithdrawModal() {
  loadWallets();
  withdrawWallet.value = null;
  isWithdrawModalOpen.value = true;
}

function openDepositModal() {
  loadWallets();
  depositWallet.value = null;
  depositAmount.value = 0;
  walletAssets.value = [];
  depositWalletBalance.value = 0;
  showDepositWalletBalance.value = false;
  isDepositModalOpen.value = true;
}

function closeWithdrawModal() {
  isWithdrawModalOpen.value = false;
}

function closeDepositModal() {
  isDepositModalOpen.value = false;
}

function convertSignatureToRaw(derSignatureHex: string) {
  // Validate that the input is a hex string
  if (!/^[0-9a-fA-F]+$/.test(derSignatureHex)) {
      throw new Error('Invalid hex string for DER-encoded signature.');
  }
  // Parse the DER-encoded signature
  const { rBytes, sBytes } = parseDerSignature(derSignatureHex);
  // Convert r and s to BigInt
  const rBigInt = BigInt('0x' + rBytes.toString('hex'));
  let sBigInt = BigInt('0x' + sBytes.toString('hex'));
  // Adjust s to be the lower value if necessary (LOW_S requirement)
  sBigInt = ensureLowS(sBigInt);
  // Convert r and s back to 32-byte buffers
  const rBuffer = bigIntToBuffer(rBigInt);
  const sBuffer = bigIntToBuffer(sBigInt);
  // Concatenate r and s to form the raw signature
  const rawSignature = Buffer.concat([rBuffer, sBuffer]);
  // Return the raw signature as a 128-character hex string
  return rawSignature.toString('hex');
}

function parseDerSignature(derSignatureHex: string) {
  const data = Buffer.from(derSignatureHex, 'hex');
  let offset = 0;
  // Check for the SEQUENCE tag (0x30)
  if (data[offset++] !== 0x30) {
      throw new Error('Invalid DER signature format: Expected SEQUENCE (0x30).');
  }
  // Get the length of the sequence
  let length = data[offset++];
  if (length & 0x80) { // Long-form length
      const lengthBytes = length & 0x7f;
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
          length = (length << 8) | data[offset++];
      }
  }
  const seqEnd = offset + length;
  // Parse r
  const { integer: rBytes, offset: newOffset1 } = parseDerInteger(data, offset);
  offset = newOffset1;
  // Parse s
  const { integer: sBytes, offset: newOffset2 } = parseDerInteger(data, offset);
  offset = newOffset2;
  // Ensure we've reached the end of the sequence
  if (offset !== seqEnd) {
      throw new Error('Invalid DER signature format: Extra data detected.');
  }
  return { rBytes, sBytes };
}

function parseDerInteger(data: any, offset: any) {
  if (data[offset++] !== 0x02) {
      throw new Error('Invalid DER signature format: Expected INTEGER (0x02).');
  }
  let length = data[offset++];
  if (length & 0x80) { // Long-form length
      const lengthBytes = length & 0x7f;
      length = 0;
      for (let i = 0; i < lengthBytes; i++) {
          length = (length << 8) | data[offset++];
      }
  }
  const integer = data.slice(offset, offset + length);
  offset += length;
  return { integer, offset };
}

function ensureLowS(sBigInt: any) {
  // Curve order for secp256k1
  const curveN = BigInt('0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141');
  const halfCurveN = curveN >> BigInt(1);
  // Adjust s if it's greater than n/2
  if (sBigInt > halfCurveN) {
      sBigInt = curveN - sBigInt;
  }
  return sBigInt;
}

function bigIntToBuffer(bigint: any) {
  let hex = bigint.toString(16);
  // Ensure even length for hex string
  if (hex.length % 2) {
      hex = '0' + hex;
  }
  const buffer = Buffer.from(hex, 'hex');
  // Pad the buffer to 32 bytes if necessary
  if (buffer.length > 32) {
      throw new Error('Integer too large; expected maximum of 32 bytes.');
  } else if (buffer.length < 32) {
      // Prepend zeros to reach 32 bytes
      const padding = Buffer.alloc(32 - buffer.length, 0);
      return Buffer.concat([padding, buffer]);
  } else {
      return buffer;
  }
}

function compressPublicKey(uncompressedKeyHex: string) {
  // Validate the input length (should be 130 characters for a 65-byte key)
  if (uncompressedKeyHex.length !== 130) {
      throw new Error('Invalid uncompressed public key length; expected 130-character hex string.');
  }
  // Validate that the input is a hex string
  if (!/^[0-9a-fA-F]+$/.test(uncompressedKeyHex)) {
      throw new Error('Invalid hex string for public key.');
  }
  // Convert hex string to a Buffer
  const uncompressedKey = Buffer.from(uncompressedKeyHex, 'hex');
  // Check that the first byte is 0x04 (uncompressed key prefix)
  if (uncompressedKey[0] !== 0x04) {
      throw new Error('Invalid uncompressed public key prefix; expected 0x04.');
  }
  // Extract the X and Y coordinates
  const x = uncompressedKey.slice(1, 33); // Bytes 1-32
  const y = uncompressedKey.slice(33, 65); // Bytes 33-64
  // Convert Y coordinate to a BigInt to check if it's even or odd
  const yBigInt = BigInt('0x' + y.toString('hex'));
  // Determine the prefix for the compressed key
  const prefix = yBigInt % BigInt(2) === BigInt(0) ? 0x02 : 0x03;
  // Build the compressed key: prefix byte + X coordinate
  const compressedKey = Buffer.concat([Buffer.from([prefix]), x]);
  // Return the compressed key as a 66-character hex string
  return compressedKey.toString('hex');
}
</script>

<style scoped>
#container {
  padding: 16px;
}

#assetsArea {
  margin-bottom: 20px;
}

ion-list p {
  max-width: 240px;
}

ion-accordion-group {
  margin-top: 20px;
}

ion-accordion-group .wrapper {
  padding: 0px;
}

ion-accordion-group ion-list ion-item {
  margin: 0 0 -4px 0;
}

ion-modal .wrapper {
  padding: 20px;
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
}

.asset-image {
  width: 100%;
  height: auto;
  border-radius: 10px;
}
</style>