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
      <div class="main-container">
        <!-- Header Section -->
        <div class="header-section">
          <ion-icon :icon="settingsOutline" class="header-icon"></ion-icon>
          <h1 class="header-title">Settings</h1>
          <p class="header-description">Manage your Seed Vault configuration</p>
        </div>

        <!-- Account Settings -->
        <div class="settings-section">
          <h2 class="section-title">
            <ion-icon :icon="personOutline"></ion-icon>
            Account Settings
          </h2>
          
          <div class="settings-grid">
            <ion-button 
              expand="block" 
              fill="outline"
              @click="goToChangeEmail"
              class="settings-button"
            >
              <ion-icon :icon="mailOutline" slot="start"></ion-icon>
              Change Email
            </ion-button>
            
            <ion-button 
              expand="block" 
              fill="outline"
              @click="goToChangePin"
              class="settings-button"
            >
              <ion-icon :icon="keypadOutline" slot="start"></ion-icon>
              Change PIN
            </ion-button>
          </div>
        </div>

        <!-- Advanced Settings -->
        <div class="settings-section">
          <h2 class="section-title">
            <ion-icon :icon="constructOutline"></ion-icon>
            Advanced Settings
          </h2>
          
          <div class="setting-item">
            <div class="setting-content">
              <div class="setting-info">
                <h3>Multiple Wallets</h3>
                <p>Allow adding multiple wallets to this tag</p>
              </div>
              <ion-toggle 
                v-model="multipleWalletsEnabled" 
                @ionChange="onMultipleWalletsToggle"
                class="setting-toggle"
              ></ion-toggle>
            </div>
          </div>
        </div>

        <!-- Danger Zone -->
        <div class="settings-section danger-section">
          <h2 class="section-title danger-title">
            <ion-icon :icon="warningOutline"></ion-icon>
            Danger Zone
          </h2>
          
          <div class="danger-item">
            <div class="danger-content">
              <div class="danger-info">
                <h3>Remove Tag</h3>
                <p>Permanently remove this tag from the app</p>
              </div>
              <ion-button 
                fill="outline"
                color="danger"
                @click="removeTagFromApp"
                class="danger-button"
              >
                <ion-icon :icon="trashOutline" slot="start"></ion-icon>
                Remove
              </ion-button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
    <SeedVaultTabBar />
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonToggle } from '@ionic/vue';
import { settingsOutline, personOutline, mailOutline, keypadOutline, constructOutline, warningOutline, trashOutline } from 'ionicons/icons';
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import SeedVaultTabBar from '../../components/SeedVaultTabBar.vue';
import { StorageService } from '@/utils/StorageService';
import { UIService } from '@/utils/UIService';

const router = useRouter();
const route = useRoute();
const storageService = new StorageService();

const tagId = ref('');
const tagTitle = ref('Seed Vault');
const svTags = ref<{ id: string, email?: string }[]>([]);
const currentIndex = ref<number | null>(null);
const multipleWalletsEnabled = ref(false);

const reloadTagData = async () => {
  try {
    const currentTag = await storageService.getCurrentTag();

    if (currentTag && currentTag.index !== undefined) {
      tagTitle.value = `Seed Vault #${currentTag.index + 1}`;
    } else {
      tagTitle.value = 'Seed Vault';
    }

    if (currentTag) {
      svTags.value = currentTag.allTags;
      currentIndex.value = currentTag.index;
      tagId.value = currentTag.tag.id;
      
      // Load multiple wallets setting
      multipleWalletsEnabled.value = await storageService.isMultipleWalletsEnabled(currentTag.tag.id);
    } else {
      svTags.value = [];
      currentIndex.value = null;
      tagId.value = '';
      multipleWalletsEnabled.value = false;
    }
  } catch (error) {
    console.error('Error loading tag data:', error);
    tagId.value = '';
    multipleWalletsEnabled.value = false;
  }
};

onMounted(reloadTagData);

watch(() => route.path, async (newPath) => {
  if (newPath === '/seed-vault/settings') {
    await reloadTagData();
  }
});

const removeTagFromApp = async () => {
  if (!tagId.value) {
    UIService.showError('Tag ID not found.');
    return;
  }
  
  const confirmed = await UIService.showConfirmation('Are you sure you want to remove this tag from the app?');
  if (!confirmed) return;
  
  try {
    await storageService.removeTag(tagId.value);
    router.replace('/seed-vault');
  } catch (error) {
    UIService.showError('Error removing tag from app');
    console.error(error);
  }
};

const goToChangeEmail = () => {
  router.push('/seed-vault/change-email');
};

const goToChangePin = () => {
  router.push('/seed-vault/change-pin');
};

const onMultipleWalletsToggle = async () => {
  if (!tagId.value) {
    UIService.showError('Tag ID not found.');
    multipleWalletsEnabled.value = false;
    return;
  }

  if (multipleWalletsEnabled.value) {
    const warning = `Warning: The TapDano Seed Vault does not support atomic write operations. When adding multiple wallets to your tag, there is a risk of losing previously stored data due to possible failures during the writing process. 

Please ensure you have backed up all your wallets before enabling this feature. Do you want to continue?`;
    
    const confirmed = await UIService.showConfirmation(warning);
    if (!confirmed) {
      multipleWalletsEnabled.value = false;
      return;
    }
  }

  try {
    await storageService.setMultipleWalletsEnabled(tagId.value, multipleWalletsEnabled.value);
    
    if (multipleWalletsEnabled.value) {
      UIService.showSuccess('Multiple wallets feature enabled. Remember to backup your wallets regularly.');
    } else {
      UIService.showSuccess('Multiple wallets feature disabled.');
    }
  } catch (error) {
    UIService.showError('Error updating multiple wallets setting');
    console.error(error);
    // Revert the checkbox state on error
    multipleWalletsEnabled.value = !multipleWalletsEnabled.value;
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
  border: 2px solid var(--ion-color-light-shade);
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

.settings-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-md) 0;
  font-size: 18px;
  font-weight: var(--font-weight-semibold);
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-sm);
}

.settings-button {
  --border-radius: var(--border-radius-md);
  --padding-top: var(--spacing-md);
  --padding-bottom: var(--spacing-md);
  font-weight: var(--font-weight-medium);
  justify-content: flex-start;
}

.setting-item {
  background: var(--ion-color-background);
  border: 1px solid var(--ion-color-light-shade);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
}

.setting-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.setting-info {
  flex: 1;
}

.setting-info h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--ion-color-dark);
}

.setting-info p {
  margin: 0;
  font-size: 14px;
  color: var(--ion-color-medium);
  line-height: 1.4;
}

.setting-toggle {
  --handle-background: var(--ion-color-primary);
  --handle-background-checked: var(--ion-color-primary);
}

.danger-section {
  border: 1px solid var(--ion-color-danger-tint);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  background: var(--ion-color-danger-tint);
  color:white !important;
}

.danger-item {
  background: var(--ion-color-background);
  border: 1px solid var(--ion-color-danger-shade);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-md);
}

.danger-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-md);
}

.danger-info {
  flex: 1;
}

.danger-info h3 {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
}

.danger-info p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.ion-color-danger{
  --ion-color-base: white !important;
}

.danger-button {
  --border-radius: var(--border-radius-md);
  --padding-start: var(--spacing-md);
  --padding-end: var(--spacing-md);
  --padding-top: var(--spacing-sm);
  --padding-bottom: var(--spacing-sm);
  font-weight: var(--font-weight-medium);
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
  
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .header-section {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .setting-item {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .danger-section {
    background: var(--ion-color-danger-shade);
    border-color: white;
    color: white !important;
  }
  
  .danger-item {
    background: var(--ion-color-surface);
    border-color: white;
    color: white !important;
  }
}
</style>