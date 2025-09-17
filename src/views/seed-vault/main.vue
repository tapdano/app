<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault"></ion-back-button>
        </ion-buttons>
        <ion-title>Seed Vault</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <div v-if="secrets.length === 0" class="no-items-message">No seed phrase found.</div>
          <div v-else>
            <ion-list>
              <ion-item v-for="(secret, index) in secrets" :key="index" @click="selectSeedPhrase(index)">
                {{ (secret as any).name }}
              </ion-item>
            </ion-list>
          </div>
          <div id="buttons-box">
            <ion-button expand="block" @click="addSeedPhrase">Import Wallet</ion-button>
          </div>
        </div>
      </div>
    </ion-content>

    <SeedVaultTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonList, IonButton, IonItem } from '@ionic/vue';
import { Storage } from '@ionic/storage';
import SeedVaultTabBar from '../../components/SeedVaultTabBar.vue';
import CryptoJS from 'crypto-js';

const storage = new Storage();
storage.create();

const router = useRouter();
const route = useRoute();
const loading = ref(true);
const secrets = ref([]);

const load = async () => {
  loading.value = true;
  setTimeout(async () => {
    const svTagsArr = await storage.get('sv_tags');
    const currentIdx = await storage.get('currentSVTagIndex');
    let key = '';
    if (Array.isArray(svTagsArr) && svTagsArr[currentIdx] && svTagsArr[currentIdx].seedVaultKey) {
      key = svTagsArr[currentIdx].seedVaultKey;
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
    loading.value = false;
  }, 1000);
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/seed-vault/main') {
    await load();
  }
}, { immediate: true });

const addSeedPhrase = async () => {
  try {
    router.replace('/seed-vault/new-secret');
  } catch (error) {
    console.error(error);
    alert(error);
  }
};

const selectSeedPhrase = async (index: number) => {
  await storage.set('currentSeedPhrase', index);
  router.push('/seed-vault/secret');
};
</script>

<style scoped>
#buttons-box {
  margin-top: 20px;
}
ion-button {
  min-height: 50px;
  margin-top: 10px;
}
</style>