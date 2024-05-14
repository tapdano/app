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
import NFCModal from '@/components/NFCModal.vue';
import { TagParser } from '@/utils/TagParser';
import { addTag } from '@/utils/StorageUtils';

const props = defineProps({
  route: String
});

const router = useRouter();
const routeP = useRoute();
const storage = new Storage();
storage.create();

const tagPrivateKey = ref('');
const tagType = ref(props.route === 'new' ? 'soulbound' : 'extractable');
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const handleSubmit = async () => {
  try {
    if (!nfcModal.value) return;
    if (props.route == 'restore' && tagPrivateKey.value.length != 64) {
      alert('The Private Key must have 64 characters.');
      return;
    }

    let cmd = '00A10000';
    cmd += (props.route == 'new') ? '02' : '34'; //data length
    cmd += (props.route == 'new') ? '01' : '02'; //action
    if (tagType.value == 'soulbound')   cmd += '01';
    if (tagType.value == 'extractable') cmd += '02';
    if (props.route == 'restore') cmd += tagPrivateKey.value;

    const tag = new TagParser(await nfcModal.value.ExecuteCommand(cmd));

    if (tag.TagID != '5444') {
      alert('Unknow Tag. Please use a TapDano Tag.');
      return;
    }

    await addTag(tag);
    router.replace('/tag/main');
  } catch (error) {
    if (error) {
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