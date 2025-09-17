<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault/settings"></ion-back-button>
        </ion-buttons>
        <ion-title>Change E-mail</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <form @submit.prevent="submitChange">
          <ion-item>
            <ion-input v-model="newEmail" label="New E-mail" placeholder="Enter new e-mail"></ion-input>
          </ion-item>
          <ion-button expand="block" type="submit">Confirm Change</ion-button>
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

const newEmail = ref('');

const submitChange = async () => {
  let tagId = null;
  let key = null;
  const svTagsArr = await storage.get('sv_tags');
  const currentIdx = await storage.get('currentSVTagIndex');
  if (Array.isArray(svTagsArr) && svTagsArr[currentIdx]) {
    tagId = svTagsArr[currentIdx].id;
    key = svTagsArr[currentIdx].seedVaultKey || '';
  }
  try {
    const apiUrl = await getSeedVaultApiUrl();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SET_EMAIL',
        id: tagId,
        email: newEmail.value,
        key: key
      })
    });
    const result = await response.json();
    if (result.status === 'ok') {
      alert('E-mail changed successfully.');
      router.replace('/seed-vault/settings');
    } else {
      alert(result.error || 'Error changing email.');
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