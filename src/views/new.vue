<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title v-if="route === 'new'">New</ion-title>
        <ion-title v-if="route === 'restore'">Restore</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <form @submit.prevent="handleSubmit">
          <ion-item>
            <ion-input v-model="walletName" label="Name" placeholder="My Investments"></ion-input>
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

          <ion-button id="submit-button" expand="block" type="submit">{{ route === 'new' ? 'Create a new wallet' : 'Restore wallet' }}</ion-button>
        </form>
      </div>
    </ion-content>

    <NFCModal :is-open="showModal" @cancel="handleModalCancel" @dismiss="handleModalDismiss"></NFCModal>

  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';
import { ref, defineProps } from 'vue';
import { useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { createWallet, validateMnemonic } from '@/utils/CryptoUtils';
import { accessNFCTag, cancelNFCTagReading } from '@/utils/NFCUtils';
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
const showModal = ref(false);

const handleModalCancel = () => {
  showModal.value = false;
  cancelNFCTagReading();
};

const handleModalDismiss = () => {
  showModal.value = false;
};

const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value;
};

const handleSubmit = async () => {
  let mnemonic: string | null = null;

  if (props.route == 'restore') {
    mnemonic = walletRecoveryPhrase.value;
    if (!validateMnemonic(mnemonic)) {
      alert('Recovery phrase invalid.');
      return;
    }
  }

  const cryptoWallet = createWallet(mnemonic);
  
  try {
    showModal.value = true;
    await accessNFCTag(cryptoWallet.entropy);
    showModal.value = false;

    const wallets = (await storage.get('wallets')) || [];
    const newIndex = wallets.length;
    const name = walletName.value.trim() || `My Investments #${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    const type = walletType.value || 'nfc-wallet';
    wallets.push({
      name,
      type,
      address: cryptoWallet.address,
      publicKey: cryptoWallet.publicKey
    });

    await storage.set('wallets', wallets);
    await storage.set('currentWallet', newIndex);

    walletName.value = '';
    walletRecoveryPhrase.value = '';
    walletType.value = 'nfc-wallet';
    showAdvancedOptions.value = false;    

    router.push('/wallet/main');
  } catch (error) {
    showModal.value = false;
    console.error(error);
    alert(error);
  }
};

</script>

<style scoped>
#container {
  margin: 20px;
}

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