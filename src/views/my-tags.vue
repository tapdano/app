<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>My Tags</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
        <div v-else-if="tags.length === 0" class="no-items-message">No Tags here! Tap below to add your first Tag.</div>
        <div v-else>
          <ion-list>
            <ion-item v-for="(tag, index) in tags" :key="index" @click="selectTag(index)">
              {{ (tag as any).name }}
            </ion-item>
          </ion-list>
          <div id="buttons-box">
            <ion-button expand="block" @click="$router.push('/new-tag')">Add a Tag</ion-button>
          </div>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonButton } from '@ionic/vue';
import { Storage } from '@ionic/storage';

const storage = new Storage();
storage.create();

const router = useRouter();
const route = useRoute();
const tags = ref([]);
const loading = ref(true);

const load = async () => {
  loading.value = true;
  const storedTags = await storage.get('tags') || [];
  tags.value = storedTags;
  loading.value = false;
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/my-tags') {
    await load();
  }
}, { immediate: true });

const selectTag = async (index: number) => {
  await storage.set('currentTag', index);
  router.push('/tag/main');
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
