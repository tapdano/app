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
        <ion-button expand="block" color="primary" style="margin-bottom:10px;" @click="goToChangeEmail">Change E-mail</ion-button>
        <ion-button expand="block" color="primary" style="margin-bottom:20px;" @click="goToChangePin">Change PIN</ion-button>
        <ion-button color="danger" expand="block" style="margin-bottom:20px;" @click="removeTagFromApp">Remove from App</ion-button>
      </div>
    </ion-content>
    <SeedVaultTabBar />
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Storage } from '@ionic/storage';
import SeedVaultTabBar from '../../components/SeedVaultTabBar.vue';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

const tagId = ref('');
const svTags = ref<{ id: string, email?: string }[]>([]);
const currentIndex = ref<number | null>(null);

const reloadTagData = async () => {
  const tags = await storage.get('sv_tags');
  svTags.value = Array.isArray(tags) ? tags : [];
  currentIndex.value = await storage.get('currentSVTagIndex');
  if (currentIndex.value !== null && svTags.value[currentIndex.value]) {
    tagId.value = svTags.value[currentIndex.value].id;
  } else {
    tagId.value = '';
  }
};

onMounted(reloadTagData);

watch(() => route.path, async (newPath) => {
  if (newPath === '/seed-vault/settings') {
    await reloadTagData();
  }
});

const removeTagFromApp = async () => {
  if (!tagId.value) {
    alert('Tag ID not found.');
    return;
  }
  if (confirm('Are you sure you want to remove this tag from the app?')) {
    let tags = await storage.get('sv_tags');
    tags = Array.isArray(tags) ? tags : [];
    tags = tags.filter((t: any) => t.id !== tagId.value);
    await storage.set('sv_tags', tags);
    await storage.remove('my-secrets');
    await storage.remove('currentSeedPhrase');
    await storage.remove('currentSVTagIndex');
    router.replace('/seed-vault');
  }
};

const goToChangeEmail = () => {
  router.push('/seed-vault/change-email');
};
const goToChangePin = () => {
  router.push('/seed-vault/change-pin');
};
</script>

<style scoped>
</style>