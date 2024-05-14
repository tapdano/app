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
        <ion-button color="danger" @click="deleteTag">Delete Tag</ion-button>
        <ion-button color="danger" @click="formatTag">Format Tag</ion-button>
      </div>
    </ion-content>
    <TagTabBar />
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { getCurrentTag, deleteTagByPublicKey } from '@/utils/StorageUtils';
import TagTabBar from '../../components/TagTabBar.vue';
import NFCModal from '@/components/NFCModal.vue';
import { TagParser } from '@/utils/TagParser';

const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

watch(() => route.path, async (newPath) => {
  if (newPath === '/tag/settings') {
    const currentTag = await getCurrentTag();
    if (currentTag == null) {
      router.push('/my-tags');
      return;
    }
  }
}, { immediate: true });

const deleteTag = async () => {
  const confirmation = confirm('Are you sure you want to DELETE this Tag?');
  if (confirmation) {
    const currentTag = await getCurrentTag();
    await deleteTagByPublicKey(currentTag.PublicKey);
    router.replace('/my-tags');
  }
}

const formatTag = async () => {
  if (!nfcModal.value) return;
  const confirmation = confirm('Are you sure you want to FORMAT this Tag?');
  if (confirmation) {
    const cmd = "00A30000";
    const tag = new TagParser(await nfcModal.value.ExecuteCommand(cmd));

    console.log(tag);

    const currentTag = await getCurrentTag();
    await deleteTagByPublicKey(currentTag.PublicKey);
    router.replace('/my-tags');
  }
}
</script>

<style scoped>
ion-button[color="danger"] {
  --background: #f1453d;
}
</style>