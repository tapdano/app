<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>NFC Wallet</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <h1>Welcome to<br />TapDano Wallet</h1>
        <ion-button expand="block" @click="$router.push('/NFC-Wallet/Index')">Create a new wallet</ion-button>
        <ion-button expand="block" fill="outline">Restore wallet</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
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

#container h1 {
  margin: 20px 0;
  font-size: 2.625rem;
}

#container ion-button {
  padding: 5px 20px;
  min-height: 50px;
}
</style>
