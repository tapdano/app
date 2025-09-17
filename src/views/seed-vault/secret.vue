<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault/main"></ion-back-button>
        </ion-buttons>
        <ion-title>Seed Phrase</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <ion-item>
          <ion-input v-model="name" label="Name" placeholder=""></ion-input>
        </ion-item>
        <ion-item>
          <ion-input v-model="seedPhrase" label="Seed Phrase" placeholder=""></ion-input>
        </ion-item>
        <ion-button id="delete-button" color="danger" @click="deleteSecret">Delete</ion-button>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton } from '@ionic/vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import CryptoJS from 'crypto-js';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

const secrets = ref([]);
const name = ref('');
const seedPhrase = ref('');

const load = async () => {
  setTimeout(async () => {
    const svTagsArr = await storage.get('sv_tags');
    const currentTagIdx = await storage.get('currentSVTagIndex');
    let key = '';
    if (Array.isArray(svTagsArr) && svTagsArr[currentTagIdx] && svTagsArr[currentTagIdx].seedVaultKey) {
      key = svTagsArr[currentTagIdx].seedVaultKey;
    }
    const encryptedSecrets = await storage.get('my-secrets');
    let decrypted = [];
    if (encryptedSecrets && key) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedSecrets, key);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        decrypted = JSON.parse(decryptedData);
      } catch (e) {
        decrypted = [];
      }
    }
    secrets.value = decrypted;
    const currentIndex = await storage.get('currentSeedPhrase');
    if (secrets.value[currentIndex]) {
      name.value = (secrets.value[currentIndex] as any).name;
      seedPhrase.value = (secrets.value[currentIndex] as any).seedPhrase;
    } else {
      name.value = '';
      seedPhrase.value = '';
    }
  }, 10);
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/seed-vault/secret') {
    await load();
  }
}, { immediate: true });

const deleteSecret = async () => {
  const confirmation = confirm('Are you sure you want to delete this Seed Phrase?');
  if (confirmation) {
    const svTagsArr = await storage.get('sv_tags');
    const currentTagIdx = await storage.get('currentSVTagIndex');
    let key = '';
    if (Array.isArray(svTagsArr) && svTagsArr[currentTagIdx] && svTagsArr[currentTagIdx].seedVaultKey) {
      key = svTagsArr[currentTagIdx].seedVaultKey;
    }
    const encryptedSecrets = await storage.get('my-secrets');
    let secretsArr = [];
    if (encryptedSecrets && key) {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedSecrets, key);
        const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
        secretsArr = JSON.parse(decryptedData);
      } catch (e) {
        secretsArr = [];
      }
    }
    const currentIndex = await storage.get('currentSeedPhrase');
    if (secretsArr && secretsArr[currentIndex]) {
      secretsArr.splice(currentIndex, 1);
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(secretsArr), key).toString();
      await storage.set('my-secrets', encrypted);
      await storage.remove('currentSeedPhrase');
      router.push('/seed-vault/main');
    }
  }
};
</script>

<style scoped>
#delete-button {
  margin-top: 20px;
}
</style>