<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault" @click="() => { router.replace('/seed-vault'); }"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ tagTitle }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Loading state melhorado -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent" color="primary"></ion-spinner>
        <p class="loading-text">Loading wallets...</p>
      </div>
      
      <div v-else class="main-container">
        <!-- Tag info card -->
        <div v-if="currentTagData?.tag?.id" class="info-card">
          <div class="tag-info">
            <ion-icon :icon="cardOutline" class="tag-icon"></ion-icon>
            <div class="tag-details">
              <h3>Tag ID</h3>
              <p class="tag-id">{{ currentTagData.tag.id }}</p>
            </div>
          </div>
        </div>

        <!-- Empty state melhorado -->
        <div v-if="secrets.length === 0" class="empty-state">
          <ion-icon :icon="walletOutline" class="empty-icon"></ion-icon>
          <h3>No wallets found</h3>
          <p>Start by importing or creating your first wallet</p>
        </div>

        <!-- Wallets list melhorada -->
        <div v-else class="wallets-section">
          <h2 class="section-title">
            <ion-icon :icon="walletOutline"></ion-icon>
            Stored Wallets
          </h2>
          
          <div class="wallets-grid">
            <div 
              v-for="(secret, index) in secrets" 
              :key="index" 
              class="wallet-card"
              @click="selectSeedPhrase(index)"
            >
              <div class="wallet-header">
                <span class="wallet-icon">{{ getWalletTypeIcon((secret as any).walletType || '1') }}</span>
                <div class="wallet-info">
                  <h4 class="wallet-name">{{ (secret as any).name }} <span class="wallet-type">[{{ getWalletTypeName((secret as any).walletType || '1') }}]</span></h4>
                </div>
                <ion-icon :icon="chevronForwardOutline" class="chevron"></ion-icon>
              </div>
              
              <div v-if="walletAddresses[index]" class="wallet-address">
                {{ formatAddress(walletAddresses[index]) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons melhorados -->
        <div class="actions-section">
          <ion-button 
            expand="block" 
            fill="solid"
            @click="addSeedPhrase"
            class="action-button"
          >
            <ion-icon :icon="addOutline" slot="start"></ion-icon>
            Import Wallet
          </ion-button>
          
          <ion-button 
            expand="block" 
            fill="outline"
            @click="createWallet"
            class="action-button"
          >
            <ion-icon :icon="createOutline" slot="start"></ion-icon>
            Create Wallet
          </ion-button>
        </div>
      </div>
    </ion-content>

    <SeedVaultTabBar />
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonSpinner } from '@ionic/vue';
import { cardOutline, walletOutline, chevronForwardOutline, addOutline, createOutline } from 'ionicons/icons';
import SeedVaultTabBar from '../../components/SeedVaultTabBar.vue';
import CryptoJS from 'crypto-js';
import { SeedVaultStorageService } from '@/utils/storage-services/SeedVaultStorageService';
import { VirtualNFCService } from '@/utils/storage-services/VirtualNFCService';
import { AppConfigStorageService } from '@/utils/storage-services/AppConfigStorageService';
import { getWalletTypeIcon, getWalletTypeName } from '@/utils/WalletTypes';
import { generateWalletAddress } from '@/utils/CryptoUtils';
import { UIService } from '@/utils/UIService';

const seedVaultService = new SeedVaultStorageService();
const virtualNFCService = new VirtualNFCService();
const appConfigService = new AppConfigStorageService();
const router = useRouter();
const route = useRoute();
const loading = ref(true);
const secrets = ref([]);
const walletAddresses = ref<string[]>([]);
const tagTitle = ref('Seed Vault');
const currentTagData = ref<any>(null);

// Generate addresses for secrets that have seed phrases
const generateAddressesForSecrets = async () => {
  const addresses: string[] = [];
  
  for (let i = 0; i < secrets.value.length; i++) {
    const secret = secrets.value[i] as any;
    
    // For simulation mode, we have the seed phrase
    if (secret.seedPhrase && secret.seedPhrase.trim()) {
      try {
        const address = await generateWalletAddress(secret.seedPhrase, secret.walletType || '1');
        addresses.push(address);
      } catch (error) {
        console.error(`Failed to generate address for wallet ${i}:`, error);
        addresses.push('');
      }
    } else {
      // For NFC mode, we don't have seed phrases in the listing, so no address
      addresses.push('');
    }
  }
  
  walletAddresses.value = addresses;
};

// Format address for display (truncate long addresses)
const formatAddress = (address: string): string => {
  if (!address) return '';
  
  // For addresses longer than 20 characters, show first 6 and last 4 characters
  if (address.length > 800) {
    return `${address.slice(0, 22)}...${address.slice(-8)}`;
  }
  
  return address;
};

const load = async () => {
  loading.value = true;
  setTimeout(async () => {
    try {
      const currentTag = await seedVaultService.getCurrentTag();
      currentTagData.value = currentTag;
      
      // Update title with tag index
      if (currentTag && currentTag.index !== undefined) {
        tagTitle.value = `Seed Vault #${currentTag.index + 1}`;
      } else {
        tagTitle.value = 'Seed Vault';
      }
      
      let secrets_in = [];
      
      const isSimulate = await appConfigService.getSimulateNFCTag();
      if (isSimulate) {
        if (currentTag?.tag?.seedVaultKey) {
          const key = currentTag.tag.seedVaultKey;
          const encryptedSecrets = await virtualNFCService.getMySecrets();
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
          const chains = currentTag.tag.chains || [];
          console.log('Tag labels:', labels);
          console.log('Tag chains:', chains);
          secrets_in = labels.map((label: string, index: number) => ({
            name: label,
            walletType: chains[index] || '1', // Default to cardano for backward compatibility
          }));
        }
      }
      secrets.value = secrets_in;
      
      // Generate addresses for wallets that have seed phrases
      await generateAddressesForSecrets();
    } catch (error) {
      console.error('Error loading secrets:', error);
      secrets.value = [];
      walletAddresses.value = [];
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
    // Se estiver em modo de desenvolvimento, nunca bloquear
    const isDevMode = await appConfigService.getDevMode();
    if (isDevMode) {
      return false;
    }
    
    const currentTag = await seedVaultService.getCurrentTag();
    if (!currentTag?.tag?.id) return false;
    
    // Check if there are already secrets stored
    const hasExistingSecrets = secrets.value && secrets.value.length > 0;
    
    if (hasExistingSecrets) {
      // Check if multiple wallets feature is enabled
      const isMultipleWalletsEnabled = await seedVaultService.isMultipleWalletsEnabled(currentTag.tag.id);
      
      if (!isMultipleWalletsEnabled) {
        const message = `Multiple wallets functionality is currently disabled.

You already have ${secrets.value.length} wallet${secrets.value.length > 1 ? 's' : ''} stored in this tag. To add more wallets, you need to enable the multiple wallets feature in Settings.

⚠️ Important: Please read the warning in Settings before enabling this feature, as there are risks involved with the writing process.`;
        
        await UIService.showWarning(message, 'Multiple Wallets Disabled');
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
  await seedVaultService.setCurrentSeedPhrase(index);
  router.push('/seed-vault/secret');
};
</script>

<style scoped>
.main-container {
  padding: var(--spacing-lg);
  max-width: 600px;
  margin: 0 auto;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  gap: var(--spacing-md);
}

.loading-text {
  color: var(--ion-color-medium);
  font-size: 16px;
}

.info-card {
  background: var(--ion-color-light);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--ion-color-light-shade);
}

.tag-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.tag-icon {
  font-size: 24px;
  color: var(--ion-color-primary);
}

.tag-details h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 14px;
  font-weight: var(--font-weight-semibold);
  color: var(--ion-color-medium);
}

.tag-id {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: 12px;
  color: var(--ion-color-dark);
  word-break: break-all;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-lg);
  color: var(--ion-color-medium);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.empty-state h3 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
}

.empty-state p {
  margin: 0;
  font-size: 16px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: var(--spacing-lg) 0 var(--spacing-md) 0;
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: var(--ion-color-primary);
}

.wallets-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.wallet-card {
  background: var(--ion-color-background);
  border: 1px solid var(--ion-color-light-shade);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.wallet-card:hover {
  border-color: var(--ion-color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.wallet-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-sm);
}

.wallet-icon {
  font-size: 24px;
  min-width: 32px;
}

.wallet-info {
  flex: 1;
}

.wallet-name {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--ion-color-dark);
}

.wallet-type {
  font-size: 14px;
  color: var(--ion-color-medium);
}

.chevron {
  font-size: 20px;
  color: var(--ion-color-medium);
}

.wallet-address {
  font-family: var(--font-family-mono);
  font-size: 12px;
  color: var(--ion-color-medium);
  opacity: 0.8;
  word-break: break-all;
}

.actions-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-button {
  --border-radius: var(--border-radius-md);
  --padding-top: var(--spacing-md);
  --padding-bottom: var(--spacing-md);
  font-weight: var(--font-weight-semibold);
  min-height: 56px;
}

/* Responsive design */
@media (max-width: 480px) {
  .main-container {
    padding: var(--spacing-md);
  }
  
  .wallet-card {
    padding: var(--spacing-sm);
  }
  
  .wallet-header {
    gap: var(--spacing-sm);
  }
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .info-card {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .wallet-card {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .wallet-card:hover {
    background: var(--ion-color-light);
  }
}
</style>