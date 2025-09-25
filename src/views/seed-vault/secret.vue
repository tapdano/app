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
      <div id="container">
        <!-- Seed Phrase Section -->
        <div class="info-section">

          <!-- Individual Word Buttons -->
          <div class="words-grid" v-if="seedPhraseWords.length > 0">
            <div 
              v-for="(word, index) in seedPhraseWords" 
              :key="index" 
              class="word-container"
            >
              <div class="word-number">{{ index + 1 }}</div>
              <ion-button 
                fill="outline" 
                class="word-button"
                @click="copyWord(word, index + 1)"
              >
                {{ word }}
              </ion-button>
            </div>
          </div>

          <!-- Copy All Button -->
          <div class="copy-all-section" v-if="seedPhraseWords.length > 0">
            <ion-button 
              fill="solid" 
              color="primary"
              @click="copyFullSeedPhrase"
              :disabled="!seedPhrase"
            >
              <ion-icon slot="start" name="copy-outline"></ion-icon>
              Copy All Words
            </ion-button>
          </div>

          <!-- Empty state -->
          <div v-else class="empty-seed-phrase">
            <ion-icon name="key-outline" class="empty-icon"></ion-icon>
            <p>No seed phrase available</p>
          </div>
        </div>

        <ion-button id="delete-button" expand="block" color="danger" @click="deleteSecret">Delete Wallet</ion-button>
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
import { useRoute, useRouter } from 'vue-router';
import { Storage } from '@ionic/storage';
import CryptoJS from 'crypto-js';
import { getSimulateNFCTag } from '@/utils/StorageUtils';
import { ensureSerializableTags } from '@/utils/SeedVaultUtils';
import { MobileNDEFService } from '@/utils/MobileNDEFService';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import NFCModal from '@/components/NFCModal.vue';

const router = useRouter();
const route = useRoute();
const storage = new Storage();
storage.create();

const secrets = ref([]);
const name = ref('');
const seedPhrase = ref('');
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);
const isToastOpen = ref(false);
const toastMessage = ref('');

// Computed property to split seed phrase into words
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

// Copy full seed phrase
const copyFullSeedPhrase = async () => {
  if (seedPhrase.value) {
    await copyToClipboard(seedPhrase.value);
    showToast('All words copied!');
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
        
        // Create secrets array with empty seed phrases
        secretsData = labels.map((label: string, index: number) => ({
          name: label,
          seedPhrase: ''
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
    } else {
      name.value = '';
      seedPhrase.value = '';
    }
  }, 10);
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/seed-vault/secret') {
    await load();
  }
}, { immediate: true });

const deleteSecret = async () => {
  const confirmation = confirm('Are you sure you want to delete this Seed Phrase?');
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
      // Delete from tag labels, read and update NFC tag
      if (Array.isArray(svTagsArr) && svTagsArr[currentTagIdx] && svTagsArr[currentTagIdx].labels) {
        svTagsArr[currentTagIdx].labels.splice(currentIndex, 1);
        
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
#container {
  padding: 16px;
}

.info-section {
  margin-bottom: 24px;
}

.field-label {
  font-size: 18px;
  font-weight: 600;
  color: var(--ion-color-primary);
  margin-bottom: 12px;
  margin-top: 0;
}

.name-display {
  background-color: var(--ion-color-light);
  padding: 16px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  color: var(--ion-color-dark);
  border: 1px solid var(--ion-color-medium);
}

.words-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0px;
  margin-bottom: 20px;
}

.word-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.word-number {
  font-size: 12px;
  font-weight: bold;
  color: var(--ion-color-medium);
  min-width: 24px;
  text-align: center;
  background-color: var(--ion-color-light);
  border-radius: 12px;
  padding: 4px 6px;
}

.word-button {
  flex: 1;
  --border-radius: 8px;
  --padding-start: 16px;
  --padding-end: 16px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  text-transform: none;
  letter-spacing: normal;
}

.word-button:hover {
  --background: var(--ion-color-primary-shade);
  --color: white;
}

.copy-all-section {
  text-align: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--ion-color-light);
}

.copy-all-section ion-button {
  --padding-start: 24px;
  --padding-end: 24px;
  --padding-top: 12px;
  --padding-bottom: 12px;
  font-weight: 600;
  font-size: 18px;
}

.empty-seed-phrase {
  text-align: center;
  padding: 40px 20px;
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-seed-phrase p {
  font-size: 16px;
  margin: 0;
}

#delete-button {
  margin: 0 auto;
  --border-radius: 8px;
  --padding-top: 16px;
  --padding-bottom: 16px;
  width: 40%;
  text-align: center;
  font-weight: 600;
  font-size: 12px;
}

/* Responsive design for smaller screens */
@media (max-width: 320px) {
  .words-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .word-container {
    gap: 6px;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .name-display {
    background-color: var(--ion-color-dark);
    color: var(--ion-color-light);
    border-color: var(--ion-color-medium-shade);
  }
  
  .word-number {
    background-color: var(--ion-color-dark);
    color: var(--ion-color-light);
  }
  
  .copy-all-section {
    border-top-color: var(--ion-color-medium-shade);
  }
}
</style>