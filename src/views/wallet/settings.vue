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
        <p>Settings</p>
        <ion-button color="danger" @click="deleteWallet">
          Delete Wallet
        </ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';

const router = useRouter();
const storage = new Storage();
storage.create();

const walletName = ref('My Investments');
let currentIndex = -1;

onMounted(async () => {
  currentIndex = await storage.get('currentWallet');
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

const deleteWallet = async () => {
  const confirmation = confirm('Are you sure you want to delete this wallet?');
  if (confirmation) {
    let wallets = await storage.get('wallets');
    if (wallets && wallets[currentIndex]) {
      wallets.splice(currentIndex, 1);
      await storage.set('wallets', wallets);
      await storage.remove('currentWallet');
      router.push('/my-wallets');
    }
  }
};
</script>

<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

ion-button[color="danger"] {
  --background: #f1453d;
}
</style>