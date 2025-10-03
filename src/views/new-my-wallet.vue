<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/my-wallets"></ion-back-button>
        </ion-buttons>
        <ion-title v-if="route === 'new'">New Wallet</ion-title>
        <ion-title v-if="route === 'restore'">Restore Wallet</ion-title>
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
          <ion-button id="submit-button" expand="block" type="submit">{{ route === 'new' ? 'Create a new wallet' : 'Restore wallet' }}</ion-button>
        </form>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonTextarea, IonButton } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { TapDanoService } from 'tapdano';
import { UIService } from '@/utils/UIService';
import NFCModal from '@/components/NFCModal.vue';
import { WalletStorageService } from '@/utils/storage-services/WalletStorageService';

const props = defineProps({
  route: String
});

const router = useRouter();
const walletStorageService = new WalletStorageService();

const walletName = ref('');
const walletRecoveryPhrase = ref('');
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const handleSubmit = async () => {
  if (!nfcModal.value) return;
  try {
    const tapDanoService = new TapDanoService();
    nfcModal.value.openModal(1);
    nfcModal.value.onModalClose(() => {
      tapDanoService.cancel();
    });
    const tag = await tapDanoService.burnTag('new', 'extractable');
    nfcModal.value.incrementProgress();
    await nfcModal.value.closeModal(500);

    if (tag.TagID != '5444') {
      await UIService.showError('Unknown Tag. Please try again with a TapDano Tag.');
      return;
    }

    await walletStorageService.addMyWallet(tag, walletName.value.trim());

    walletName.value = '';
    walletRecoveryPhrase.value = '';

    router.replace('/my-wallet/main');
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