<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault/main"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ name || 'Unnamed Wallet' }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div class="main-container">
        <!-- Wallet Info Section -->
        <div class="wallet-info-section">
          <div class="wallet-header">
            <span class="wallet-icon">{{ getWalletTypeIcon(walletType) }}</span>
            <div class="wallet-details">
              <h2 class="wallet-name">{{ name || 'Unnamed Wallet' }}</h2>
              <p class="wallet-type">{{ getWalletTypeName(walletType) }}</p>
            </div>
          </div>
        </div>

        <!-- Wallet Address Section -->
        <div class="address-section" v-if="walletAddress">
          <h3 class="field-label">
            <ion-icon :icon="locationOutline"></ion-icon>
            Wallet Address
          </h3>
          <div class="address-container">
            <div class="address-display">{{ walletAddress }}</div>
            <ion-button 
              fill="outline" 
              size="small"
              @click="copyAddress"
              class="copy-address-button"
              :aria-label="`Copy ${name} address`"
            >
              <ion-icon slot="icon-only" :icon="copyOutline"></ion-icon>
            </ion-button>
          </div>
        </div>

        <!-- Wallet Seed Phrase Section -->
        <div class="seed-phrase-section" v-if="seedPhraseWords.length > 0">
          <h3 class="field-label">
            <ion-icon :icon="shieldOutline"></ion-icon>
            Recovery Phrase
          </h3>
          
          <!-- Grid responsivo melhorado -->
          <div class="words-container">
            <div 
              v-for="(word, index) in seedPhraseWords" 
              :key="index"
              class="word-card"
              @click="copyWord(word, index + 1)"
              :aria-label="`Copy word ${index + 1}: ${word}`"
            >
              <div class="word-number">{{ index + 1 }}</div>
              <div class="word-text">{{ word }}</div>
              <ion-icon :icon="copyOutline" class="copy-icon" aria-hidden="true"></ion-icon>
            </div>
          </div>
          
          <!-- Copy All Button -->
          <div class="copy-all-section">
            <ion-button 
              fill="solid" 
              color="primary"
              @click="copyFullSeedPhrase"
              :disabled="!seedPhrase"
              class="copy-all-button"
            >
              <ion-icon slot="start" :icon="copyOutline"></ion-icon>
              Copy All Words
            </ion-button>
          </div>
          
          <!-- Warning sobre segurança -->
          <ion-note color="warning" class="security-warning">
            <ion-icon :icon="warningOutline"></ion-icon>
            Never share your recovery phrase with anyone
          </ion-note>
        </div>

        <!-- Empty state -->
        <div v-else class="empty-seed-phrase">
          <ion-icon :icon="keyOutline" class="empty-icon"></ion-icon>
          <p>No wallet seed phrase available</p>
        </div>

        <!-- Delete Button -->
        <ion-button 
          expand="block" 
          color="danger" 
          fill="outline"
          @click="deleteSecret"
          class="delete-button"
        >
          <ion-icon slot="start" :icon="trashOutline"></ion-icon>
          Delete Wallet
        </ion-button>
      </div>
    </ion-content>
    
    <!-- Toast for copy feedback -->
    <ion-toast
      :is-open="isToastOpen"
      :message="toastMessage"
      :duration="2000"
      position="top"
      color="success"
      @didDismiss="isToastOpen = false"
    ></ion-toast>
    
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton, IonIcon, IonToast } from '@ionic/vue';
import { copyOutline, keyOutline, locationOutline, shieldOutline, warningOutline, trashOutline } from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import CryptoJS from 'crypto-js';
import { getSimulateNFCTag } from '@/utils/StorageUtils';
import { ensureSerializableTags } from '@/utils/SeedVaultUtils';
import { MobileNDEFService } from '@/utils/MobileNDEFService';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import NFCModal from '@/components/NFCModal.vue';
import { getWalletTypeIcon, getWalletTypeName } from '@/utils/WalletTypes';
import { generateWalletAddress } from '@/utils/CryptoUtils';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

const secrets = ref([]);
const name = ref('');
const seedPhrase = ref('');
const walletType = ref('cardano');
const walletAddress = ref('');
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);
const isToastOpen = ref(false);
const toastMessage = ref('');

// Computed property to split wallet seed phrase into words
const seedPhraseWords = computed(() => {
  if (!seedPhrase.value) return [];
  return seedPhrase.value.trim().split(/\s+/).filter(word => word.length > 0);
});

// Show toast notification
const showToast = (message: string) => {
  toastMessage.value = message;
  isToastOpen.value = true;
};

// Copy individual word
const copyWord = async (word: string, wordNumber: number) => {
  await copyToClipboard(word);
  showToast(`Word ${wordNumber} copied!`);
};

// Copy full wallet seed phrase
const copyFullSeedPhrase = async () => {
  if (seedPhrase.value) {
    await copyToClipboard(seedPhrase.value);
    showToast('All words copied!');
  }
};

// Copy wallet address
const copyAddress = async () => {
  if (walletAddress.value) {
    await copyToClipboard(walletAddress.value);
    showToast('Address copied!');
  }
};

const load = async () => {
  setTimeout(async () => {
    const svTagsArr = await storage.get('sv_tags');
    const currentTagIdx = await storage.get('currentSVTagIndex');
    let secretsData = [];
    
    const isSimulate = await getSimulateNFCTag();
    if (isSimulate) {
      let key = '';
      if (Array.isArray(svTagsArr) && svTagsArr[currentTagIdx] && svTagsArr[currentTagIdx].seedVaultKey) {
        key = svTagsArr[currentTagIdx].seedVaultKey;
      }
      const encryptedSecrets = await storage.get('my-secrets');
      if (encryptedSecrets && key) {
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedSecrets, key);
          const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
          secretsData = JSON.parse(decryptedData);
        } catch (e) {
          secretsData = [];
        }
      }
    } else {
      // Use labels from current tag and read secrets from NFC for current item
      if (Array.isArray(svTagsArr) && svTagsArr[currentTagIdx] && svTagsArr[currentTagIdx].labels) {
        const labels = svTagsArr[currentTagIdx].labels;
        
        // Create secrets array with empty wallet seed phrases
        secretsData = labels.map((label: string, index: number) => ({
          name: label,
          seedPhrase: '',
          walletType: (svTagsArr[currentTagIdx].chains && svTagsArr[currentTagIdx].chains[index]) || 'cardano'
        }));
        
        // Load the specific secret from NFC tag
        const currentIndex = await storage.get('currentSeedPhrase');
        if (currentIndex >= 0 && currentIndex < labels.length) {
          let key = '';
          if (svTagsArr[currentTagIdx].seedVaultKey) {
            key = svTagsArr[currentTagIdx].seedVaultKey;
          }
          
          if (!nfcModal.value) return;
          try {
            nfcModal.value.openModal(1);
            nfcModal.value.onModalClose(() => {
              mobileNDEFService.cancel();
            });
            const mobileNDEFService = new MobileNDEFService();
            const tagData = await mobileNDEFService.read();
            nfcModal.value.incrementProgress();
            await nfcModal.value.closeModal(500);
            if (tagData.secrets && tagData.secrets[currentIndex]) {
              try {
                const bytes = CryptoJS.AES.decrypt(tagData.secrets[currentIndex], key);
                const decryptedSeedPhrase = bytes.toString(CryptoJS.enc.Utf8);
                secretsData[currentIndex].seedPhrase = decryptedSeedPhrase;
              } catch (decryptError) {
                console.error('Failed to decrypt secret:', decryptError);
                secretsData[currentIndex].seedPhrase = 'Error decrypting';
              }
            }
          } catch (error) {
            if (error && error !== 'canceled') {
              await nfcModal.value.closeModal(0);
              console.error(error);
              alert('Error updating NFC tag: ' + error);
            }
          }
        }
      }
    }
    
    secrets.value = secretsData;
    const currentIndex = await storage.get('currentSeedPhrase');
    if (secrets.value[currentIndex]) {
      name.value = (secrets.value[currentIndex] as any).name;
      seedPhrase.value = (secrets.value[currentIndex] as any).seedPhrase;
      walletType.value = (secrets.value[currentIndex] as any).walletType || 'cardano';
      
      // Generate wallet address if seed phrase is available
      if (seedPhrase.value && seedPhrase.value.trim()) {
        try {
          walletAddress.value = await generateWalletAddress(seedPhrase.value, walletType.value);
        } catch (error) {
          console.error('Failed to generate wallet address:', error);
          walletAddress.value = '';
        }
      } else {
        walletAddress.value = '';
      }
    } else {
      name.value = '';
      seedPhrase.value = '';
      walletType.value = 'cardano';
      walletAddress.value = '';
    }
  }, 10);
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/seed-vault/secret') {
    await load();
  }
}, { immediate: true });

const deleteSecret = async () => {
  const confirmation = confirm('Are you sure you want to delete this Wallet?');
  if (confirmation) {
    const svTagsArr = await storage.get('sv_tags');
    const currentTagIdx = await storage.get('currentSVTagIndex');
    const currentIndex = await storage.get('currentSeedPhrase');
    
    const isSimulate = await getSimulateNFCTag();
    if (isSimulate) {
      // Delete from encrypted secrets
      let key = '';
      if (Array.isArray(svTagsArr) && svTagsArr[currentTagIdx] && svTagsArr[currentTagIdx].seedVaultKey) {
        key = svTagsArr[currentTagIdx].seedVaultKey;
      }
      const encryptedSecrets = await storage.get('my-secrets');
      let secretsArr = [];
      if (encryptedSecrets && key) {
        try {
          const bytes = CryptoJS.AES.decrypt(encryptedSecrets, key);
          const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
          secretsArr = JSON.parse(decryptedData);
        } catch (e) {
          secretsArr = [];
        }
      }
      if (secretsArr && secretsArr[currentIndex]) {
        secretsArr.splice(currentIndex, 1);
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(secretsArr), key).toString();
        await storage.set('my-secrets', encrypted);
      }
    } else {
      // Delete from tag labels and chains, read and update NFC tag
      if (Array.isArray(svTagsArr) && svTagsArr[currentTagIdx] && svTagsArr[currentTagIdx].labels) {
        svTagsArr[currentTagIdx].labels.splice(currentIndex, 1);
        
        // Also remove the corresponding chain type
        if (svTagsArr[currentTagIdx].chains && svTagsArr[currentTagIdx].chains.length > currentIndex) {
          svTagsArr[currentTagIdx].chains.splice(currentIndex, 1);
        }
        
        // Ensure the array is serializable by creating plain objects
        const serializableTags = ensureSerializableTags(svTagsArr);
        
        await storage.set('sv_tags', serializableTags);
        
        // Read from NFC tag, remove secret, and write back
        if (!nfcModal.value) return;
        
        try {
          nfcModal.value.openModal(2); // 2 steps: read + write
          const mobileNDEFService = new MobileNDEFService();
          
          nfcModal.value.onModalClose(() => {
            mobileNDEFService.cancel();
          });
          
          // Read current secrets from NFC tag
          let currentSecrets: string[] = [];
          try {
            const tagData = await mobileNDEFService.read();
            currentSecrets = tagData.secrets || [];
          } catch (readError) {
            console.log('Failed to read existing secrets');
            currentSecrets = [];
          }
          
          nfcModal.value.incrementProgress();

          alert('Tag read successfully, preparing to write...');
          
          // Remove the secret at currentIndex
          if (currentSecrets.length > currentIndex) {
            currentSecrets.splice(currentIndex, 1);
          }
          
          // Write updated data back to tag
          const currentTag = svTagsArr[currentTagIdx];
          await mobileNDEFService.write(
            currentTag.id,
            currentTag.labels || [],
            currentSecrets,
            currentTag.chains || [],
            false
          );
          
          nfcModal.value.incrementProgress();
          await nfcModal.value.closeModal(500);
          
        } catch (error) {
          if (error && error != 'canceled') {
            await nfcModal.value.closeModal(0);
            console.error('Failed to update NFC tag:', error);
            alert('Secret deleted locally but failed to update NFC tag: ' + error);
          }
        }
      }
    }
    
    await storage.remove('currentSeedPhrase');
    router.replace('/seed-vault/main');
  }
};
</script>

<style scoped>
.main-container {
  padding: var(--spacing-lg);
  max-width: 600px;
  margin: 0 auto;
}

.wallet-info-section {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--ion-color-light);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--ion-color-light-shade);
}

.wallet-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.wallet-icon {
  font-size: 32px;
  min-width: 40px;
  text-align: center;
}

.wallet-details {
  flex: 1;
}

.wallet-name {
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: var(--ion-color-dark);
  margin: 0 0 var(--spacing-xs) 0;
}

.wallet-type {
  font-size: 16px;
  color: var(--ion-color-medium);
  margin: 0;
}

.address-section {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
  background: var(--ion-color-light);
  border-radius: var(--border-radius-lg);
  border: 1px solid var(--ion-color-light-shade);
}

.field-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
  color: var(--ion-color-primary);
  margin-bottom: var(--spacing-md);
  margin-top: 0;
}

.address-container {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.address-display {
  flex: 1;
  background: var(--ion-color-background);
  padding: var(--spacing-sm);
  border-radius: var(--border-radius-md);
  font-family: var(--font-family-mono);
  font-size: 14px;
  color: var(--ion-color-dark);
  border: 1px solid var(--ion-color-medium);
  word-break: break-all;
  line-height: 1.4;
}

.copy-address-button {
  --border-radius: var(--border-radius-md);
  --padding-start: var(--spacing-sm);
  --padding-end: var(--spacing-sm);
  --padding-top: var(--spacing-sm);
  --padding-bottom: var(--spacing-sm);
  min-width: 48px;
  height: 48px;
}

.seed-phrase-section {
  margin-bottom: var(--spacing-lg);
}

.words-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.word-card {
  background: var(--ion-color-background);
  border: 2px solid var(--ion-color-light-shade);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-sm);
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-normal);
  position: relative;
}

.word-card:hover {
  border-color: var(--ion-color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.word-number {
  font-size: 12px;
  color: var(--ion-color-medium);
  font-weight: var(--font-weight-semibold);
  margin-bottom: var(--spacing-xs);
  background: var(--ion-color-light);
  border-radius: var(--border-radius-sm);
  padding: var(--spacing-xs) var(--spacing-sm);
  display: inline-block;
}

.word-text {
  font-family: var(--font-family-mono);
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: var(--ion-color-dark);
  margin-bottom: var(--spacing-xs);
}

.copy-icon {
  position: absolute;
  top: var(--spacing-xs);
  right: var(--spacing-xs);
  font-size: 16px;
  opacity: 0.6;
}

.copy-all-section {
  text-align: center;
  margin: var(--spacing-lg) 0;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--ion-color-light);
}

.copy-all-button {
  --padding-start: var(--spacing-lg);
  --padding-end: var(--spacing-lg);
  --padding-top: var(--spacing-sm);
  --padding-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-semibold);
  font-size: 16px;
}

.security-warning {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--ion-color-warning-tint);
  border-radius: var(--border-radius-md);
  font-size: 14px;
}

.empty-seed-phrase {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-lg);
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-seed-phrase p {
  font-size: 16px;
  margin: 0;
}

.delete-button {
  margin-top: var(--spacing-xl);
  --border-radius: var(--border-radius-md);
  --padding-top: var(--spacing-md);
  --padding-bottom: var(--spacing-md);
  font-weight: var(--font-weight-semibold);
}

/* Responsive design for smaller screens */
@media (max-width: 480px) {
  .main-container {
    padding: var(--spacing-md);
  }
  
  .words-container {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: var(--spacing-xs);
  }
  
  .word-card {
    padding: var(--spacing-xs);
  }
  
  .wallet-header {
    gap: var(--spacing-sm);
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .wallet-info-section {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .address-section {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .address-display {
    background: var(--ion-color-dark);
    color: var(--ion-color-light);
    border-color: var(--ion-color-medium-shade);
  }
  
  .word-card {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .word-card:hover {
    background: var(--ion-color-light);
  }
  
  .word-number {
    background: var(--ion-color-dark);
    color: var(--ion-color-light);
  }
  
  .copy-all-section {
    border-top-color: var(--ion-color-medium-shade);
  }
}
</style>