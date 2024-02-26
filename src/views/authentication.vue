<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div id="container">
        <h1>Authentication</h1>
        <button @click="startAuthenticationProcess">Begin Authentication</button>
        <p id="error" style="color: red;">{{ elemError }}</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonContent, IonPage } from '@ionic/vue';
import { startAuthentication } from '@simplewebauthn/browser';
import { useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { getAuthenticationOptions, checkAuthenticationResponse } from '@/utils/WebAuthNUtils';

const elemError = ref('');

async function startAuthenticationProcess() {
  const router = useRouter();
  const storage = new Storage();
  storage.create();
  elemError.value = '';
  try {
    const registrationInfo = await storage.get('registrationInfo');
    const options = await getAuthenticationOptions(registrationInfo.credentialID);
    /*
    options.allowCredentials = [{
      id: 'OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OTk5OQ',
      "transports": ['nfc'],
      type: 'public-key'
    }];
    */
    const attResp = await startAuthentication(options);
    const verification = await checkAuthenticationResponse(attResp, options.challenge, registrationInfo);
    if (verification.verified) {
      registrationInfo.counter = verification.authenticationInfo.newCounter;
      await storage.set('registrationInfo', registrationInfo);
      sessionStorage.setItem('authenticationInfo', JSON.stringify(verification.authenticationInfo));
      router.push('/');
    } else {
      elemError.value = 'Oh no, something went wrong!';
    }
  } catch (error) {
    console.error(error);
    elemError.value = `Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

startAuthenticationProcess();
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