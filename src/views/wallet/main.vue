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
        <h1>ADA (${{ (cardanoUsdPrice).toFixed(2) }} USD)</h1>
        <PriceChart />
        <div>
          <h2>Wallet Balance:</h2>
          <div class="walletBalance">
            <p>{{ walletBalance }} ADA</p>
            <span>=</span>
            <p class="usd">${{ (walletBalance * cardanoUsdPrice).toFixed(2) }} USD</p>
          </div>
        </div>
        <div id="myWalletBox">
          <ion-textarea v-model="walletReceiveAddress" label="Receive Address" :label-placement="'stacked'"
            :auto-grow="true" @click="() => copyToClipboard(walletReceiveAddress, true)" :readonly="true"></ion-textarea>
        </div>
        <div>
          <h2>Send ADA</h2>
          <ion-item>
            <ion-input v-model="destinationAddress" type="text" label="Destination Address"
              :label-placement="'stacked'"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="adaAmount" type="text" label="ADA Amount" :label-placement="'stacked'"></ion-input>
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
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonTextarea, IonInput, IonItem, IonButton } from '@ionic/vue';
import { getCurrentWallet } from '@/utils/StorageUtils';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { accessNFCTag, cancelNFCTagReading } from '@/utils/NFCUtils';
import { entropyToMnemonic, validateMnemonic, createWallet, loadWallet, fetchAccountInfo } from '@/utils/CryptoUtils';
import { Transaction } from '@meshsdk/core';
import WalletTabBar from '@/components/WalletTabBar.vue';
import PriceChart from '@/components/PriceChart.vue';
import NFCModal from '@/components/NFCModal.vue';

const walletBalance = ref(0);
const cardanoUsdPrice = ref(0);

const getCardanoUsdPrice = async () => {
  try {
    if (walletBalance.value === 0) return;

    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=usd');

    if (!response.ok) {
      throw new Error('API error');
    }

    const data = await response.json();
    cardanoUsdPrice.value = data.cardano.usd;
  } catch (error) {
    console.error(error);

  }
}

const router = useRouter();
const route = useRoute();

const walletName = ref('');
const walletReceiveAddress = ref('');

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

  const wallet = loadWallet(mnemonic);

  const tx = new Transaction({ initiator: wallet }).sendLovelace(
    destinationAddress.value,
    adaAmount.value + '000000'
  );

  const unsignedTx = await tx.build();
  const signedTx = await wallet.signTx(unsignedTx);
  const txHash = await wallet.submitTx(signedTx);

  destinationAddress.value = '';
  adaAmount.value = 0;
  alert('Success! TxID: ' + txHash);
};

const formatAdaAmount = (inputValue: any) => {
  inputValue = inputValue.replace(/,/g, '');
  inputValue = inputValue.replace(/\.(?=.*\.)/g, '').replace('.', ',');

  var parts = inputValue.split(',');
  parts[0] = parts[0].split('').reverse().join('').replace(/(\d{3})/g, '$1,').split('').reverse().join('').replace(/^,/, '');

  if (parts.length > 1) {
    parts[1] = parts[1].substring(0, 6);
    inputValue = parts.join('.');
  } else {
    inputValue = parts[0];
  }

  return inputValue;
}

watch(() => route.path, async (newPath) => {
  if (newPath === '/wallet/main') {
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
      return;
    }
    alert(currentWallet.entropy);
    walletName.value = currentWallet.name;
    walletReceiveAddress.value = currentWallet.baseAddr;

    let balance = 0;
    try {
      const accountInfo = await fetchAccountInfo(currentWallet.baseAddr);
      balance = accountInfo.balance;
    } catch (error) {
    }
    walletBalance.value = balance / 1000000;

    await getCardanoUsdPrice();
  }
}, { immediate: true });

watch(adaAmount, (newValue) => {
  const formattedValue = formatAdaAmount(newValue);
  adaAmount.value = formattedValue;
}, { immediate: false });
</script>

<style scoped>
#container {
  margin: 20px;
}

#myWalletBox {
  margin: 20px 0;
}

h1 {
  text-align: center;
}

.walletBalance {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.walletBalance p{
  margin: 0;
}

.walletBalance .usd {
  color: #666;
}
</style>
