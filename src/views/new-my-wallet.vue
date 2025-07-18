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
import { Storage } from '@ionic/storage';
import { createWallet, entropyToMnemonic } from '@/utils/CryptoUtils';
import { TagParser, TapDanoService } from 'tapdano';
import NFCModal from '@/components/NFCModal.vue';

const props = defineProps({
  route: String
});

const router = useRouter();
const storage = new Storage();
storage.create();

const walletName = ref('');
const walletRecoveryPhrase = ref('');
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

async function addMyWallet(tag: TagParser, name: string | undefined) {
  const storage = new Storage();
  await storage.create();
  
  const wallets = (await storage.get('my-wallets')) || [];

  const mnemonic = entropyToMnemonic(tag.PrivateKey as string);
  const cryptoWallet = await createWallet(mnemonic);

  const index = wallets.findIndex((item: any) => {
    return item.baseAddr == cryptoWallet.baseAddr;
  });

  if (index != -1) {
    await storage.set('currentMyWallet', index);
    return;
  }
  
  const newIndex = wallets.length;
  wallets.push({
    name: name || `TapWallet #${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
    tag,
    ...cryptoWallet,
  });

  await storage.set('my-wallets', wallets);
  await storage.set('currentMyWallet', newIndex);
}

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
      alert('Unknow Tag. Please try again with a TapDano Tag.');
      return;
    }

    await addMyWallet(tag, walletName.value.trim());

    walletName.value = '';
    walletRecoveryPhrase.value = '';

    router.replace('/my-wallet/main');
  } catch (error) {
    if (error && error != 'canceled') {
      await nfcModal.value.closeModal(0);
      console.error(error);
      alert(error);
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