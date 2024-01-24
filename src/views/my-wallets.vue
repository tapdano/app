<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>My Wallets</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <p>My Wallets</p>
        <ion-list>
          <ion-item v-for="(wallet, index) in wallets" :key="index" @click="selectWallet(index)">
            {{ wallet.name }}
          </ion-item>
        </ion-list>
        <div v-if="wallets.length === 0">Nenhuma Wallet found</div>
        <div id="buttons-box">
          <ion-button expand="block" @click="$router.push('/new')">Create a new wallet</ion-button>
          <ion-button expand="block" @click="$router.push('/restore')" fill="outline">Restore wallet</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonList, IonItem } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';

const router = useRouter();
const storage = new Storage();
storage.create();

const wallets = ref([]);

onMounted(async () => {
  const storedWallets = await storage.get('wallets');
  if (storedWallets && storedWallets.length > 0) {
    wallets.value = storedWallets;
  }
});

const selectWallet = async (index: number) => {
  await storage.set('currentWallet', index);
  router.push('/wallet/main');
};
</script>

<style scoped>
#container {
  text-align: center;
  margin: 20px;
}

#buttons-box {
  margin-top: 20px;
}
ion-button {
  min-height: 50px;
  margin-top: 10px;
}
</style>
