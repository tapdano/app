<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Tag Manager</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <h2>Here you can manage your TapDano Tag, set it up, protect it, view linked assets, sign data, and much more.</h2>
        <div id="buttons-box">
          <ion-button expand="block" @click="addTagEvent">Scan a Tag</ion-button>
        </div>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import NFCModal from '@/components/NFCModal.vue';
import { WalletStorageService } from '@/utils/storage-services/WalletStorageService';
import { TapDanoService } from 'tapdano';
import { UIService } from '@/utils/UIService';

const router = useRouter();
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);
const walletStorageService = new WalletStorageService();

const addTagEvent = async () => {
  if (!nfcModal.value) return;
  try {
    const tapDanoService = new TapDanoService();
    nfcModal.value.openModal(1);
    nfcModal.value.onModalClose(() => {
      tapDanoService.cancel();
    });
    const tag = await tapDanoService.readTag();
    nfcModal.value.incrementProgress();
    await nfcModal.value.closeModal(500);

    if (tag.TagID != '5444') {
      await UIService.showError('Unknown Tag. Please use a TapDano Tag.');
      return;
    }

    if (!tag.Burned) {
      router.push('/choose-tag');
    } else {
      await walletStorageService.addTag(tag);
      router.replace('/tag/main');
    }
  } catch (error) {
    if (error && error != 'canceled') {
      await nfcModal.value.closeModal(0);
      console.error(error);
      await UIService.showError(error);
    }
  }
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
