<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div id="container">
        <h1>Welcome to<br />TapDano</h1>
        <ion-button expand="block" @click="$router.push('/my-wallets')">My Wallets</ion-button>
        <ion-button expand="block" @click="$router.push('/my-tags')">My Tags</ion-button>
        <ion-button expand="block" @click="$router.push('/settings')" fill="outline">Settings</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>
 
<script setup lang="ts">
import { IonButtons, IonContent, IonPage, IonButton } from '@ionic/vue';
</script>

<style scoped>
#container {
  height: auto;
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
  padding: 5px 0px;
  min-height: 50px;
}
</style>
