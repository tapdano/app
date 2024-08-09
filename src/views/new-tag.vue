<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/my-tags"></ion-back-button>
        </ion-buttons>
        <ion-title v-if="route === 'new'">New Tag</ion-title>
        <ion-title v-if="route === 'restore'">Restore Tag</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <form @submit.prevent="handleSubmit">

          <ion-item v-if="route === 'restore'">
            <ion-textarea v-model="tagPrivateKey" label="Private Key" :label-placement="'stacked'" :auto-grow="true"></ion-textarea>
          </ion-item>

          <ion-item>
            <ion-select v-model="tagType" label="Type">
              <ion-select-option value="soulbound" v-if="route === 'new'">SoulBound</ion-select-option>
              <ion-select-option value="extractable">Extractable</ion-select-option>
            </ion-select>
          </ion-item>

          <ion-button id="submit-button" expand="block" type="submit">{{ route === 'new' ? 'Create a new Tag' : 'Restore Tag' }}</ion-button>
        </form>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonTextarea, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { addTag } from '@/utils/StorageUtils';
import { TapDanoService } from 'tapdano';
import NFCModal from '@/components/NFCModal.vue';

const props = defineProps({
  route: String
});

const router = useRouter();
const routeP = useRoute();
const storage = new Storage();
storage.create();

const tagPrivateKey = ref('');
const tagType = ref((props.route === 'new' ? 'soulbound' : 'extractable') as 'soulbound' | 'extractable');
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const handleSubmit = async () => {
  if (!nfcModal.value) return;
  try {
    if (props.route == 'restore' && tagPrivateKey.value.length != 64) {
      alert('The Private Key must have 64 characters.');
      return;
    }

    const tapDanoService = new TapDanoService();
    nfcModal.value.openModal(1);
    nfcModal.value.onModalClose(() => {
      tapDanoService.cancel();
    });
    const tag = await tapDanoService.burnTag(props.route == 'new' ? 'new' : 'restore', tagType.value, (props.route == 'restore') ? tagPrivateKey.value : undefined);
    nfcModal.value.incrementProgress();
    await nfcModal.value.closeModal(500);

    if (tag.TagID != '5444') {
      alert('Unknow Tag. Please try again with a TapDano Tag.');
      return;
    }

    await addTag(tag);
    router.replace('/tag/main');
  } catch (error) {
    if (error && error != 'canceled') {
      await nfcModal.value.closeModal(0);
      console.error(error);
      alert(error);
    }
  }
}

watch(() => routeP.path, async (newPath) => {
  if ((newPath === '/new-tag') || (newPath === '/restore-tag')) {
    tagPrivateKey.value = '';
    tagType.value = props.route === 'new' ? 'soulbound' : 'extractable';
  }
}, { immediate: true });
</script>

<style scoped>
#submit-button {
  margin-top: 20px;
}
</style>