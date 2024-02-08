<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Authentication</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <h1>Authentication</h1>
        <button @click="startAuthenticationProcess">Begin Authentication</button>
        <p id="success" style="color: green;">{{ elemSuccess }}</p>
        <p id="error" style="color: red;">{{ elemError }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {
  IonButtons,
  IonContent,
  IonHeader,
  IonMenuButton,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/vue';
import { startAuthentication } from '@simplewebauthn/browser';
import { Storage } from '@ionic/storage';
import { getAuthenticationOptions, checkAuthenticationResponse } from '@/utils/WebAuthNUtils';

const storage = new Storage();
storage.create();

const elemSuccess = ref('');
const elemError = ref('');

async function startAuthenticationProcess() {
  elemSuccess.value = '';
  elemError.value = '';
  try {
    const options = await getAuthenticationOptions();
    const attResp = await startAuthentication(options);
    const registrationInfo = await storage.get('registrationInfo');
    const verification = await checkAuthenticationResponse(attResp, options.challenge, registrationInfo);
    if (verification.verified) {
      registrationInfo.counter = verification.authenticationInfo.newCounter;
      await storage.set('registrationInfo', registrationInfo);
      await storage.set('authenticationInfo', verification.authenticationInfo);
      elemSuccess.value = 'Success!';
    } else {
      elemError.value = 'Oh no, something went wrong!';
    }
  } catch (error) {
    console.error(error);
    elemError.value = `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}
</script>

<style scoped>
#container {
  margin: 20px;
  text-align: center;
}

h1 {
  margin-bottom: 20px;
}
</style>