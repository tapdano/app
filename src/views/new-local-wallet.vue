<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/local-wallets"></ion-back-button>
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
import { WalletStorageService } from '@/utils/storage-services/WalletStorageService';
import { UIService } from '@/utils/UIService';
import { createWallet, validateMnemonic } from '@/utils/CryptoUtils';

const props = defineProps({
  route: String
});

const router = useRouter();
const walletStorageService = new WalletStorageService();

const walletName = ref('');
const walletRecoveryPhrase = ref('');

const handleSubmit = async () => {
  try {
    let mnemonic: string | null = null;

    if (props.route == 'restore') {
      mnemonic = walletRecoveryPhrase.value;
      if (!validateMnemonic(mnemonic)) {
        await UIService.showError('Recovery phrase invalid.');
        return;
      }
    }

    const cryptoWallet = await createWallet(mnemonic);
    const name = walletName.value.trim() || `TapWallet #${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    
    const wallet = {
      name,
      ...cryptoWallet,
    };

    await walletStorageService.addLocalWallet(wallet);

    walletName.value = '';
    walletRecoveryPhrase.value = '';

    router.replace('/local-wallet/main');
  } catch (error) {
    console.error(error);
    await UIService.showError(error);
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