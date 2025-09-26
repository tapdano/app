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
      <div class="main-container">
        <!-- Header Section -->
        <div class="header-section">
          <ion-icon :icon="isCreateMode ? createOutline : downloadOutline" class="header-icon"></ion-icon>
          <h1 class="header-title">{{ pageTitle }}</h1>
          <p class="header-description">
            {{ isCreateMode ? 'Generate a new secure wallet' : 'Import your existing wallet' }}
          </p>
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- Wallet Name -->
          <ion-item class="form-item" :class="{ 'ion-invalid': nameError }">
            <ion-label position="stacked">Wallet Name</ion-label>
            <ion-input 
              v-model="name" 
              placeholder="Enter a name for this wallet"
              @ionInput="validateName"
              @ionBlur="validateName"
            ></ion-input>
            <ion-note slot="error" v-if="nameError">{{ nameError }}</ion-note>
          </ion-item>

          <!-- Wallet Type -->
          <ion-item class="form-item" :class="{ 'ion-invalid': walletTypeError }">
            <ion-label position="stacked">Wallet Type</ion-label>
            <ion-select 
              v-model="walletType" 
              placeholder="Select wallet type"
              @ionChange="validateWalletType"
            >
              <ion-select-option v-for="type in walletTypes" :key="type.id" :value="type.id">
                {{ type.icon }} {{ type.name }}
              </ion-select-option>
            </ion-select>
            <ion-note slot="error" v-if="walletTypeError">{{ walletTypeError }}</ion-note>
          </ion-item>

          <!-- Seed Phrase -->
          <ion-item class="form-item seed-phrase-item" :class="{ 'ion-invalid': seedPhraseError }">
            <ion-label position="stacked">Wallet Seed Phrase</ion-label>
            <ion-textarea 
              v-model="seedPhrase" 
              :placeholder="seedPhrasePlaceholder"
              :auto-grow="true"
              :rows="4"
              :readonly="isCreateMode"
              @ionInput="validateSeedPhrase"
              @ionBlur="validateSeedPhrase"
            ></ion-textarea>
            <ion-note slot="error" v-if="seedPhraseError">{{ seedPhraseError }}</ion-note>
          </ion-item>

          <!-- Generate Button (Create Mode) -->
          <div v-if="isCreateMode" class="generate-section">
            <ion-button 
              expand="block" 
              fill="outline" 
              @click="generateNewSeedPhrase"
              :disabled="isLoading"
              class="generate-button"
            >
              <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
              Generate New Wallet
            </ion-button>
          </div>

          <!-- Strength Indicator -->
          <div v-if="seedPhrase && !isCreateMode" class="strength-section">
            <div class="strength-indicator">
              <ion-label>Seed Phrase Strength</ion-label>
              <ion-progress-bar 
                :value="seedPhraseStrength" 
                :color="strengthColor"
              ></ion-progress-bar>
              <span class="strength-text">{{ strengthText }}</span>
            </div>
          </div>

          <!-- Security Warning -->
          <div class="security-warning">
            <ion-icon :icon="warningOutline" class="warning-icon"></ion-icon>
            <p>Never share your seed phrase with anyone. Keep it safe and secure.</p>
          </div>

          <!-- Submit Button -->
          <ion-button 
            expand="block" 
            type="submit"
            :disabled="isLoading || !isFormValid"
            class="submit-button"
          >
            <ion-spinner v-if="isLoading" name="crescent" slot="start"></ion-spinner>
            <ion-icon v-else :icon="checkmarkOutline" slot="start"></ion-icon>
            {{ isLoading ? 'Saving...' : 'Save Wallet' }}
          </ion-button>
        </form>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonTextarea, IonButton, IonSelect, IonSelectOption, IonIcon, IonLabel, IonNote, IonSpinner, IonProgressBar } from '@ionic/vue';
import { createOutline, downloadOutline, refreshOutline, checkmarkOutline, warningOutline } from 'ionicons/icons';
import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import CryptoJS from 'crypto-js';
import { getSimulateNFCTag } from '@/utils/StorageUtils';
import { MobileNDEFService } from '@/utils/MobileNDEFService';
import NFCModal from '@/components/NFCModal.vue';
import { StorageService } from '@/utils/StorageService';
import { ValidationService } from '@/utils/ValidationService';
import { UIService } from '@/utils/UIService';
import { AppWallet } from '@meshsdk/core';
import { validateMnemonic, generateMnemonic } from '@/utils/CryptoUtils';
import { WALLET_TYPES } from '@/utils/WalletTypes';

const router = useRouter();
const route = useRoute();
const storageService = new StorageService();

const name = ref('');
const seedPhrase = ref('');
const walletType = ref('cardano'); // Default to Cardano
const walletTypes = ref(WALLET_TYPES);
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);
const isLoading = ref(false);

// Validation states
const nameError = ref('');
const walletTypeError = ref('');
const seedPhraseError = ref('');

// Computed properties
const isCreateMode = computed(() => route.query.mode === 'create');

const pageTitle = computed(() => 
  isCreateMode.value ? 'Create Wallet' : 'Import Wallet'
);

const seedPhrasePlaceholder = computed(() => 
  isCreateMode.value 
    ? 'Click "Generate New Wallet" to create a new wallet' 
    : 'Enter your existing wallet seed phrase'
);

// Form validation
const isFormValid = computed(() => {
  return name.value.trim() && 
         walletType.value && 
         seedPhrase.value.trim() && 
         !nameError.value && 
         !walletTypeError.value && 
         !seedPhraseError.value;
});

// Seed phrase strength calculation
const seedPhraseStrength = computed(() => {
  if (!seedPhrase.value || isCreateMode.value) return 0;
  
  const words = seedPhrase.value.trim().split(/\s+/);
  const wordCount = words.length;
  
  // Basic strength calculation based on word count
  if (wordCount < 12) return 0.3;
  if (wordCount < 15) return 0.6;
  if (wordCount < 18) return 0.8;
  if (wordCount < 21) return 0.9;
  return 1.0;
});

const strengthColor = computed(() => {
  const strength = seedPhraseStrength.value;
  if (strength < 0.5) return 'danger';
  if (strength < 0.8) return 'warning';
  return 'success';
});

const strengthText = computed(() => {
  const strength = seedPhraseStrength.value;
  if (strength < 0.5) return 'Weak';
  if (strength < 0.8) return 'Good';
  return 'Strong';
});

// Validation functions
const validateName = () => {
  if (!name.value.trim()) {
    nameError.value = 'Wallet name is required';
    return;
  }
  if (name.value.trim().length < 2) {
    nameError.value = 'Wallet name must be at least 2 characters';
    return;
  }
  nameError.value = '';
};

const validateWalletType = () => {
  if (!walletType.value) {
    walletTypeError.value = 'Please select a wallet type';
    return;
  }
  walletTypeError.value = '';
};

const validateSeedPhrase = () => {
  if (!seedPhrase.value.trim()) {
    seedPhraseError.value = 'Seed phrase is required';
    return;
  }
  
  if (!validateMnemonic(seedPhrase.value, walletType.value)) {
    const walletTypeName = walletTypes.value.find(type => type.id === walletType.value)?.name || 'wallet';
    seedPhraseError.value = `Invalid ${walletTypeName} seed phrase format`;
    return;
  }
  
  seedPhraseError.value = '';
};

// Generate a new wallet on mount if in create mode
onMounted(() => {
  if (isCreateMode.value) {
    generateNewSeedPhrase();
  }
});

// Watch for wallet type changes and regenerate seed phrase in create mode
watch(walletType, () => {
  if (isCreateMode.value) {
    generateNewSeedPhrase();
  }
});

const generateNewSeedPhrase = () => {
  try {
    const newSeedPhrase = generateMnemonic(walletType.value);
    seedPhrase.value = newSeedPhrase;
  } catch (error) {
    UIService.showError('Error generating wallet: ' + error);
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
  
  const seedPhraseValidation = ValidationService.validateRequiredField(seedPhrase.value, 'Wallet Seed Phrase');
  if (!seedPhraseValidation.isValid) {
    UIService.showError(seedPhraseValidation.error);
    return;
  }

  const walletTypeValidation = ValidationService.validateRequiredField(walletType.value, 'Wallet Type');
  if (!walletTypeValidation.isValid) {
    UIService.showError(walletTypeValidation.error);
    return;
  }

  // Validate wallet seed phrase format (for both import and create modes)
  if (!validateMnemonic(seedPhrase.value, walletType.value)) {
    const walletTypeName = walletTypes.value.find(type => type.id === walletType.value)?.name || 'wallet';
    UIService.showError(`Invalid ${walletTypeName} seed phrase format. Please check your seed phrase.`);
    return;
  }
  
  isLoading.value = true;
  
  try {
    await saveSecret({
      name: name.value,
      seedPhrase: seedPhrase.value,
      walletType: walletType.value,
    });
    
    const successMessage = isCreateMode.value 
      ? 'Wallet created successfully!'
      : 'Wallet imported successfully!';
    
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
    
    updatedTag.chains = tagData.chains || [];
    updatedTag.chains.push(newSecretObj.walletType);
    
    await storageService.updateCurrentTag(updatedTag);

    let currentSecrets = tagData.secrets || [];
    currentSecrets.push(CryptoJS.AES.encrypt(newSecretObj.seedPhrase, updatedTag.seedVaultKey).toString());
    
    console.log('Gravando tag com os seguintes dados:', {
      id: updatedTag.id,
      labels: updatedTag.labels,
      chains: updatedTag.chains,
      secrets: currentSecrets,
    });

    await mobileNDEFService.write(
      updatedTag.id,
      updatedTag.labels,
      currentSecrets,
      updatedTag.chains,
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
.main-container {
  padding: var(--spacing-lg);
  max-width: 600px;
  margin: 0 auto;
}

.header-section {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--ion-color-light);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--ion-color-light-shade);
}

.header-icon {
  font-size: 48px;
  color: var(--ion-color-primary);
  margin-bottom: var(--spacing-md);
}

.header-title {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 24px;
  font-weight: var(--font-weight-bold);
  color: var(--ion-color-dark);
}

.header-description {
  margin: 0;
  font-size: 16px;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.form-item {
  margin-bottom: var(--spacing-md);
  --border-radius: var(--border-radius-md);
  --background: var(--ion-color-background);
  --border-color: var(--ion-color-light-shade);
  --border-width: 1px;
  --border-style: solid;
  --padding-start: var(--spacing-md);
  --padding-end: var(--spacing-md);
  --padding-top: var(--spacing-sm);
  --padding-bottom: var(--spacing-sm);
}

.form-item.ion-invalid {
  --border-color: var(--ion-color-danger);
}

.seed-phrase-item {
  --min-height: 120px;
}

.seed-phrase-item ion-textarea {
  font-family: var(--font-family-mono);
  font-size: 14px;
  line-height: 1.4;
}

.generate-section {
  margin: var(--spacing-md) 0;
}

.generate-button {
  --border-radius: var(--border-radius-md);
  --padding-top: var(--spacing-md);
  --padding-bottom: var(--spacing-md);
  font-weight: var(--font-weight-medium);
}

.strength-section {
  margin: var(--spacing-md) 0;
  padding: var(--spacing-md);
  background: var(--ion-color-light);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--ion-color-light-shade);
}

.strength-indicator {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.strength-indicator ion-label {
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--ion-color-dark);
}

.strength-text {
  font-size: 12px;
  font-weight: var(--font-weight-semibold);
  text-align: right;
  margin-top: var(--spacing-xs);
}

.security-warning {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-sm);
  margin: var(--spacing-lg) 0;
  padding: var(--spacing-md);
  background: var(--ion-color-warning-tint);
  border-radius: var(--border-radius-md);
  color: white;
}

.warning-icon {
  font-size: 36px;
  color: white;
  margin-top: 2px;
}

.security-warning p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.submit-button {
  --border-radius: var(--border-radius-md);
  --padding-top: var(--spacing-md);
  --padding-bottom: var(--spacing-md);
  font-weight: var(--font-weight-semibold);
  margin-top: var(--spacing-lg);
}

/* Responsive design */
@media (max-width: 480px) {
  .main-container {
    padding: var(--spacing-md);
  }
  
  .header-section {
    padding: var(--spacing-md);
  }
  
  .header-title {
    font-size: 20px;
  }
  
  .header-description {
    font-size: 14px;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .header-section {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .form-item {
    --background: var(--ion-color-surface);
    --border-color: var(--ion-color-medium);
  }
  
  .strength-section {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .security-warning {
    background: var(--ion-color-warning-shade);
    color: white;
  }
}
</style>