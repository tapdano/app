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
      <div id="container">
        <ion-button expand="block" color="primary" style="margin-bottom:10px;" @click="goToChangeEmail">Change E-mail</ion-button>
        <ion-button expand="block" color="primary" style="margin-bottom:20px;" @click="goToChangePin">Change PIN</ion-button>
        
        <!-- Multiple Wallets Configuration -->
        <ion-item style="margin-bottom:10px;">
          <ion-checkbox v-model="multipleWalletsEnabled" @ionChange="onMultipleWalletsToggle"></ion-checkbox>
          <ion-label style="margin-left: 10px;">
            <h3>Enable Multiple Wallets</h3>
            <p style="color: var(--ion-color-medium); font-size: 14px; margin-top: 4px;">
              Allow adding multiple seed phrases to this tag
            </p>
          </ion-label>
        </ion-item>
        
        <ion-button color="danger" expand="block" style="margin-bottom:20px;" @click="removeTagFromApp">Remove from App</ion-button>
      </div>
    </ion-content>
    <SeedVaultTabBar />
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonLabel, IonCheckbox } from '@ionic/vue';
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

Please ensure you have backed up all your seed phrases before enabling this feature. Do you want to continue?`;
    
    const confirmed = await UIService.showConfirmation(warning);
    if (!confirmed) {
      multipleWalletsEnabled.value = false;
      return;
    }
  }

  try {
    await storageService.setMultipleWalletsEnabled(tagId.value, multipleWalletsEnabled.value);
    
    if (multipleWalletsEnabled.value) {
      UIService.showSuccess('Multiple wallets feature enabled. Remember to backup your seed phrases regularly.');
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
</style>