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
        <ion-button color="danger" @click="lockTag">Lock Tag</ion-button>
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
import { WalletStorageService } from '@/utils/storage-services/WalletStorageService';
import TagTabBar from '../../components/TagTabBar.vue';
import NFCModal from '@/components/NFCModal.vue';
import { TapDanoService } from 'tapdano';
import { UIService } from '@/utils/UIService';

const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const router = useRouter();
const route = useRoute();
const walletStorageService = new WalletStorageService();

watch(() => route.path, async (newPath) => {
  if (newPath === '/tag/settings') {
    const currentTag = await walletStorageService.getCurrentTag();
    if (currentTag == null) {
      router.push('/my-tags');
      return;
    }
  }
}, { immediate: true });

const lockTag = async () => {
  if (!nfcModal.value) return;
  const confirmation = await UIService.showConfirmation('Are you sure you want to LOCK this Tag?');
  if (confirmation) {
    try {
      const tapDanoService = new TapDanoService();
      nfcModal.value.openModal(1);
      nfcModal.value.onModalClose(() => {
        tapDanoService.cancel();
      });
      const tag = await tapDanoService.lockTag();
      nfcModal.value.incrementProgress();
      await nfcModal.value.closeModal(500);
      await walletStorageService.addTag(tag);
      router.replace('/tag/main');
    } catch (error) {
      if (error && error != 'canceled') {
        await nfcModal.value.closeModal(0);
        console.error(error);
        await UIService.showError(error);
      }
    }
  }
}

const formatTag = async () => {
  if (!nfcModal.value) return;
  const confirmation = await UIService.showConfirmation('Are you sure you want to FORMAT this Tag?');
  if (confirmation) {
    try {
      const tapDanoService = new TapDanoService();
      nfcModal.value.openModal(1);
      nfcModal.value.onModalClose(() => {
        tapDanoService.cancel();
      });
      await tapDanoService.formatTag();
      nfcModal.value.incrementProgress();
      await nfcModal.value.closeModal(500);
      const currentTag = await walletStorageService.getCurrentTag();
      if (currentTag?.PublicKey) {
        await walletStorageService.deleteTagByPublicKey(currentTag.PublicKey);
      }
      router.replace('/my-tags');
    } catch (error) {
      if (error && error != 'canceled') {
        await nfcModal.value.closeModal(0);
        console.error(error);
        await UIService.showError(error);
      }
    }
  }
}
</script>

<style scoped>
ion-button[color="danger"] {
  --background: #f1453d;
}

ion-button {
  display: block;
  margin-bottom: 20px;
  height: 60px;
}
</style>