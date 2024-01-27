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
        <h1>Transactions</h1>
        <div v-if="transactions.length === 0">
          No transaction found.
        </div>
        <div v-else>
          <ion-list>
            <ion-item v-for="transaction in transactions" :key="transaction.tx_hash">
              Transaction: {{ transaction.tx_hash }}
            </ion-item>
          </ion-list>
        </div>
      </div>
    </ion-content>

    <WalletTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonItem, IonList } from '@ionic/vue';
import WalletTabBar from '../../components/WalletTabBar.vue';
import { getCurrentWallet } from '@/utils/StorageUtils';

const BLOCKFROST_API_KEY = 'mainnetlA85V4VJtXzzoWf4DJ8U8NSsHq6z6Epf';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

interface Transaction {
  tx_hash: string;
}

const router = useRouter();
const route = useRoute();
const walletName = ref('');
const transactions = ref<Transaction[]>([]);

const fetchTransactions = async (address: string) => {
  try {
    const response = await fetch(`${BLOCKFROST_API_URL}/addresses/${address}/transactions`, {
      headers: {
        'project_id': BLOCKFROST_API_KEY
      }
    });
    if (!response.ok) {
      throw new Error('API error');
    }
    const data = await response.json();
    transactions.value = data;
  } catch (error) {
    console.error(error);
  }
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/wallet/transactions') {
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
      return;
    }
    walletName.value = currentWallet.name;
    await fetchTransactions(currentWallet.baseAddr);
  }
}, { immediate: true });
</script>

<style scoped>
#container {
  margin: 20px;
}

h1 {
  text-align: center;
}
</style>
