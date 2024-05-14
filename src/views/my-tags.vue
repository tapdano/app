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
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <div v-if="tags.length === 0" class="no-items-message">No Tags here! Tap below to add your first Tag.</div>
          <div v-else>
            <ion-list>
              <ion-item v-for="(tag, index) in tags" :key="index" @click="selectTag(index)">
                {{ (tag as any).name }}
              </ion-item>
            </ion-list>
          </div>
          <div id="buttons-box">
            <ion-button expand="block" @click="addTag">Add a Tag</ion-button>
          </div>
        </div>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonButton } from '@ionic/vue';
import { Storage } from '@ionic/storage';
import NFCModal from '@/components/NFCModal.vue';

const storage = new Storage();
storage.create();

const router = useRouter();
const route = useRoute();
const tags = ref([]);
const loading = ref(true);
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const load = async () => {
  loading.value = true;
  const storedTags = await storage.get('tags') || [];
  tags.value = storedTags;
  loading.value = false;
};

const addTag = async () => {
  try {
    if (!nfcModal.value) return;

    let tagInfo = await nfcModal.value.ExecuteCommand("00A00000");
    alert(tagInfo);

    tagInfo = await nfcModal.value.ExecuteCommand("00A10000");
    alert(tagInfo);

    tagInfo = await nfcModal.value.ExecuteCommand("00A200000165");
    alert(tagInfo);

    //router.push('/new-tag');
  } catch (error) {
    console.error(error);
    alert(error);
  }
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
