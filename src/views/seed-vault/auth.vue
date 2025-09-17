<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault"></ion-back-button>
        </ion-buttons>
        <ion-title>Authentication</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <ion-segment v-model="activeTab">
          <ion-segment-button value="pin">By PIN</ion-segment-button>
          <ion-segment-button value="otp">By E-mail Code</ion-segment-button>
        </ion-segment>
        <div v-if="activeTab === 'pin'" style="margin-top:20px;">
          <form @submit.prevent="handlePinSubmit">
            <ion-item>
              <ion-input v-model="pin" label="PIN" placeholder="Enter PIN" type="password" :maxlength="6"></ion-input>
            </ion-item>
            <ion-button id="submit-button" expand="block" type="submit">Login</ion-button>
          </form>
        </div>
        <div v-else style="margin-top:20px;">
          <form @submit.prevent="handleOtpSubmit">
            <p>Please enter the code sent to your email</p>
            <ion-item>
              <ion-input v-model="code" label="Code" placeholder="123456"></ion-input>
            </ion-item>
            <ion-button expand="block" type="submit">Login</ion-button>
          </form>
          <ion-button expand="block" color="secondary" style="margin-top:10px;" @click="sendOtpCode">Send Code</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton, IonSegment, IonSegmentButton } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getSeedVaultApiUrl, saveSeedVaultTag } from '@/utils/SeedVaultUtils';
import { Storage } from '@ionic/storage';

const router = useRouter();
const code = ref('');
const pin = ref('');
const tagId = ref('');
const email = ref('');
const activeTab = ref('pin');
const storage = new Storage();

storage.create();

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  tagId.value = urlParams.get('id') || '';
  email.value = urlParams.get('email') || '';
});

const sendOtpCode = async () => {
  if (!tagId.value) {
    alert('Tag ID not found.');
    return;
  }
  try {
    const apiUrl = await getSeedVaultApiUrl();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'AUTH_BY_OTP',
        id: tagId.value
      })
    });
    const result = await response.json();
    if (result.status !== 'ok') {
      alert(result.error || 'Error requesting code');
    } else {
      alert('Code sent to your email.');
    }
  } catch (error) {
    alert('Error communicating with the server');
    console.error(error);
  }
};

const handleOtpSubmit = async () => {
  try {
    const apiUrl = await getSeedVaultApiUrl();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'VERIFY_OTP',
        id: tagId.value,
        otp_code: code.value
      })
    });
    const result = await response.json();
    if (result.status === 'ok' && result.verified) {
      await saveSeedVaultTag({ key: result.key, tagId: tagId.value });
      router.replace('/seed-vault/main');
    } else {
      alert('Invalid code');
    }
  } catch (error) {
    console.error(error);
    alert(error);
  }
};

const handlePinSubmit = async () => {
  try {
    const apiUrl = await getSeedVaultApiUrl();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'AUTH_BY_PIN',
        id: tagId.value,
        pin: pin.value
      })
    });
    const result = await response.json();
    if (result.status === 'ok' && result.verified && result.key) {
      await saveSeedVaultTag({ key: result.key, tagId: tagId.value });
      router.replace('/seed-vault/main');
    } else {
      alert('Invalid PIN');
    }
  } catch (error) {
    console.error(error);
    alert(error);
  }
};
</script>

<style scoped>
#submit-button {
  margin-top: 20px;
}
</style>