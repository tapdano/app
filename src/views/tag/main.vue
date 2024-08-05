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
        <ion-list>
          <ion-item v-for="(value, key) in tagInfo" :key="key">
            <ion-label>
              <h3>{{ key }}</h3>
              <p>{{ value }}</p>
            </ion-label>
            <ion-button fill="clear" slot="end" @click="() => copyToClipboard(value)">
              <ion-icon slot="icon-only" :icon="copyOutline"></ion-icon>
            </ion-button>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
    <TagTabBar />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonTextarea, IonItem, IonList, IonLabel, IonButton, IonIcon } from '@ionic/vue';
import { getCurrentTag } from '@/utils/StorageUtils';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import TagTabBar from '@/components/TagTabBar.vue';
import { TagParser } from '@/utils/TagParser';
import { copyOutline } from 'ionicons/icons';

const router = useRouter();
const route = useRoute();
const tagInfo = ref({});

watch(() => route.path, async (newPath) => {
  if (newPath === '/tag/main') {
    const currentTag = await getCurrentTag();
    if (currentTag == null) {
      router.push('/my-tags');
      return;
    }
    tagInfo.value = currentTag;
  }
}, { immediate: true });
</script>

<style scoped>
#container {
  padding: 16px;
}

ion-list p {
  max-width: 270px;
}
</style>