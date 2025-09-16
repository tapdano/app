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
      <div id="container">
      </div>
    </ion-content>
    <SeedVaultTabBar />
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import SeedVaultTabBar from '../../components/SeedVaultTabBar.vue';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

watch(() => route.path, async (newPath) => {
  if (newPath === '/seed-vault/settings') {
  }
}, { immediate: true });
</script>

<style scoped>
</style>