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
              Transaction: <a :href="`https://cardanoscan.io/transaction/${transaction.tx_hash}`" target="_blank">{{ transaction.tx_hash }}</a><br />
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
import { fetchTransactions } from '@/utils/CryptoUtils';

interface Transaction {
  tx_hash: string;
}

const router = useRouter();
const route = useRoute();
const walletName = ref('');
const transactions = ref<Transaction[]>([]);

watch(() => route.path, async (newPath) => {
  if (newPath === '/wallet/transactions') {
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
      return;
    }
    walletName.value = currentWallet.name;
    try {
      const transactionsData = await fetchTransactions(currentWallet.baseAddr);
      transactions.value = transactionsData;
    } catch (error) {
      transactions.value = [];
    }
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
