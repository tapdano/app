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
        <form @submit.prevent="handleSubmit">
          <p>Please enter the code sent to your email</p>
          <ion-item>
            <ion-input v-model="code" label="Code" placeholder="123456"></ion-input>
          </ion-item>
          <ion-button id="submit-button" expand="block" type="submit">Send</ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getSeedVaultApiUrl } from '@/utils/SeedVaultApi';
import { Storage } from '@ionic/storage';

const router = useRouter();
const code = ref('');
const tagId = ref('');
const email = ref('');
const from = ref('');
const storage = new Storage();

storage.create();

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  tagId.value = urlParams.get('id') || '';
  email.value = urlParams.get('email') || '';
  from.value = urlParams.get('from') || '';

  if (tagId.value && from.value !== 'new-tag') {
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
        alert(result.error || 'Erro ao solicitar código');
      }
    } catch (error) {
      alert('Erro ao comunicar com o servidor');
      console.error(error);
    }
  }
});

const handleSubmit = async () => {
  try {
    let body;
    if (from.value === 'new-tag') {
      body = {
        action: 'SET_EMAIL_VERIFY_OTP',
        id: tagId.value,
        email: email.value,
        otp_code: code.value
      };
    } else {
      body = {
        action: 'VERIFY_OTP',
        id: tagId.value,
        otp_code: code.value
      };
    }
    const apiUrl = await getSeedVaultApiUrl();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const result = await response.json();
    if (result.status === 'ok' && result.verified) {
      if (result.key) {
        await storage.set('seedVaultKey', result.key);
      }
      router.replace('/seed-vault/main');
    } else {
      alert('Código inválido');
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