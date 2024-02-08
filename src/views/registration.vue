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
import { generateRegistrationOptions, verifyRegistrationResponse } from '@simplewebauthn/server';

// Import or define getUserFromDB, getUserAuthenticators, and other necessary functions here

const rpName = 'TapDano';

// A unique identifier for your website
const rpID = 'localhost';

// The URL at which registrations and authentications should occur
const origin = `https://${rpID}`;

const elemSuccess = ref('');
const elemError = ref('');

async function getRegistrationOptions() {

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: '1',
    userName: 'TapDano Wallet',
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform',
    },
  });

  //setUserCurrentChallenge(user, options.challenge);

  return options;
}

async function startRegistrationProcess() {
  elemSuccess.value = '';
  elemError.value = '';

  try {
    const options = await getRegistrationOptions();

    const attResp = await startRegistration(options);

    console.log(attResp);

    /*
    const verificationResp = await fetch('/verify-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(attResp),
    });

    const verificationJSON = await verificationResp.json();

    if (verificationJSON && verificationJSON.verified) {
      elemSuccess.value = 'Success!';
    } else {
      elemError.value = `Oh no, something went wrong! Response: <pre>${JSON.stringify(
        verificationJSON,
      )}</pre>`;
    }
    */
  } catch (error: any) {
    if (error.name === 'InvalidStateError') {
      elemError.value = 'Error: Authenticator was probably already registered by user';
    } else {
      elemError.value = `Error: ${error}`;
    }
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