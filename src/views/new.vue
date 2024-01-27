<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>New</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <form @submit.prevent="handleSubmit">
          <ion-item>
            <ion-input v-model="walletName" label="Name" placeholder="My Investments"></ion-input>
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

          <ion-button id="submit-button" expand="block" type="submit">Create a new wallet</ion-button>
        </form>
      </div>
    </ion-content>

    <ion-modal :is-open="showModal" @did-dismiss="showModal = false">
      <ion-header>
        <ion-toolbar>
          <ion-title>Write NFC Wallet</ion-title>
          <ion-buttons slot="primary">
            <ion-button @click="handleCancel">Cancel</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding">
        <ion-img src="/logo.png" style="width: 100%; max-width: 50%; height: auto; margin: 0 auto;"></ion-img>
        <p style="text-align: center;">Approximate your NFC tag to continue</p>
      </ion-content>
    </ion-modal>

  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonModal, IonImg, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import { createWallet } from '@/utils/CryptoUtils';
import { writeNFCTag, cancelNFCTagReading } from '@/utils/NFCUtils';

const router = useRouter();
const storage = new Storage();
storage.create();

const showAdvancedOptions = ref(false);
const walletName = ref('');
const walletType = ref('nfc-wallet');
const showModal = ref(false);

const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value;
};

const handleCancel = () => {
  showModal.value = false;
  cancelNFCTagReading();
};

const handleSubmit = async () => {
  let name = walletName.value.trim() || `My Investments #${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
  let type = walletType.value || 'nfc-wallet';
  
  const cryptoWallet = createWallet();
  
  try {
    showModal.value = true;
    await writeNFCTag(cryptoWallet.entropy);
    showModal.value = false;

    const wallets = (await storage.get('wallets')) || [];
    const newIndex = wallets.length;
    wallets.push({
      name,
      type,
      address: cryptoWallet.address,
      publicKey: cryptoWallet.publicKey
    });

    await storage.set('wallets', wallets);
    await storage.set('currentWallet', newIndex);

    walletName.value = '';
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