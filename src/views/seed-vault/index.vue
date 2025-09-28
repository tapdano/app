<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Seed Vault</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div class="main-container">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <div class="welcome-header">
            <ion-img src="/logo.png" class="welcome-icon"></ion-img>
            <h1 class="welcome-title">Welcome to TapDano's<br />Seed Vault</h1>
          </div>
          <p class="welcome-description">
            Start by scanning your first NFC tag to begin securing your wallets.
          </p>
        </div>

        <!-- Tags Section -->
        <div v-if="svTags.length > 0" class="tags-section">
          <h2 class="section-title">
            <ion-icon :icon="cardOutline"></ion-icon>
            Your Tags
          </h2>
          <div class="tags-grid">
            <div 
              v-for="(tag, idx) in svTags" 
              :key="tag.id" 
              class="tag-card"
              @click="openTag(tag, idx)"
            >
              <div class="tag-header">
                <ion-icon :icon="cardOutline" class="tag-icon"></ion-icon>
                <div class="tag-info">
                  <h3 class="tag-name">Seed Vault #{{ idx + 1 }}</h3>
                  <p class="tag-id">{{ tag.id }}</p>
                </div>
                <ion-icon :icon="chevronForwardOutline" class="chevron"></ion-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="actions-section">
          <ion-button 
            expand="block" 
            fill="solid"
            @click="addTagEvent"
            class="action-button primary"
          >
            <ion-icon :icon="scanOutline" slot="start"></ion-icon>
            Scan Tag
          </ion-button>
          
          <ion-button 
            v-if="isSimulate || isDevMode" 
            expand="block" 
            fill="outline"
            color="danger"
            @click="burnTagEvent"
            class="action-button danger"
          >
            <ion-icon :icon="flameOutline" slot="start"></ion-icon>
            Burn Tag
          </ion-button>
        </div>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton, IonIcon, IonImg } from '@ionic/vue';
import { cardOutline, chevronForwardOutline, scanOutline, flameOutline } from 'ionicons/icons';
import { getSimulateNFCTag, getDevMode, getBulkBurn } from '@/utils/StorageUtils';
import { ensureSerializableTags } from '@/utils/SeedVaultUtils';
import { MobileNDEFService, SVTag } from '@/utils/MobileNDEFService';
import { ApiService } from '@/utils/ApiService';
import { StorageService } from '@/utils/StorageService';
import { UIService } from '@/utils/UIService';
import NFCModal from '@/components/NFCModal.vue';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Device } from '@capacitor/device';
import { App } from '@capacitor/app';

const storageService = new StorageService();

const playSuccessSound = async () => {
  try {
    // Feedback tátil mais intenso
    await Haptics.impact({ style: ImpactStyle.Heavy });
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Criar uma sequência de sons mais longa e marcante
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine'; // Som mais suave
      
      // Envelope do som
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(1.0, startTime + 0.05); // Attack
      gainNode.gain.setValueAtTime(1.0, startTime + duration * 0.7); // Sustain
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration); // Release
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    // Sequência de notas ascendentes (som de sucesso típico)
    const now = audioContext.currentTime;
    playNote(523, now, 0.3);        // C5
    playNote(659, now + 0.15, 0.3); // E5
    playNote(784, now + 0.3, 0.5);  // G5
    playNote(1047, now + 0.5, 0.7); // C6 - nota final mais longa
    
  } catch (error) {
    console.warn('Could not play success sound:', error);
  }
};

const router = useRouter();
const route = useRoute();
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const isDevMode = ref(false);
const isSimulate = ref(false);
const devToken = ref('');
const svTags = ref<{ id: string, email?: string }[]>([]);
const tagVersion = ref('');
const eventId = ref('');

onMounted(async () => {
  await reloadAll();
});

watch(() => route.path, async (newPath) => {
  if (newPath === '/seed-vault') {
    await reloadAll();
  }
});

const reloadAll = async () => {
  try {
    isDevMode.value = await getDevMode();
    isSimulate.value = await getSimulateNFCTag();
    devToken.value = await storageService.get('dev-token') || '';
    tagVersion.value = await storageService.get('tagVersion') || '';
    eventId.value = await storageService.get('eventId') || '';
    await loadTags();
  } catch (error) {
    console.error('Error reloading data:', error);
  }
};

const loadTags = async () => {
  try {
    const tags = await storageService.get('sv_tags');
    svTags.value = Array.isArray(tags) ? tags : [];
  } catch (error) {
    console.error('Error loading tags:', error);
    svTags.value = [];
  }
};

const openTag = async (tag: { id: string, email?: string }, idx: number) => {
  try {
    await storageService.set('currentSVTagIndex', idx);
    router.push('/seed-vault/main');
  } catch (error) {
    UIService.showError('Error opening tag');
    console.error(error);
  }
};

// Function to collect device metadata
const getDeviceMetadata = async () => {
  try {
    const deviceInfo = await Device.getInfo();
    const deviceId = await Device.getId();
    const appInfo = await App.getInfo();
    
    return {
      platform: deviceInfo.platform === 'ios' ? 'iOS' : deviceInfo.platform === 'android' ? 'Android' : deviceInfo.platform,
      device_model: deviceInfo.model || null,
      device_manufacturer: deviceInfo.manufacturer || null,
      app_version: appInfo.version || null,
      os_version: deviceInfo.osVersion || null,
      device_id: deviceId.identifier || null
    };
  } catch (error) {
    console.warn('Error collecting device metadata:', error);
    // Return default values if collection fails
    return {
      platform: 'Unknown',
      device_model: null,
      device_manufacturer: null,
      app_version: null,
      os_version: null,
      device_id: null
    };
  }
};

declare const nfc: any;

const burnTagEvent = async () => {
  let tag_id = null;
  
  const isSimulateNFCTag = await getSimulateNFCTag();
  const deviceMetadata = await getDeviceMetadata();

  try {
    const result = await ApiService.addTag(
      devToken.value, 
      eventId.value, 
      isSimulateNFCTag,
      deviceMetadata.platform,
      deviceMetadata.device_model || undefined,
      deviceMetadata.device_manufacturer || undefined,
      deviceMetadata.app_version || undefined,
      deviceMetadata.os_version || undefined,
      deviceMetadata.device_id || undefined
    ) as any;
    if (result.tag_id) {
      tag_id = result.tag_id;
    }
  } catch (error) {
    console.error(error);
  }
  
  if (!tag_id) {
    UIService.showError('Error trying to get new tag ID from server');
    return;
  }

  if (!nfcModal.value) return;
  
  try {
    if (isSimulateNFCTag) {
      nfcModal.value.openModal(1);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await storageService.set('burned-tag-id', tag_id);
      await storageService.remove('my-secrets');
      await storageService.remove('currentSeedPhrase');
      nfcModal.value.incrementProgress();
      await playSuccessSound();
      UIService.showSuccess('Tag burned successfully (simulated)!');
      await nfcModal.value.closeModal(500);
    } else {
      nfcModal.value.openModal(2);
      const mobileNDEFService = new MobileNDEFService();
      nfcModal.value.onModalClose(() => {
        mobileNDEFService.cancel();
      });
      await mobileNDEFService.readAndWrite(tag_id, true, (currentTag) => ({
        id: tag_id,
        labels: [],
        secrets: [],
        chains: []
      } as SVTag));
      nfcModal.value.incrementProgress();
      
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (isIOS) {
        UIService.showSuccess('Tap again to verify write operation.');
      }

      const readTag = await mobileNDEFService.read();
      nfcModal.value.incrementProgress();
      if (readTag.id === tag_id) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await playSuccessSound();
      } else {
        throw new Error('Tag ID verification failed');
      }

      await nfcModal.value.closeModal(500);
      const isBulkBurnEnabled = await getBulkBurn();
      if (isBulkBurnEnabled) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await burnTagEvent();
      }
    }
    
  } catch (error) {
    if (error && error != 'canceled') {
      await nfcModal.value.closeModal(0);
      console.error(error);
      UIService.showError('Error trying to burn tag: ' + error);
      return;
    }
  }
};

const addTagEvent = async () => {
  let tag_Id: string | null = null;
  let tag_labels: string[] = [];
  let tag_chains: string[] = [];
  
  if (!nfcModal.value) return;
  
  try {
    nfcModal.value.openModal(1);
    const isSimulateNFCTag = await getSimulateNFCTag();
    
    if (isSimulateNFCTag) {
      tag_Id = await storageService.get('burned-tag-id') || '';
      tag_labels = [];
      tag_chains = [];
      nfcModal.value.incrementProgress();
      await nfcModal.value.closeModal(500);
    } else {
      const mobileNDEFService = new MobileNDEFService();
      nfcModal.value.onModalClose(() => {
        mobileNDEFService.cancel();
      });
      const tag = await mobileNDEFService.read();
      nfcModal.value.incrementProgress();
      await nfcModal.value.closeModal(500);
      console.log('NFC Tag content:', tag);
      tag_Id = tag.id;
      tag_labels = tag.labels || [];
      tag_chains = tag.chains || [];
    }
  } catch (error) {
    if (error && error != 'canceled') {
      await nfcModal.value.closeModal(0);
      console.error(error);
      UIService.showError(String(error));
      return;
    }
  }

  if (!tag_Id) {
    UIService.showError('Unable to read Tag ID');
    return;
  }

  const tags = await storageService.get('sv_tags') || [];
  const svTagsArr = Array.isArray(tags) ? tags : [];
  const idx = svTagsArr.findIndex((t: any) => t.id === tag_Id);
  
  if (idx !== -1) {
    svTagsArr[idx].labels = tag_labels;
    svTagsArr[idx].chains = tag_chains;
    await storageService.set('sv_tags', ensureSerializableTags(svTagsArr));
    await storageService.set('currentSVTagIndex', idx);
    router.push('/seed-vault/main');
    return;
  }

  await storageService.set('temp_tag_id', tag_Id);
  await storageService.set('temp_tag_labels', tag_labels);
  await storageService.set('temp_tag_chains', tag_chains);

  try {
    const result = await ApiService.getTag(tag_Id) as any;
    if (result.status === 'ok') {
      if (!result.is_started) {
        router.push(`/seed-vault/new-tag?id=${tag_Id}`);
      } else {
        router.push(`/seed-vault/auth?id=${tag_Id}`);
      }
    } else {
      UIService.showError(result.error || 'Error retrieving tag info');
    }
  } catch (err: any) {
    if (err.message && err.message.includes('404')) {
      UIService.showError('Tag ID is not registered.');
    } else {
      UIService.showError('Error communicating with server');
    }
    console.error(err);
  }
};
</script>

<style scoped>
.main-container {
  padding: var(--spacing-lg);
  max-width: 600px;
  margin: 0 auto;
}

.welcome-section {
  text-align: center;
  margin-bottom: var(--spacing-xl);
  padding: var(--spacing-lg);
  background: var(--ion-color-light);
  border-radius: var(--border-radius-lg);
  border: 2px solid var(--ion-color-light-shade);
}

.welcome-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.welcome-icon {
  width: 80px;
  height: 80px;
  max-width: 80px;
  max-height: 80px;
}

.welcome-title {
  margin: 0;
  font-size: 28px;
  font-weight: var(--font-weight-bold);
  color: var(--ion-color-dark);
}

.welcome-description {
  margin: 0;
  font-size: 16px;
  color: var(--ion-color-medium);
  line-height: 1.5;
}

.tags-section {
  margin-bottom: var(--spacing-xl);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin: 0 0 var(--spacing-md) 0;
  font-size: 20px;
  font-weight: var(--font-weight-semibold);
  color: var(--ion-color-primary);
}

.tags-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.tag-card {
  background: var(--ion-color-background);
  border: 1px solid var(--ion-color-light-shade);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-md);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.tag-card:hover {
  border-color: var(--ion-color-primary);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.tag-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.tag-icon {
  font-size: 24px;
  color: var(--ion-color-primary);
  min-width: 32px;
}

.tag-info {
  flex: 1;
}

.tag-name {
  margin: 0 0 var(--spacing-xs) 0;
  font-size: 16px;
  font-weight: var(--font-weight-semibold);
  color: var(--ion-color-dark);
}

.tag-id {
  margin: 0;
  font-family: var(--font-family-mono);
  font-size: 12px;
  color: var(--ion-color-medium);
  word-break: break-all;
}

.chevron {
  font-size: 20px;
  color: var(--ion-color-medium);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xxl) var(--spacing-lg);
  color: var(--ion-color-medium);
  margin-bottom: var(--spacing-xl);
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
  line-height: 1.5;
}

.actions-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.action-button {
  --border-radius: var(--border-radius-md);
  --padding-top: var(--spacing-md);
  --padding-bottom: var(--spacing-md);
  font-weight: var(--font-weight-semibold);
  min-height: 56px;
}

.action-button.primary {
  --background: var(--ion-color-primary);
  --color: var(--ion-color-primary-contrast);
}

.action-button.danger {
  --color: var(--ion-color-danger);
  --border-color: var(--ion-color-danger);
}

/* Responsive design */
@media (max-width: 480px) {
  .main-container {
    padding: var(--spacing-md);
  }
  
  .welcome-section {
    padding: var(--spacing-md);
  }
  
  .welcome-title {
    font-size: 24px;
  }
  
  .welcome-description {
    font-size: 14px;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .welcome-section {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .tag-card {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .tag-card:hover {
    background: var(--ion-color-light);
  }
}
</style>
