<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/my-tags"></ion-back-button>
        </ion-buttons>
        <ion-title>Tag</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <div>
          <h2>Tag Info:</h2>
          <p>{{ tagInfo }}</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { getCurrentTag } from '@/utils/StorageUtils';

const router = useRouter();
const route = useRoute();
const tagInfo = ref('');

watch(() => route.path, async (newPath) => {
  if (newPath === '/tag/main') {
    const currentTag = await getCurrentTag();
    if (currentTag == null) {
      router.push('/my-tags');
      return;
    }
    tagInfo.value = currentTag.info;
  }
}, { immediate: true });
</script>

<style scoped>
</style>