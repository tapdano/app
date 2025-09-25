<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Events</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Events</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <ion-text color="medium">
          <p>Loading events...</p>
        </ion-text>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-container">
        <ion-icon :icon="alertCircleOutline" color="danger" size="large"></ion-icon>
        <ion-text color="danger">
          <h3>Error loading events</h3>
          <p>{{ error }}</p>
        </ion-text>
        <ion-button @click="loadEvents" fill="outline" color="primary">
          <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
          Try Again
        </ion-button>
      </div>

      <!-- Empty state -->
      <div v-else-if="!events.length" class="empty-container">
        <ion-icon :icon="calendarOutline" color="medium" size="large"></ion-icon>
        <ion-text color="medium">
          <h3>No Active Events</h3>
          <p>There are no active events at the moment.</p>
        </ion-text>
      </div>

      <!-- Events list -->
      <div v-else>
        <ion-card 
          v-for="event in events" 
          :key="event.id" 
          class="event-card"
          button
          @click="goToEventDetails(event.id)"
        >
          <ion-card-header>
            <ion-card-title>{{ event.name }}</ion-card-title>
          </ion-card-header>
        </ion-card>
      </div>

      <!-- Refresh button -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed" v-if="!loading">
        <ion-fab-button @click="loadEvents" color="primary">
          <ion-icon :icon="refreshOutline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonMenuButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonSpinner,
  IonText,
  IonIcon,
  IonButton,
  IonFab,
  IonFabButton
} from '@ionic/vue';
import {
  calendarOutline,
  alertCircleOutline,
  refreshOutline
} from 'ionicons/icons';
import { ApiService } from '@/utils/ApiService';

const router = useRouter();

interface Event {
  id: string | number;
  title?: string;
  name?: string;
  description?: string;
  date?: string;
  location?: string;
  status?: string;
  [key: string]: any;
}

const events = ref<Event[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

const loadEvents = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    const response = await ApiService.getEvents() as any;
    
    // Handle different response structures
    if (response.events && Array.isArray(response.events)) {
      events.value = response.events;
    } else if (Array.isArray(response.data)) {
      events.value = response.data;
    } else if (Array.isArray(response)) {
      events.value = response;
    } else {
      events.value = [];
    }
  } catch (err: any) {
    console.error('Error loading events:', err);
    error.value = err.message || 'Failed to load events';
    events.value = [];
  } finally {
    loading.value = false;
  }
};

const goToEventDetails = (eventId: string | number) => {
  router.push(`/event-details?id=${eventId}`);
};

onMounted(() => {
  loadEvents();
});
</script>

<style scoped>
.loading-container,
.error-container,
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  gap: 1rem;
}

.event-card {
  margin-bottom: 1rem;
}

.status-badge {
  margin-top: 0.5rem;
}

ion-icon {
  margin-right: 0.5rem;
}

ion-chip ion-icon {
  margin-right: 0.25rem;
}
</style>