<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault"></ion-back-button>
        </ion-buttons>
        <ion-title>New Seed Vault</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <form @submit.prevent="handleSubmit">
          <p>Enter an email address and PIN to associate with this tag</p>
          <ion-item>
            <ion-input v-model="email" label="E-mail" placeholder="valid e-mail"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="pin" label="PIN" placeholder="Choose a PIN" :maxlength="6" type="password" inputmode="numeric" pattern="[0-9]*"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="confirmPin" label="Confirm PIN" placeholder="Repeat your PIN" :maxlength="6" type="password" inputmode="numeric" pattern="[0-9]*"></ion-input>
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
import { getSeedVaultApiUrl, saveSeedVaultTag } from '@/utils/SeedVaultUtils';

const router = useRouter();
const email = ref('');
const pin = ref('');
const confirmPin = ref('');
const tagId = ref('');

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  tagId.value = urlParams.get('id') || '';
});

const handleSubmit = async () => {
  if (!/^\d{6}$/.test(pin.value)) {
    alert('PIN must be exactly 6 digits.');
    return;
  }
  if (pin.value !== confirmPin.value) {
    alert('PIN and confirmation PIN do not match.');
    return;
  }
  try {
    const apiUrl = await getSeedVaultApiUrl();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'START_TAG',
        id: tagId.value,
        email: email.value,
        pin: pin.value
      })
    });
    const result = await response.json();
    if (result.status === 'ok' && result.key) {
      await saveSeedVaultTag({ key: result.key, tagId: tagId.value });
      router.replace('/seed-vault/main');
    } else {
      alert(result.error || 'Erro ao associar email');
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