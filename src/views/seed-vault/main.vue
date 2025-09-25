<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ tagTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <div v-if="currentTagData?.tag?.id" class="tag-id-display">
            <strong>Tag ID:</strong> {{ currentTagData.tag.id }}
          </div>
          <div v-if="secrets.length === 0" class="no-items-message">No seed phrase found.</div>
          <div v-else>
            <h3 class="seed-phrases-title">Stored Seed Phrases:</h3>
            <ion-list>
              <ion-item v-for="(secret, index) in secrets" :key="index" @click="selectSeedPhrase(index)">
                {{ (secret as any).name }}
              </ion-item>
            </ion-list>
          </div>
          <div id="buttons-box">
            <ion-button expand="block" @click="addSeedPhrase">Import Wallet</ion-button>
            <ion-button expand="block" @click="createWallet">Create Wallet</ion-button>
          </div>
        </div>
      </div>
    </ion-content>

    <SeedVaultTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonList, IonButton, IonItem } from '@ionic/vue';
import SeedVaultTabBar from '../../components/SeedVaultTabBar.vue';
import CryptoJS from 'crypto-js';
import { getSimulateNFCTag } from '@/utils/StorageUtils';
import { StorageService } from '@/utils/StorageService';

const storageService = new StorageService();
const router = useRouter();
const route = useRoute();
const loading = ref(true);
const secrets = ref([]);
const tagTitle = ref('Seed Vault');
const currentTagData = ref<any>(null);

const load = async () => {
  loading.value = true;
  setTimeout(async () => {
    try {
      const currentTag = await storageService.getCurrentTag();
      currentTagData.value = currentTag;
      
      // Update title with tag index
      if (currentTag && currentTag.index !== undefined) {
        tagTitle.value = `Seed Vault #${currentTag.index + 1}`;
      } else {
        tagTitle.value = 'Seed Vault';
      }
      
      let secrets_in = [];
      
      const isSimulate = await getSimulateNFCTag();
      if (isSimulate) {
        if (currentTag?.tag?.seedVaultKey) {
          const key = currentTag.tag.seedVaultKey;
          const encryptedSecrets = await storageService.get('my-secrets') as string;
          if (encryptedSecrets && key) {
            const bytes = CryptoJS.AES.decrypt(encryptedSecrets, key);
            const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
            secrets_in = JSON.parse(decryptedData);
          }
        }
      } else {
        console.log('Current Tag:', currentTag);
        if (currentTag?.tag?.labels) {
          const labels = currentTag.tag.labels;
          console.log('Tag labels:', labels);
          secrets_in = labels.map((label: string, index: number) => ({
            name: label,
          }));
        }
      }
      secrets.value = secrets_in;
    } catch (error) {
      console.error('Error loading secrets:', error);
      secrets.value = [];
    } finally {
      loading.value = false;
    }
  }, 500);
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/seed-vault/main') {
    await load();
  }
}, { immediate: true });

const addSeedPhrase = async () => {
  if (await shouldBlockMultipleWallets()) return;
  router.replace('/seed-vault/new-secret');
};

const createWallet = async () => {
  if (await shouldBlockMultipleWallets()) return;
  router.replace('/seed-vault/new-secret?mode=create');
};

const shouldBlockMultipleWallets = async (): Promise<boolean> => {
  try {
    const currentTag = await storageService.getCurrentTag();
    if (!currentTag?.tag?.id) return false;
    
    // Check if there are already secrets stored
    const hasExistingSecrets = secrets.value && secrets.value.length > 0;
    
    if (hasExistingSecrets) {
      // Check if multiple wallets feature is enabled
      const isMultipleWalletsEnabled = await storageService.isMultipleWalletsEnabled(currentTag.tag.id);
      
      if (!isMultipleWalletsEnabled) {
        const message = `Multiple wallets functionality is currently disabled.

You already have ${secrets.value.length} seed phrase${secrets.value.length > 1 ? 's' : ''} stored in this tag. To add more wallets, you need to enable the multiple wallets feature in Settings.

⚠️ Important: Please read the warning in Settings before enabling this feature, as there are risks involved with the writing process.`;
        
        alert(message);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking multiple wallets status:', error);
    return false;
  }
};

const selectSeedPhrase = async (index: number) => {
  await storageService.set('currentSeedPhrase', index);
  router.push('/seed-vault/secret');
};
</script>

<style scoped>
.tag-id-display {
  background-color: #f0f0f0;
  padding: 10px;
  margin-bottom: 15px;
  border-radius: 8px;
  font-size: 14px;
  color: black;
}

.seed-phrases-title {
  margin: 25px 0 10px 0;
  color: #FFF;
  font-size: 18px;
  font-weight: 600;
}

#buttons-box {
  margin-top: 20px;
}
ion-button {
  min-height: 50px;
  margin-top: 10px;
  --border-radius: 8px;
}
</style>