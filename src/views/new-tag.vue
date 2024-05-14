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
          <ion-item>
            <ion-input v-model="walletName" label="Name" placeholder="TapWallet Name"></ion-input>
          </ion-item>

          <ion-item v-if="route === 'restore'">
            <ion-textarea v-model="walletRecoveryPhrase" label="Recovery phrase" :label-placement="'stacked'" :auto-grow="true"></ion-textarea>
          </ion-item>

          <div id="advanced-options" @click="toggleAdvancedOptions">
            <span class="link-style">Advanced Options</span>
          </div>
          <div v-show="showAdvancedOptions">
            <ion-item>
              <ion-select v-model="walletType" label="Type">
                <ion-select-option value="nfc-wallet">NFC Wallet</ion-select-option>
                <ion-select-option value="nfc-authentication">NFC Authentication</ion-select-option>
              </ion-select>
            </ion-item>
          </div>

          <ion-button id="submit-button" expand="block" type="submit">{{ route === 'new' ? 'Create a new Tag' : 'Restore Tag' }}</ion-button>
        </form>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import NFCModal from '@/components/NFCModal.vue';

const props = defineProps({
  route: String
});

const router = useRouter();
const storage = new Storage();
storage.create();

const showAdvancedOptions = ref(false);
const walletName = ref('');
const walletRecoveryPhrase = ref('');
const walletType = ref('nfc-wallet');
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value;
};

const handleSubmit = async () => {
  try {
    if (!nfcModal.value) return;

    //if (props.route == 'restore') {

    const tagInfo = await nfcModal.value.ExecuteCommand("00A10000");

    if (tagInfo.length != 128) {
      alert(tagInfo);
      return;
    }

    const tags = (await storage.get('tags')) || [];
    const newIndex = tags.length;
    tags.push({
      info: tagInfo
    });

    await storage.set('tags', tags);
    await storage.set('currentTag', newIndex);

    walletName.value = '';
    walletRecoveryPhrase.value = '';
    walletType.value = 'nfc-wallet';
    showAdvancedOptions.value = false;    

    router.push('/tag/main');
  } catch (error) {
    console.error(error);
    alert(error);
  }
}
</script>

<style scoped>
#advanced-options {
  margin: 20px 0;
  align-items: center;
  font-size: 12px;
  text-align: right;
}

.link-style {
  text-decoration: underline;
}

#submit-button {
  margin-top: 20px;
}
</style>