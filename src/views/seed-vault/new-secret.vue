<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault/main"></ion-back-button>
        </ion-buttons>
        <ion-title>New Seed Phrase</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <form @submit.prevent="handleSubmit">
          <p></p>
          <ion-item>
            <ion-input v-model="name" label="Name" placeholder=""></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="seedPhrase" label="Seed Phrase" placeholder=""></ion-input>
          </ion-item>
          <ion-button id="submit-button" expand="block" type="submit">Send</ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import CryptoJS from 'crypto-js';
import { Storage } from '@ionic/storage';

const router = useRouter();
const storage = new Storage();
storage.create();

const name = ref('');
const seedPhrase = ref('');

const handleSubmit = async () => {
  try {
    await saveSecret({
      name: name.value,
      seedPhrase: seedPhrase.value,
    });
    router.replace('/seed-vault/main');
  } catch (error) {
    console.error(error);
    alert(error);
  }
};

const saveSecret = async (newSecretObj: any) => {
  const svTagsArr = await storage.get('sv_tags');
  const currentIdx = await storage.get('currentSVTagIndex');
  let key = '';
  if (Array.isArray(svTagsArr) && svTagsArr[currentIdx] && svTagsArr[currentIdx].seedVaultKey) {
    key = svTagsArr[currentIdx].seedVaultKey;
  }
  if (!key) {
    alert('Authentication key not found.');
    return;
  }
  const existingEncrypted = await storage.get('my-secrets');
  let secretsArr = [];
  if (existingEncrypted) {
    try {
      const bytes = CryptoJS.AES.decrypt(existingEncrypted, key);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      secretsArr = JSON.parse(decryptedData);
    } catch (e) {
      secretsArr = [];
    }
  }
  secretsArr.push(newSecretObj);
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(secretsArr), key).toString();
  await storage.set('my-secrets', encrypted);
};
</script>

<style scoped>
#submit-button {
  margin-top: 20px;
}
</style>