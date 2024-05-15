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
          <div class="tag-info">
            <div v-for="(value, key) in tagInfo" :key="key" class="tag-info-item">
              <span class="tag-key">{{ key }}:</span> 
              <span class="tag-value">{{ value }}</span>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
    <TagTabBar />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { getCurrentTag } from '@/utils/StorageUtils';
import TagTabBar from '@/components/TagTabBar.vue';

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
    tagInfo.value = currentTag;
  }
}, { immediate: true });
</script>

<style scoped>
#container {
  padding: 16px;
}

.tag-info {
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
}

.tag-info-item {
  margin-bottom: 8px;
}

.tag-key {
  font-weight: bold;
  color: #333;
}

.tag-value {
  color: #666;
}
</style>