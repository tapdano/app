<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Registration</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <h1>Registration</h1>
        <button @click="startRegistrationProcess">Begin Registration</button>
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
import { startRegistration } from '@simplewebauthn/browser';
import { Storage } from '@ionic/storage';
import { getRegistrationOptions, checkRegistrationResponse } from '@/utils/WebAuthNUtils';

const storage = new Storage();
storage.create();

const elemSuccess = ref('');
const elemError = ref('');

async function startRegistrationProcess() {
  elemSuccess.value = '';
  elemError.value = '';
  try {
    const options = await getRegistrationOptions();
    const attResp = await startRegistration(options);
    const verification = await checkRegistrationResponse(attResp, options.challenge);
    if (verification.verified) {
      await storage.set('registrationInfo', verification.registrationInfo);
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