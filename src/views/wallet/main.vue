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
      </div>
    </ion-content>

    <WalletTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonTextarea } from '@ionic/vue';
import WalletTabBar from '../../components/WalletTabBar.vue';
import PriceChart from '../../components/PriceChart.vue';
import { getCurrentWallet } from '@/utils/StorageUtils';
import { copyToClipboard } from '@/utils/ClipboardUtils';

const BLOCKFROST_API_KEY = 'mainnetlA85V4VJtXzzoWf4DJ8U8NSsHq6z6Epf';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

const walletBalance = ref(0);

const fetchWalletBalance = async (address: string) => {
  try {
    const response = await fetch(`${BLOCKFROST_API_URL}/addresses/${address}`, {
      headers: {
        'project_id': BLOCKFROST_API_KEY
      }
    });
    if (!response.ok) {
      throw new Error('Erro na resposta da API');
    }
    const data = await response.json();
    walletBalance.value = data.amount[0].quantity / 1000000;
  } catch (error) {
    console.error("Erro ao buscar o saldo da carteira:", error);
  }
};

const router = useRouter();
const route = useRoute();

const walletName = ref('');
const walletReceiveAddress = ref('');
const walletStakingAddress = ref('');

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
