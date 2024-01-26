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
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonSelect, IonSelectOption, IonButton } from '@ionic/vue';
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import * as bip39 from 'bip39';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-browser';

const router = useRouter();
const storage = new Storage();
storage.create();

const showAdvancedOptions = ref(false);
const walletName = ref('');
const walletType = ref('nfc-wallet');

function harden(num: number) {
  return 0x80000000 + num;
}

const createWalletFromMnemonic = (mnemonic: string) => {
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
    seed,
    Buffer.from('')
  );

  const accountKey = rootKey
    .derive(harden(1852)) // purpose
    .derive(harden(1815)) // coin type (Cardano)
    .derive(harden(0)); // account #0

  const publicKey = accountKey.to_public();

  const address = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.mainnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(publicKey.to_raw_key().hash()),
    CardanoWasm.StakeCredential.from_keyhash(publicKey.to_raw_key().hash())
  ).to_address().to_bech32();

  return {
    mnemonic,
    address,
    publicKey: publicKey.to_bech32(),
    privateKey: rootKey.to_bech32(),
  };
}

const toggleAdvancedOptions = () => {
  showAdvancedOptions.value = !showAdvancedOptions.value;
};

const handleSubmit = async () => {
  let name = walletName.value.trim() || `My Investments #${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
  let type = walletType.value || 'nfc-wallet';

  const mnemonic = bip39.generateMnemonic();
  const wallet = createWalletFromMnemonic(mnemonic);

  const wallets = (await storage.get('wallets')) || [];
  const newIndex = wallets.length;
  wallets.push({ name, type, wallet });

  await storage.set('wallets', wallets);
  await storage.set('currentWallet', newIndex);  

  router.push('/wallet/main');
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