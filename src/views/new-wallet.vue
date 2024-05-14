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
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonTextarea, IonButton } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { createWallet, validateMnemonic } from '@/utils/CryptoUtils';

const props = defineProps({
  route: String
});

const router = useRouter();
const storage = new Storage();
storage.create();

const walletName = ref('');
const walletRecoveryPhrase = ref('');

const handleSubmit = async () => {
  try {
    let mnemonic: string | null = null;

    if (props.route == 'restore') {
      mnemonic = walletRecoveryPhrase.value;
      if (!validateMnemonic(mnemonic)) {
        alert('Recovery phrase invalid.');
        return;
      }
    }

    const cryptoWallet = await createWallet(mnemonic);
    const wallets = (await storage.get('wallets')) || [];
    const newIndex = wallets.length;
    const name = walletName.value.trim() || `TapWallet #${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    wallets.push({
      name,
      ...cryptoWallet,
    });

    await storage.set('wallets', wallets);
    await storage.set('currentWallet', newIndex);

    walletName.value = '';
    walletRecoveryPhrase.value = '';

    router.replace('/wallet/main');
  } catch (error) {
    console.error(error);
    alert(error);
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