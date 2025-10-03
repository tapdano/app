<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/events"></ion-back-button>
        </ion-buttons>
        <ion-title>Event Details</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Event Details</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <ion-text color="medium">
          <p>Loading event details...</p>
        </ion-text>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-container">
        <ion-icon :icon="alertCircleOutline" color="danger" size="large"></ion-icon>
        <ion-text color="danger">
          <h3>Error loading event</h3>
          <p>{{ error }}</p>
        </ion-text>
        <ion-button @click="loadEventDetails" fill="outline" color="primary">
          <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
          Try Again
        </ion-button>
      </div>

      <!-- Event not found -->
      <div v-else-if="!event" class="error-container">
        <ion-icon :icon="alertCircleOutline" color="warning" size="large"></ion-icon>
        <ion-text color="warning">
          <h3>Event Not Found</h3>
          <p>The requested event could not be found.</p>
        </ion-text>
        <ion-button routerLink="/events" fill="outline" color="primary">
          Back to Events
        </ion-button>
      </div>

      <!-- Event details -->
      <div v-else class="event-details">
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ event.name }}</ion-card-title>
          </ion-card-header>
        </ion-card>

        <ion-card class="participation-card">
          <ion-card-header>
            <ion-card-title>Lottery Participation</ion-card-title>
          </ion-card-header>
          
          <ion-card-content>
            <ion-item>
              <ion-label position="stacked">Passcode</ion-label>
              <ion-input 
                v-model="passcode" 
                placeholder="Enter passcode"
                :disabled="participating"
              ></ion-input>
            </ion-item>

            <ion-button 
              expand="block" 
              @click="participateInLottery"
              :disabled="!passcode || participating"
              class="participate-button"
            >
              <ion-spinner v-if="participating" name="crescent" slot="start"></ion-spinner>
              <span v-if="!participating">Participate in Lottery</span>
              <span v-else>Processing...</span>
            </ion-button>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>

    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonSpinner,
  IonText,
  IonIcon,
  IonButton,
  IonItem,
  IonLabel,
  IonInput
} from '@ionic/vue';
import {
  alertCircleOutline,
  refreshOutline
} from 'ionicons/icons';
import { ApiService } from '@/utils/ApiService';
import { UIService } from '@/utils/UIService';
import { MobileNDEFService } from '@/utils/MobileNDEFService';
import { AppConfigStorageService } from '@/utils/storage-services/AppConfigStorageService';
import { VirtualNFCService } from '@/utils/storage-services/VirtualNFCService';
import NFCModal from '@/components/NFCModal.vue';

const route = useRoute();
const appConfigService = new AppConfigStorageService();
const virtualNFCService = new VirtualNFCService();
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

interface Event {
  id: string | number;
  name?: string;
  title?: string;
  [key: string]: any;
}

const event = ref<Event | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const passcode = ref('');
const participating = ref(false);

const loadEventDetails = async () => {
  const eventId = route.query.id;
  if (!eventId) {
    error.value = 'No event ID provided';
    return;
  }

  try {
    loading.value = true;
    error.value = null;
    
    const response = await ApiService.getEvents() as any;
    
    // Handle different response structures
    let events: Event[] = [];
    if (response.events && Array.isArray(response.events)) {
      events = response.events;
    } else if (Array.isArray(response.data)) {
      events = response.data;
    } else if (Array.isArray(response)) {
      events = response;
    }

    // Find the specific event
    const foundEvent = events.find(e => e.id.toString() === eventId.toString());
    
    if (foundEvent) {
      event.value = foundEvent;
    } else {
      event.value = null;
      error.value = 'Event not found';
    }
  } catch (err: any) {
    console.error('Error loading event details:', err);
    error.value = err.message || 'Failed to load event details';
    event.value = null;
  } finally {
    loading.value = false;
  }
};

const participateInLottery = async () => {
  if (!passcode.value.trim()) {
    await UIService.showError('Please enter a passcode');
    return;
  }

  if (!event.value) {
    await UIService.showError('No event selected');
    return;
  }

  participating.value = true;

  try {
    // Step 1: Read NFC tag
    const tagId = await readNFCTag();
    if (!tagId) {
      participating.value = false;
      return;
    }

    // Step 2: Check if tag is started
    const tagInfo = await ApiService.getTag(tagId) as any;
    if (tagInfo.status !== 'ok') {
      await UIService.showError('Error retrieving tag information');
      participating.value = false;
      return;
    }

    if (!tagInfo.is_started) {
      await UIService.showError('Tag needs to be initialized first through the Seed Vault menu');
      participating.value = false;
      return;
    }

    // Step 3: Participate in lottery
    const participationResult = await ApiService.participateLottery(event.value.id.toString(), tagId, passcode.value.trim()) as any;
    if (participationResult?.status === 'ok') {
      await UIService.showSuccess('Successfully registered for lottery!');
      passcode.value = ''; // Clear passcode after successful participation
    } else {
      await UIService.showError(participationResult.error || 'Failed to register for lottery');
    }

  } catch (error: any) {
    console.error('Error participating in lottery:', error);
    await UIService.showError(error.message || 'An error occurred while participating in the lottery');
  } finally {
    participating.value = false;
  }
};

const readNFCTag = async (): Promise<string | null> => {
  if (!nfcModal.value) {
    await UIService.showError('NFC modal not available');
    return null;
  }

  try {
    nfcModal.value.openModal(1);
    const isSimulateNFCTag = await appConfigService.getSimulateNFCTag();
    
    let tagId: string | null = null;

    if (isSimulateNFCTag) {
      // Simulate tag reading
      tagId = await virtualNFCService.getBurnedTagId() || '';
      nfcModal.value.incrementProgress();
      await nfcModal.value.closeModal(500);
    } else {
      // Real NFC reading
      const mobileNDEFService = MobileNDEFService.getInstance();
      nfcModal.value.onModalClose(() => {
        try {
          mobileNDEFService.cancel();
        } catch (e) {
          console.error('Error cancelling NFC read:', e);
        }
      });
      
      const tag = await mobileNDEFService.read();
      nfcModal.value.incrementProgress();
      await nfcModal.value.closeModal(500);
      
      console.log('NFC Tag content:', tag);
      tagId = tag.data.id;
    }

    if (!tagId) {
      await UIService.showError('Unable to read Tag ID');
      return null;
    }

    return tagId;

  } catch (error: any) {
    if (error && error !== 'canceled') {
      await nfcModal.value.closeModal(0);
      console.error('NFC read error:', error);
      await UIService.showError('Error reading NFC tag: ' + error);
    }
    return null;
  }
};

onMounted(() => {
  loadEventDetails();
});
</script>

<style scoped>
.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  gap: 1rem;
}

.event-details {
  max-width: 800px;
  margin: 0 auto;
}

.participation-card {
  margin-top: 1rem;
}

.participate-button {
  margin-top: 1rem;
  min-height: 50px;
}

ion-item {
  margin-bottom: 1rem;
}
</style>