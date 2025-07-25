<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/local-wallets"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ walletName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <PriceChart />
        <ion-item>
          <h4>ADA Price: ${{ (cardanoUsdPrice).toFixed(2) }} USD</h4>
        </ion-item>
        <ion-item>
          <h4>Balance: {{ walletBalance.toFixed(2) }} ADA (${{ (walletBalance * cardanoUsdPrice).toFixed(2) }} USD)</h4>
        </ion-item>
        <ion-item>
          <ion-textarea v-model="walletReceiveAddress" label="Receive Address" :label-placement="'stacked'"
            :auto-grow="true" @click="() => copyToClipboard(walletReceiveAddress)" :readonly="true"></ion-textarea>
        </ion-item>
        <div id="boxSend">
          <h2>Send ADA</h2>
          <ion-item>
            <ion-input v-model="destinationAddress" type="text" label="Destination Address"
              :label-placement="'stacked'"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="adaAmount" type="number" label="ADA Amount" :label-placement="'stacked'"></ion-input>
          </ion-item>
          <ion-button @click="sendTransaction">Send</ion-button>
        </div>
      </div>
    </ion-content>

    <WalletTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonTextarea, IonInput, IonItem, IonButton } from '@ionic/vue';
import { getCurrentLocalWallet } from '@/utils/StorageUtils';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { loadWallet, fetchAccountInfo } from '@/utils/CryptoUtils';
import { Transaction } from '@meshsdk/core';
import WalletTabBar from '@/components/LocalWalletTabBar.vue';
import PriceChart from '@/components/PriceChart.vue';

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

const sendTransaction = async () => {
  if (!destinationAddress.value || adaAmount.value <= 0) {
    alert('Please fill in all fields correctly.');
    return;
  }

  if (!confirm('Confirm transaction submission?')) return;

  try {
    const currentWallet = await getCurrentLocalWallet();
    const wallet = await loadWallet(currentWallet.mnemonic);

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
  } catch (error) {
    console.error(error);
    alert(error);
  }
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
  if (newPath === '/local-wallet/main') {
    const currentWallet = await getCurrentLocalWallet();
    if (currentWallet == null) {
      router.push('/local-wallets');
      return;
    }

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
#boxSend {
  background-color: #1E1E1E;
  padding: 20px;
  border-radius: 5px;
  border: 3px dashed #ff696169;
  margin-top: 20px;
}

#boxSend h2 {
  margin: 0 0 20px;
  text-align: center;
}

#boxSend ion-item {
  background-color: #333;
}

#boxSend ion-button {
  display: block;
  height: 50px;
  margin-top: 20px;
}
</style>
