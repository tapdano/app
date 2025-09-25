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
      <div id="container">
        <h2>Here you can manage your Seed Vault Tags, set it up, protect it, and much more.</h2>
        <div v-if="svTags.length > 0" style="margin-bottom: 20px;">
          <h3 class="tags-title">Available Tags:</h3>
          <ion-list>
            <ion-item v-for="(tag, idx) in svTags" :key="tag.id" @click="openTag(tag, idx)">
              <span>Seed Vault #{{ idx + 1 }}</span>
            </ion-item>
          </ion-list>
        </div>
        <div id="buttons-box">
          <ion-button expand="block" @click="addTagEvent">Scan a Tag</ion-button>
          <ion-button v-if="isSimulate || isDevMode" color="danger" expand="block" style="margin-top:10px;" @click="burnTagEvent">Burn a Tag</ion-button>
        </div>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonList } from '@ionic/vue';
import { getSimulateNFCTag, getDevMode, getBulkBurn } from '@/utils/StorageUtils';
import { ensureSerializableTags } from '@/utils/SeedVaultUtils';
import { MobileNDEFService } from '@/utils/MobileNDEFService';
import { ApiService } from '@/utils/ApiService';
import { StorageService } from '@/utils/StorageService';
import { UIService } from '@/utils/UIService';
import NFCModal from '@/components/NFCModal.vue';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

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

declare const nfc: any;

const burnTagEvent = async () => {
  let tag_id = null;
  
  try {
    const result = await ApiService.addTag(devToken.value, eventId.value) as any;
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
    const isSimulateNFCTag = await getSimulateNFCTag();
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
      await mobileNDEFService.write(tag_id, [], [], true);
      nfcModal.value.incrementProgress();
      
      try {
        const readTag = await mobileNDEFService.read();
        nfcModal.value.incrementProgress();
        if (readTag.id === tag_id) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          await playSuccessSound();
        } else {
          throw new Error('Tag ID verification failed');
        }
      } catch (readError) {
        console.error('Error verifying tag write:', readError);
        UIService.showError('Tag burned but verification failed: ' + readError);
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
  
  if (!nfcModal.value) return;
  
  try {
    nfcModal.value.openModal(1);
    const isSimulateNFCTag = await getSimulateNFCTag();
    
    if (isSimulateNFCTag) {
      tag_Id = await storageService.get('burned-tag-id') || '';
      tag_labels = [];
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
    await storageService.set('sv_tags', ensureSerializableTags(svTagsArr));
    await storageService.set('currentSVTagIndex', idx);
    router.push('/seed-vault/main');
    return;
  }

  await storageService.set('temp_tag_id', tag_Id);
  await storageService.set('temp_tag_labels', tag_labels);

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
.tags-title {
  margin: 40px 0 10px 0;
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
}

#buttons-box {
  margin-top: 20px;
}
ion-button {
  min-height: 50px;
  margin-top: 10px;
}
</style>
