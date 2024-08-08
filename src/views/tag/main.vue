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
              <p>SoulBound: <ion-icon :icon="asset.soulBoundId == tagInfo?.PublicKey ? checkmarkCircle : closeCircle" :color="asset.soulBoundId == tagInfo?.PublicKey ? 'success' : 'danger'"></ion-icon></p>
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
import { getCurrentTag, getWallets } from '@/utils/StorageUtils';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { Storage } from '@ionic/storage';
import { getBlockfrostURL, getBlockfrostAPI, getNetworkName, fetchWalletAssets, fetchAssetMetadata, fetchAccountInfo } from '@/utils/CryptoUtils';
import TagTabBar from '@/components/TagTabBar.vue';
import { copyOutline } from 'ionicons/icons';
import NFCModal from '@/components/NFCModal.vue';
import { TagParser } from 'tapdano';
import { intToHexString, utf8ToHex, formatIpfsUrl } from '@/utils/StringUtils';
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
  script: "5903ef01000032323232323232322323223225333007323253330093370e900118051baa0011323232330010013758602260246024602460246024602460246024601c6ea8c008c038dd50031129998080008a50132533300e323233372a6eb8c018c048dd50078009bae300630123754018646466e2800400ccdc50009b9832323232323732666002002601c602e6ea8031220100222533333301e00213232323232323300b00200133714911012800002533301b337100069007099b80483c80400c54ccc06ccdc4001a410004266e00cdc0241002800690068b299980e800899b8a4881035b5d2900004133714911035b5f2000375c603e604066600e0026603c980102415d003301e375266e2922010129000044bd70111981026103422c200033020375266601001000466e28dd718090009bae30150014bd701bac301b002375a60320026466ec0dd4180c8009ba7301a0013754004264a666036002266e292201027b7d00002133714911037b5f2000375c603a603c64646600200200644a66603c0022006266446604298103422c2000330213752666012012603c00466e292201023a2000333009009301f002337146eb8c04c004dd7180b000a5eb80c080004cc008008c084004cc0713010342207d003301c375200497ae03756004264a666036002266e29221025b5d00002133714911035b5f2000375c603a603c66600a00266038980102415d003301c375200497ae0223301e4c0103422c20003301e375266600c00c00466e28dd718080009bae30130014bd701bac002133005375a0040022646466e292210268270000132333001001337006e34009200133714911012700003222533301b3371000490000800899191919980300319b8000548004cdc599b80002533301e33710004900a0a40c02903719b8b33700002a66603c66e2000520141481805206e0043370c004901019b8300148080cdc70020011bae002222323300100100422533301b0011004133003301d00133002002301e001223233001001003225333016301400113371491101300000315333016337100029000099b8a489012d003300200233702900000089980299b8400148050cdc599b803370a002900a240c00066002002444a66602666e2400920001001133300300333708004900a19b8b3370066e14009201448180004dd7180298089baa30053011375400c6eb8c04c008528899801801800980980091808000980718059baa001163001300a37540044601a601c00229309b2b2999802980198031baa00113232533300a300d002149858dd7180580098039baa00116533300330013004375400426464a66601060160042930b1bae3009001300537540042c6e1d20005734aae7555cf2ab9f5740ae855d12ba41",
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
        return utxo.datum && utxo.datum.toUpperCase().includes(publicKey.toUpperCase());
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
        if (allScriptUtxo[i].datum.toUpperCase().indexOf(currentTag.PublicKey.toUpperCase()) === 10) {
          utxoToCollect.push(allScriptUtxo[i]);
          if (utxoToCollect.length === 20) break;
        }
      }
    }
    if (utxoToCollect.length === 0) {
      alert('No assets found');
      return;
    }
    let tx = await lucid.newTx();
    for (let i = 0; i < utxoToCollect.length; i++) {
      const message = utxoToCollect[i].txHash + utf8ToHex(String(utxoToCollect[i].outputIndex)) + publicKeyHash;
      const command = '00A20000' + intToHexString(message.length / 2) + message;
      if (nfcModal.value == null) return;
      const tag = await nfcModal.value.ExecuteCommand(command, i + 1 < utxoToCollect.length);
      const redeemer = Data.to(new Constr(0, [tag.LastSignature]));
      tx = tx.collectFrom([utxoToCollect[i]], redeemer);
    }
    tx = tx.addSigner(await lucid.wallet.address()).attachSpendingValidator(validador);
    tx = await tx.complete();
    const signedTx = await tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log('TX:' + txHash);
    alert('Success!');
  } catch (error) {
    console.error(error);
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
    const datum = Data.to(new Constr(0, [currentTag.PublicKey]));
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
  wallets.value = await getWallets();
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
  width: calc(50% - 20px);
}

.asset-image {
  width: 100%;
  height: auto;
  border-radius: 10px;
}
</style>