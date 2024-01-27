<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ walletName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <h1>ADA / USD</h1>
        <PriceChart />
        <div id="myWalletBox">
          <ion-textarea v-model="walletReceiveAddress" label="Receive Address" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(walletReceiveAddress, true)" :readonly="true"></ion-textarea>
          <ion-textarea v-model="walletStakingAddress" label="Staking Address" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(walletStakingAddress, true)" :readonly="true"></ion-textarea>
        </div>
        <div>
          <h2>Wallet Balance:</h2>
          <p>{{ walletBalance }} ADA</p>
        </div>
        <div>
          <h2>Send ADA</h2>
          <ion-item>
            <ion-input v-model="destinationAddress" type="text" label="Destination Address" :label-placement="'stacked'"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="adaAmount" type="number" label="ADA Amount" :label-placement="'stacked'"></ion-input>
          </ion-item>
          <ion-button @click="sendTransaction">Send</ion-button>
        </div>
      </div>
    </ion-content>

    <NFCModal :is-open="showModal" @cancel="handleModalCancel" @dismiss="handleModalDismiss"></NFCModal>

    <WalletTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonTextarea, IonLabel, IonInput, IonItem, IonButton } from '@ionic/vue';
import { getCurrentWallet } from '@/utils/StorageUtils';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { accessNFCTag, cancelNFCTagReading } from '@/utils/NFCUtils';
import { entropyToMnemonic, validateMnemonic, createWallet } from '@/utils/CryptoUtils';
import { AppWallet, BlockfrostProvider, Transaction } from '@meshsdk/core';
import WalletTabBar from '@/components/WalletTabBar.vue';
import PriceChart from '@/components/PriceChart.vue';
import NFCModal from '@/components/NFCModal.vue';

const BLOCKFROST_API_KEY = 'mainnetlA85V4VJtXzzoWf4DJ8U8NSsHq6z6Epf';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

const blockchainProvider = new BlockfrostProvider(BLOCKFROST_API_KEY);

const walletBalance = ref(0);

const fetchWalletBalance = async (address: string) => {
  try {
    const response = await fetch(`${BLOCKFROST_API_URL}/addresses/${address}`, {
      headers: {
        'project_id': BLOCKFROST_API_KEY
      }
    });
    if (!response.ok) {
      throw new Error('API error');
    }
    const data = await response.json();
    walletBalance.value = data.amount[0].quantity / 1000000;
  } catch (error) {
    console.error(error);
  }
};

const router = useRouter();
const route = useRoute();

const walletName = ref('');
const walletReceiveAddress = ref('');
const walletStakingAddress = ref('');

const destinationAddress = ref('');
const adaAmount = ref(0);

const showModal = ref(false);

const handleModalCancel = () => {
  showModal.value = false;
  cancelNFCTagReading();
};

const handleModalDismiss = () => {
  showModal.value = false;
};

const getMnemonic = async () => {
  try {
    const currentWallet = await getCurrentWallet();
    showModal.value = true;
    const entropy = await accessNFCTag() as string;
    showModal.value = false;
    const mnemonic = entropyToMnemonic(entropy);
    if (!validateMnemonic(mnemonic)) throw ('Entropy invalid.');
    const cryptoWallet = createWallet(mnemonic);
    if (cryptoWallet.baseAddr != currentWallet.baseAddr) throw ('Wrong Wallet.');
    return cryptoWallet.mnemonic as string;
  } catch (error) {
    showModal.value = false;
    console.error(error);
    throw error;
  }
};

const sendTransaction = async () => {
  if (!destinationAddress.value || adaAmount.value <= 0) {
    alert('Please fill in all fields correctly.');
    return;
  }

  const mnemonic = await getMnemonic();
  console.log('mnemonic='+mnemonic);

  const meshWallet = new AppWallet({
    networkId: 1,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
      type: 'mnemonic',
      words: mnemonic.split(' '),
    },
  });

  const baseAddress = meshWallet.getBaseAddress();
  console.log('baseAddress='+baseAddress);

  const paymentAddress = meshWallet.getPaymentAddress();
  console.log('paymentAddress='+paymentAddress);

  const rewardAddress = meshWallet.getRewardAddress();
  console.log('rewardAddress='+rewardAddress);

  const tx = new Transaction({ initiator: meshWallet }).sendLovelace(
    destinationAddress.value,
    adaAmount.value + '000000'
  );

  console.log('aki 1');
  const unsignedTx = await tx.build();
  console.log('aki 2');
  const signedTx = await meshWallet.signTx(unsignedTx);
  console.log('aki 3');
  const txHash = await meshWallet.submitTx(signedTx);
  console.log(txHash);

  destinationAddress.value = '';
  adaAmount.value = 0;
  alert('Success! TxID: ' + txHash);
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/wallet/main') {
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
      return;
    }
    walletName.value = currentWallet.name;
    walletReceiveAddress.value = currentWallet.baseAddr;
    walletStakingAddress.value = currentWallet.rewardAddr;
    await fetchWalletBalance(currentWallet.baseAddr);
  }
}, { immediate: true });
</script>

<style scoped>
#container {
  margin: 20px;
}

#myWalletBox{
  margin: 20px 0;
}

h1 {
  text-align: center;
}
</style>
