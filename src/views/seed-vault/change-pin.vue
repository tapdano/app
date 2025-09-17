<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault/settings"></ion-back-button>
        </ion-buttons>
        <ion-title>Change PIN</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <form @submit.prevent="handleChangePin">
          <ion-item>
            <ion-input v-model="newPin" label="New PIN" placeholder="Enter new PIN" maxlength="6" type="password" inputmode="numeric" pattern="[0-9]*"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="confirmPin" label="Confirm PIN" placeholder="Repeat new PIN" maxlength="6" type="password" inputmode="numeric" pattern="[0-9]*"></ion-input>
          </ion-item>
          <ion-button expand="block" type="submit">Change PIN</ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton } from '@ionic/vue';
import { getSeedVaultApiUrl } from '@/utils/SeedVaultUtils';
import { Storage } from '@ionic/storage';

const router = useRouter();
const storage = new Storage();
storage.create();

const newPin = ref('');
const confirmPin = ref('');

const handleChangePin = async () => {
  let tagId = null;
  let key = null;
  const svTagsArr = await storage.get('sv_tags');
  const currentIdx = await storage.get('currentSVTagIndex');
  if (Array.isArray(svTagsArr) && svTagsArr[currentIdx]) {
    tagId = svTagsArr[currentIdx].id;
    key = svTagsArr[currentIdx].seedVaultKey || '';
  }
  if (!/^\d{6}$/.test(newPin.value)) {
    alert('PIN must be exactly 6 digits.');
    return;
  }
  if (newPin.value !== confirmPin.value) {
    alert('PIN and confirmation PIN do not match.');
    return;
  }
  try {
    const apiUrl = await getSeedVaultApiUrl();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SET_PIN',
        id: tagId,
        pin: newPin.value,
        key: key
      })
    });
    const result = await response.json();
    if (result.status === 'ok') {
      alert('PIN changed successfully.');
      router.replace('/seed-vault/settings');
    } else {
      alert(result.error || 'Error changing PIN.');
    }
  } catch (error) {
    alert(error);
  }
};
</script>

<style scoped>
ion-button {
  margin-top: 20px;
}
</style>