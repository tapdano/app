<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/my-wallets"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ walletName }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <div v-if="transactions.length === 0" class="no-items-message">Your transaction list is empty!</div>
          <div v-else>
            <ion-list>
              <ion-item v-for="transaction in transactions" :key="transaction.tx_hash">
                <p>Transaction: <a :href="`${cardanoScanURL}/transaction/${transaction.tx_hash}`" target="_blank">{{ transaction.tx_hash }}</a></p>
              </ion-item>
            </ion-list>
          </div>
        </div>
      </div>
    </ion-content>
    <WalletTabBar />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonBackButton, IonTitle, IonToolbar, IonItem, IonList } from '@ionic/vue';
import WalletTabBar from '../../components/WalletTabBar.vue';
import { getCurrentWallet } from '@/utils/StorageUtils';
import { fetchTransactions, getCardanoScanURL } from '@/utils/CryptoUtils';

interface Transaction {
  tx_hash: string;
}

const router = useRouter();
const route = useRoute();
const walletName = ref('');
const transactions = ref<Transaction[]>([]);
const loading = ref(true);
let cardanoScanURL = '';

watch(() => route.path, async (newPath) => {
  if (newPath === '/wallet/transactions') {
    loading.value = true;
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
      return;
    }
    walletName.value = currentWallet.name;
    try {
      cardanoScanURL = await getCardanoScanURL();
      const transactionsData = await fetchTransactions(currentWallet.baseAddr);
      transactions.value = transactionsData;
    } catch (error) {
      transactions.value = [];
    }
    loading.value = false;
  }
}, { immediate: true });
</script>

<style scoped>
</style>
