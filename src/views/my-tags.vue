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
import { Storage } from '@ionic/storage';
import NFCModal from '@/components/NFCModal.vue';
import { addTag } from '@/utils/StorageUtils';

const storage = new Storage();
storage.create();

const router = useRouter();
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const addTagEvent = async () => {
  try {
    if (!nfcModal.value) return;

    const tag = await nfcModal.value.ExecuteCommand();

    if (tag.TagID != '5444') {
      alert('Unknow Tag. Please use a TapDano Tag.');
      return;
    }

    if (!tag.Burned) {
      router.push('/choose-tag');
    } else {
      await addTag(tag);
      router.replace('/tag/main');
    }
  } catch (error) {
    if (error) {
      console.error(error);
      alert(error);
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
