<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Lottery Participants</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="refreshParticipants" :disabled="refreshing">
            <ion-spinner v-if="refreshing" name="crescent"></ion-spinner>
            <ion-icon v-else :icon="refreshOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" class="ion-padding">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Lottery Participants</ion-title>
        </ion-toolbar>
      </ion-header>

      <!-- Loading state (initial load only) -->
      <div v-if="loading && participants.length === 0" class="loading-container">
        <ion-spinner name="crescent"></ion-spinner>
        <ion-text color="medium">
          <p>Loading participants...</p>
        </ion-text>
      </div>

      <!-- Error state -->
      <div v-else-if="error && participants.length === 0" class="error-container">
        <ion-icon :icon="alertCircleOutline" color="danger" size="large"></ion-icon>
        <ion-text color="danger">
          <h3>Error loading participants</h3>
          <p>{{ error }}</p>
        </ion-text>
        <ion-button @click="refreshParticipants" fill="outline" color="primary">
          <ion-icon :icon="refreshOutline" slot="start"></ion-icon>
          Try Again
        </ion-button>
      </div>

      <!-- No participants state -->
      <div v-else-if="participants.length === 0 && !loading" class="empty-container">
        <ion-icon :icon="peopleOutline" color="medium" size="large"></ion-icon>
        <ion-text color="medium">
          <h3>No Participants Yet</h3>
          <p>No one has registered for this lottery yet.</p>
        </ion-text>
      </div>

      <!-- Participants list -->
      <div v-else>
        <!-- Event info header -->
        <ion-card v-if="eventName">
          <ion-card-header>
            <ion-card-title>{{ eventName }}</ion-card-title>
            <ion-card-subtitle>{{ participants.length }} participant{{ participants.length !== 1 ? 's' : '' }}</ion-card-subtitle>
          </ion-card-header>
          <ion-card-content v-if="participants.length >= 2">
            <ion-button 
              expand="block" 
              @click="startLotteryDraw" 
              :disabled="isDrawing"
              color="success"
              size="large"
            >
              <ion-spinner v-if="isDrawing" name="crescent" slot="start"></ion-spinner>
              <ion-icon v-else :icon="trophyOutline" slot="start"></ion-icon>
              <span v-if="!isDrawing">Draw Winner</span>
              <span v-else>Drawing Winner...</span>
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Participants -->
        <ion-list>
          <ion-item 
            v-for="(participant, index) in participants" 
            :key="participant.id"
            :class="{
              'participant-highlighted': highlightedParticipant === index,
              'participant-winner': winner && winner.id === participant.id
            }"
            class="participant-item"
          >
            <ion-avatar slot="start">
              <ion-icon :icon="personOutline" size="large"></ion-icon>
            </ion-avatar>
            <ion-label>
              <h3>{{ obfuscateEmail(participant.email) }}</h3>
              <p>{{ formatTimeAgo(participant.data_cadastro) }}</p>
            </ion-label>
            <ion-badge slot="end" color="medium">
              #{{ index + 1 }}
            </ion-badge>
          </ion-item>
        </ion-list>
      </div>

    </ion-content>

    <!-- Winner Modal -->
    <ion-modal :is-open="showWinnerModal" @did-dismiss="closeWinnerModal">
      <ion-header>
        <ion-toolbar>
          <ion-title>🎉 Lottery Winner! 🎉</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="closeWinnerModal">
              <ion-icon :icon="closeOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="winner-modal-content">
        <div class="winner-celebration">
          <div class="confetti">
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
            <div class="confetti-piece"></div>
          </div>
          
          <h1 class="congratulations">🎊 Congratulations! 🎊</h1>
          
          <div class="winner-info">
            <h2 class="winner-email">{{ winner?.email || '' }}</h2>
            <p class="winner-subtitle">You are the lottery winner!</p>
          </div>

          <ion-button 
            expand="block" 
            @click="closeWinnerModal" 
            color="success" 
            size="large"
            class="close-winner-button"
          >
            <ion-icon :icon="checkmarkOutline" slot="start"></ion-icon>
            Awesome!
          </ion-button>
        </div>
      </ion-content>
    </ion-modal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonSpinner,
  IonText,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonAvatar,
  IonBadge,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonModal
} from '@ionic/vue';
import {
  alertCircleOutline,
  refreshOutline,
  peopleOutline,
  personOutline,
  trophyOutline,
  closeOutline,
  checkmarkOutline
} from 'ionicons/icons';
import { ApiService } from '@/utils/ApiService';
import { UIService } from '@/utils/UIService';

const route = useRoute();

interface Participant {
  id: string;
  event_id: string;
  tag_id: string;
  email: string;
  data_cadastro: string;
}

const participants = ref<Participant[]>([]);
const loading = ref(false);
const refreshing = ref(false);
const error = ref<string | null>(null);
const eventName = ref<string>('');

// Lottery drawing states
const isDrawing = ref(false);
const highlightedParticipant = ref<number | null>(null);
const winner = ref<Participant | null>(null);
const showWinnerModal = ref(false);

let refreshInterval: NodeJS.Timeout | null = null;

const loadParticipants = async (isRefresh = false) => {
  const eventId = route.query.event_id;
  if (!eventId) {
    error.value = 'No event ID provided';
    return;
  }

  try {
    if (isRefresh) {
      refreshing.value = true;
    } else {
      loading.value = true;
    }
    error.value = null;
    
    const response = await ApiService.getLotteryParticipants(eventId.toString()) as any;
    
    if (response.status === 'ok' && Array.isArray(response.participants)) {
      participants.value = response.participants;
      
      // Load event name if we don't have it yet
      if (!eventName.value && participants.value.length > 0) {
        await loadEventName(eventId.toString());
      }
    } else {
      participants.value = [];
      error.value = 'Invalid response format';
    }
  } catch (err: any) {
    console.error('Error loading participants:', err);
    if (!isRefresh || participants.value.length === 0) {
      error.value = err.message || 'Failed to load participants';
    }
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};

const loadEventName = async (eventId: string) => {
  try {
    const response = await ApiService.getEvents() as any;
    let events: any[] = [];
    
    if (response.events && Array.isArray(response.events)) {
      events = response.events;
    } else if (Array.isArray(response.data)) {
      events = response.data;
    } else if (Array.isArray(response)) {
      events = response;
    }

    const event = events.find(e => e.id.toString() === eventId);
    if (event) {
      eventName.value = event.name || event.title || `Event ${eventId}`;
    }
  } catch (err) {
    console.error('Error loading event name:', err);
    eventName.value = `Event ${eventId}`;
  }
};

const refreshParticipants = async () => {
  await loadParticipants(true);
  scheduleAutoRefresh();
};

const obfuscateEmail = (email: string): string => {
  if (!email || !email.includes('@')) return email;
  
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) return email;
  
  const halfLength = Math.ceil(localPart.length / 2);
  const visiblePart = localPart.substring(0, Math.max(1, localPart.length - halfLength));
  const obfuscatedPart = '*'.repeat(halfLength);
  
  return `${visiblePart}${obfuscatedPart}@${domain}`;
};

const formatTimeAgo = (dateString: string): string => {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return `${diffInSeconds} second${diffInSeconds !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
  } catch {
    return 'Unknown time';
  }
};

const scheduleAutoRefresh = () => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  refreshInterval = setTimeout(async () => {
    await refreshParticipants();
  }, 15000);
};

const startLotteryDraw = async () => {
  if (participants.value.length === 0) {
    await UIService.showError('No participants to draw from!');
    return;
  }

  // Pause auto refresh during lottery draw
  if (refreshInterval) {
    clearTimeout(refreshInterval);
    refreshInterval = null;
  }

  isDrawing.value = true;
  highlightedParticipant.value = null;
  winner.value = null;

  // Play audio if available
  let audio = null;
  try {
    audio = new Audio('/lottery.mp3');
    audio.play().catch(() => {
      // Audio failed to play, continue silently
    });
  } catch {
    // Audio not available, continue silently
  }

  // Animation: randomly highlight participants for 40 seconds
  const animationDuration = 40000; // 40 seconds
  const highlightInterval = 100; // Highlight every 100ms
  const totalHighlights = animationDuration / highlightInterval;
  let currentHighlight = 0;

  const animationTimer = setInterval(() => {
    // Randomly highlight a participant
    const randomIndex = Math.floor(Math.random() * participants.value.length);
    highlightedParticipant.value = randomIndex;
    
    currentHighlight++;
    
    if (currentHighlight >= totalHighlights) {
      clearInterval(animationTimer);
      
      // Select the final winner (random)
      const winnerIndex = Math.floor(Math.random() * participants.value.length);
      winner.value = participants.value[winnerIndex];
      highlightedParticipant.value = null;
      isDrawing.value = false;
      showWinnerModal.value = true;
      try {
        if (audio) audio.pause();
      } catch {
      }
    }
  }, highlightInterval);
};

const closeWinnerModal = () => {
  showWinnerModal.value = false;
  winner.value = null;
};

onMounted(async () => {
  await loadParticipants();
  scheduleAutoRefresh();
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
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

.auto-refresh-indicator {
  display: flex;
  justify-content: center;
  padding: 1rem;
  margin-top: 1rem;
}

.auto-refresh-indicator p {
  font-size: 0.9rem;
  font-style: italic;
}

ion-avatar {
  background-color: var(--ion-color-light);
  display: flex;
  align-items: center;
  justify-content: center;
}

ion-list {
  margin-top: 1rem;
}

ion-item {
  margin-bottom: 0.5rem;
  --border-radius: 8px;
  --background: var(--ion-color-light);
}

ion-card {
  margin-bottom: 1rem;
}

ion-badge {
  --background: var(--ion-color-medium);
  --color: white;
}

/* Lottery Drawing Styles */
.participant-highlighted {
  --background: var(--ion-color-warning) !important;
  animation: pulse 0.3s ease-in-out;
}

.participant-winner {
  --background: var(--ion-color-success) !important;
  --color: white !important;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* Winner Modal Styles */
.winner-modal {
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --color: white;
}

.winner-content {
  text-align: center;
  padding: 2rem;
  position: relative;
  overflow: hidden;
}

.confetti-animation {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="%23FFD700"/><circle cx="80" cy="30" r="2" fill="%23FF69B4"/><circle cx="50" cy="60" r="2" fill="%2300FF7F"/><circle cx="30" cy="80" r="2" fill="%23FF4500"/></svg>') repeat;
  animation: confetti-fall 3s linear infinite;
  pointer-events: none;
}

@keyframes confetti-fall {
  0% { transform: translateY(-100vh) rotate(0deg); }
  100% { transform: translateY(100vh) rotate(360deg); }
}

.trophy-icon {
  font-size: 4rem;
  color: #FFD700;
  margin-bottom: 1rem;
}

.winner-title {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.winner-subtitle {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  opacity: 0.9;
}

.winner-email {
  font-size: 1.8rem;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.2);
  padding: 1rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  word-break: break-all;
}

.close-button {
  --background: rgba(255, 255, 255, 0.2);
  --color: white;
  --border-radius: 50%;
  --padding: 8px;
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.winner-celebration{
  padding: 0 20px;
}
</style>