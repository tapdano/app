<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div id="container">
        <h1>Registration</h1>
        <button @click="startRegistrationProcess">Begin Registration</button>
        <p id="error" style="color: red;">{{ elemError }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { startRegistration } from '@simplewebauthn/browser';
import { useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { getRegistrationOptions, checkRegistrationResponse } from '@/utils/WebAuthNUtils';

const router = useRouter();
const storage = new Storage();
storage.create();

const elemError = ref('');

async function startRegistrationProcess() {
  elemError.value = '';
  try {
    const options = await getRegistrationOptions();
    const attResp = await startRegistration(options);
    const verification = await checkRegistrationResponse(attResp, options.challenge);
    if (verification.verified) {
      await storage.set('registrationInfo', verification.registrationInfo);
      router.push('/authentication');
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