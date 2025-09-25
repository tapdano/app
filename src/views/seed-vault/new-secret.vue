<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault/main"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ pageTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <form @submit.prevent="handleSubmit">
          <ion-item>
            <ion-input v-model="name" label="Name" placeholder="Enter a name for this seed phrase"></ion-input>
          </ion-item>
          <ion-item class="seed-phrase-item">
            <ion-textarea 
              v-model="seedPhrase" 
              label="Seed Phrase" 
              :placeholder="seedPhrasePlaceholder"
              :auto-grow="true"
              :rows="4"
              :readonly="isCreateMode"
            ></ion-textarea>
          </ion-item>
          <div v-if="isCreateMode" class="generate-section">
            <ion-button 
              expand="block" 
              fill="outline" 
              @click="generateNewSeedPhrase"
              :disabled="isLoading"
            >
              Generate New Seed Phrase
            </ion-button>
          </div>
          <ion-button 
            id="submit-button" 
            expand="block" 
            type="submit"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Saving...' : 'Save' }}
          </ion-button>
        </form>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonTextarea, IonButton } from '@ionic/vue';
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import CryptoJS from 'crypto-js';
import { getSimulateNFCTag } from '@/utils/StorageUtils';
import { MobileNDEFService } from '@/utils/MobileNDEFService';
import NFCModal from '@/components/NFCModal.vue';
import { StorageService } from '@/utils/StorageService';
import { ValidationService } from '@/utils/ValidationService';
import { UIService } from '@/utils/UIService';
import { AppWallet } from '@meshsdk/core';
import { validateMnemonic } from '@/utils/CryptoUtils';

const router = useRouter();
const route = useRoute();
const storageService = new StorageService();

const name = ref('');
const seedPhrase = ref('');
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);
const isLoading = ref(false);

// Check if we're in create mode based on query parameter
const isCreateMode = computed(() => route.query.mode === 'create');

const pageTitle = computed(() => 
  isCreateMode.value ? 'Create Wallet' : 'Import Wallet'
);

const seedPhrasePlaceholder = computed(() => 
  isCreateMode.value 
    ? 'Click "Generate New Seed Phrase" to create a new wallet' 
    : 'Enter your existing seed phrase'
);

// Generate a new seed phrase on mount if in create mode
onMounted(() => {
  if (isCreateMode.value) {
    generateNewSeedPhrase();
  }
});

const generateNewSeedPhrase = () => {
  try {
    const newSeedPhrase = AppWallet.brew().join(' ');
    seedPhrase.value = newSeedPhrase;
  } catch (error) {
    UIService.showError('Error generating seed phrase: ' + error);
  }
};

const handleSubmit = async () => {
  if (isLoading.value) return;
  
  // Validate inputs
  const nameValidation = ValidationService.validateRequiredField(name.value, 'Name');
  if (!nameValidation.isValid) {
    UIService.showError(nameValidation.error);
    return;
  }
  
  const seedPhraseValidation = ValidationService.validateRequiredField(seedPhrase.value, 'Seed Phrase');
  if (!seedPhraseValidation.isValid) {
    UIService.showError(seedPhraseValidation.error);
    return;
  }

  // Validate seed phrase format (for both import and create modes)
  if (!validateMnemonic(seedPhrase.value)) {
    UIService.showError('Invalid seed phrase format. Please check your seed phrase.');
    return;
  }
  
  isLoading.value = true;
  
  try {
    await saveSecret({
      name: name.value,
      seedPhrase: seedPhrase.value,
    });
    
    const successMessage = isCreateMode.value 
      ? 'Wallet created successfully!'
      : 'Seed phrase imported successfully!';
    
    UIService.showSuccess(successMessage);
    router.replace('/seed-vault/main');
  } catch (error) {
    console.error(error);
    UIService.showError(String(error));
  } finally {
    isLoading.value = false;
  }
};

const saveSecret = async (newSecretObj: any) => {
  const currentTag = await storageService.getCurrentTag();
  
  if (!currentTag) {
    throw new Error('No current tag found');
  }
  
  const isSimulate = await getSimulateNFCTag();
  
  if (isSimulate) {
    await saveToEncryptedStorage(newSecretObj, currentTag.tag.seedVaultKey);
  } else {
    await saveToNFCTag(newSecretObj, currentTag);
  }
};

const saveToEncryptedStorage = async (newSecretObj: any, key: string) => {
  if (!key) {
    throw new Error('Authentication key not found.');
  }
  
  const existingEncrypted = await storageService.get('my-secrets') as string;
  let secretsArr = [];
  
  if (existingEncrypted) {
    try {
      const bytes = CryptoJS.AES.decrypt(existingEncrypted, key);
      const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
      secretsArr = JSON.parse(decryptedData);
    } catch (e) {
      console.warn('Failed to decrypt existing secrets, starting fresh');
      secretsArr = [];
    }
  }
  
  secretsArr.push(newSecretObj);
  const encrypted = CryptoJS.AES.encrypt(JSON.stringify(secretsArr), key).toString();
  await storageService.set('my-secrets', encrypted);
};

const saveToNFCTag = async (newSecretObj: any, currentTagData: any) => {
  if (!nfcModal.value) throw new Error('NFC Modal not available');

  const updatedTag = { ...currentTagData.tag };
  
  try {
    nfcModal.value.openModal(2); // 2 steps: read + write
    const mobileNDEFService = new MobileNDEFService();
    
    nfcModal.value.onModalClose(() => {
      mobileNDEFService.cancel();
    });
    
    const tagData = await mobileNDEFService.read();
    nfcModal.value.incrementProgress();

    alert('Tag read successfully, preparing to write...');

    updatedTag.labels = tagData.labels || [];
    updatedTag.labels.push(newSecretObj.name);
    await storageService.updateCurrentTag(updatedTag);

    let currentSecrets = tagData.secrets || [];
    currentSecrets.push(CryptoJS.AES.encrypt(newSecretObj.seedPhrase, updatedTag.seedVaultKey).toString());
    
    console.log('Gravando tag com os seguintes dados:', {
      id: updatedTag.id,
      labels: updatedTag.labels,
      secrets: currentSecrets,
    });

    await mobileNDEFService.write(
      updatedTag.id,
      updatedTag.labels,
      currentSecrets,
      false
    );
    nfcModal.value.incrementProgress();
    await nfcModal.value.closeModal(500);
  } catch (error) {
    if (error && error !== 'canceled') {
      await nfcModal.value.closeModal(0);
      throw new Error('Error updating NFC tag: ' + error);
    }
  }
};
</script>

<style scoped>
#submit-button {
  margin-top: 20px;
}

.seed-phrase-item {
  --min-height: 120px;
}

.seed-phrase-item ion-textarea {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.4;
}

.generate-section {
  margin: 15px 0;
}

#container {
  padding: 20px;
}

ion-item {
  margin-bottom: 15px;
  --border-radius: 8px;
  --background: #f8f9fa;
  --border-color: #e0e0e0;
  color: black;
}

ion-button {
  --border-radius: 8px;
}

ion-button[fill="outline"] {
  --color: #3880ff;
  --border-color: #3880ff;
}
</style>