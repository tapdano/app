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
        <ion-card v-if="loading">
          <ion-card-header>
            <ion-card-title>Loading...</ion-card-title>
          </ion-card-header>
        </ion-card>
        <ion-card v-else>
          <ion-card-header>
            <ion-card-title>ADA Balance</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            {{ adaBalance }} ADA
            <ion-button @click="openDepositModal" color="primary" expand="block">Deposit</ion-button>
            <ion-button @click="openWithdrawModal" color="primary" expand="block">Withdraw</ion-button>
          </ion-card-content>
        </ion-card>
        <ion-list>
          <ion-item v-for="(value, key) in tagInfo" :key="key">
            <ion-label>
              <h3>{{ key }}</h3>
              <p>{{ value }}</p>
            </ion-label>
            <ion-button fill="clear" slot="end" @click="() => copyToClipboard(value)">
              <ion-icon slot="icon-only" :icon="copyOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
      </div>
      <ion-modal :is-open="isWithdrawModalOpen" @didDismiss="closeWithdrawModal">
        <ion-header>
          <ion-toolbar>
            <ion-title>Select Wallet</ion-title>
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
                <ion-select label="Select the Wallet" v-model="depositWallet">
                  <ion-select-option v-for="wallet in wallets" :key="(wallet as any).name" :value="wallet">
                    {{ (wallet as any).name }}
                  </ion-select-option>
                </ion-select>
              </ion-item>
              <ion-item>
                <ion-input type="number" v-model.number="depositAmount" label="ADA Amount"></ion-input>
              </ion-item>
              <ion-button expand="block" @click="depositFromWallet(depositWallet)">Deposit</ion-button>
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
import { ref, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonSelect, IonSelectOption, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonList, IonLabel, IonButton, IonIcon, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonModal, IonInput } from '@ionic/vue';
import { getCurrentTag, getWallets } from '@/utils/StorageUtils';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { Storage } from '@ionic/storage';
import { getBlockfrostURL, getBlockfrostAPI, getNetworkName } from '@/utils/CryptoUtils';
import TagTabBar from '@/components/TagTabBar.vue';
import { copyOutline } from 'ionicons/icons';
import NFCModal from '@/components/NFCModal.vue';
import { TagParser } from '@/utils/TagParser';
import { intToHexString, toHex, utf8ToHex } from '@/utils/StringUtils';

const Lucid = (window as any).Lucid.Lucid;
const Data = (window as any).Lucid.Data;
const Blockfrost = (window as any).Lucid.Blockfrost;
const Constr = (window as any).Lucid.Constr;

const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const IS_CACHE_ON = true;

const router = useRouter();
const route = useRoute();
const storage = new Storage();
const tagInfo = ref({});
const adaBalance = ref(0);
const loading = ref(true);
const isWithdrawModalOpen = ref(false);
const isDepositModalOpen = ref(false);
const depositAmount = ref<number>(0);
const wallets = ref([]);
const depositWallet = ref(null);
const withdrawWallet = ref(null);

const validador = {
  type: "PlutusV2",
  script: "5903ef01000032323232323232322323223225333007323253330093370e900118051baa0011323232330010013758602260246024602460246024602460246024601c6ea8c008c038dd50031129998080008a50132533300e323233372a6eb8c018c048dd50078009bae300630123754018646466e2800400ccdc50009b9832323232323732666002002601c602e6ea8031220100222533333301e00213232323232323300b00200133714911012800002533301b337100069007099b80483c80400c54ccc06ccdc4001a410004266e00cdc0241002800690068b299980e800899b8a4881035b5d2900004133714911035b5f2000375c603e604066600e0026603c980102415d003301e375266e2922010129000044bd70111981026103422c200033020375266601001000466e28dd718090009bae30150014bd701bac301b002375a60320026466ec0dd4180c8009ba7301a0013754004264a666036002266e292201027b7d00002133714911037b5f2000375c603a603c64646600200200644a66603c0022006266446604298103422c2000330213752666012012603c00466e292201023a2000333009009301f002337146eb8c04c004dd7180b000a5eb80c080004cc008008c084004cc0713010342207d003301c375200497ae03756004264a666036002266e29221025b5d00002133714911035b5f2000375c603a603c66600a00266038980102415d003301c375200497ae0223301e4c0103422c20003301e375266600c00c00466e28dd718080009bae30130014bd701bac002133005375a0040022646466e292210268270000132333001001337006e34009200133714911012700003222533301b3371000490000800899191919980300319b8000548004cdc599b80002533301e33710004900a0a40c02903719b8b33700002a66603c66e2000520141481805206e0043370c004901019b8300148080cdc70020011bae002222323300100100422533301b0011004133003301d00133002002301e001223233001001003225333016301400113371491101300000315333016337100029000099b8a489012d003300200233702900000089980299b8400148050cdc599b803370a002900a240c00066002002444a66602666e2400920001001133300300333708004900a19b8b3370066e14009201448180004dd7180298089baa30053011375400c6eb8c04c008528899801801800980980091808000980718059baa001163001300a37540044601a601c00229309b2b2999802980198031baa00113232533300a300d002149858dd7180580098039baa00116533300330013004375400426464a66601060160042930b1bae3009001300537540042c6e1d20005734aae7555cf2ab9f5740ae855d12ba41",
};

let lucid: any;
let contractAddress: any;

onMounted(async () => {
  await storage.create();
  lucid = await Lucid.new(
    new Blockfrost(await getBlockfrostURL(), await getBlockfrostAPI()),
    await getNetworkName(),
  );
  contractAddress = lucid.utils.validatorToAddress(validador);
});

watch(() => route.path, async (newPath) => {
  if (newPath === '/tag/main') {
    const currentTag = await getCurrentTag();
    if (currentTag == null) {
      router.push('/my-tags');
      return;
    }
    tagInfo.value = currentTag;
    await loadAdaBalance(currentTag.PublicKey);
  }
}, { immediate: true });

async function loadAdaBalance(publicKey: String) {
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
      await storage.set('adaBalanceValue', JSON.stringify(adaBalanceValue));
    }
    adaBalance.value = adaBalanceValue;
  } catch (error) {
    console.error(error);
  }
  loading.value = false;
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
      const tmp = await nfcModal.value.ExecuteCommand(command);
      const sig = new TagParser(tmp);
      const redeemer = Data.to(new Constr(0, [sig.LastSignature]));
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
    const tx = await lucid.newTx().payToContract(contractAddress, { inline: datum }, {
      lovelace: BigInt(depositAmount.value) * 1000000n,
    }).complete();
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
  isWithdrawModalOpen.value = true;
}

function openDepositModal() {
  loadWallets();
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

ion-list p {
  max-width: 240px;
}

ion-modal .wrapper {
  padding: 20px;
}
</style>