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
        <PriceChart />
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import PriceChart from '../../components/PriceChart.vue';

const router = useRouter();
const storage = new Storage();
storage.create();

const walletName = ref('');

onMounted(async () => {
  const currentIndex = await storage.get('currentWallet');
  if (currentIndex === null) {
    router.push('/my-wallets');
    return;
  }

  const wallets = await storage.get('wallets');
  if (!wallets || !wallets[currentIndex]) {
    router.push('/my-wallets');
    return;
  }

  walletName.value = wallets[currentIndex].name;
});
</script>

<style scoped>
#container {
  background-color: #FFF;
}
</style>
