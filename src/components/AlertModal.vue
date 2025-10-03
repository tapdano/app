<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleDismiss">
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ title }}</ion-title>
        <ion-buttons slot="primary">
          <ion-button @click="handleHeaderClose">{{ headerButtonText }}</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <div class="alert-content">
        <ion-icon 
          v-if="type === 'error'" 
          :icon="alertCircleOutline" 
          class="alert-icon error-icon"
        ></ion-icon>
        <ion-icon 
          v-else-if="type === 'success'" 
          :icon="checkmarkCircleOutline" 
          class="alert-icon success-icon"
        ></ion-icon>
        <ion-icon 
          v-else-if="type === 'warning'" 
          :icon="warningOutline" 
          class="alert-icon warning-icon"
        ></ion-icon>
        <ion-icon 
          v-else 
          :icon="informationCircleOutline" 
          class="alert-icon info-icon"
        ></ion-icon>
        
        <div class="alert-message" v-html="formattedMessage"></div>
      </div>
      
      <!-- Confirmation dialog buttons -->
      <div class="alert-buttons" v-if="showConfirmCancel">
        <ion-button 
          fill="outline" 
          color="medium" 
          @click="handleCancel"
          class="alert-button"
        >
          {{ cancelButtonText }}
        </ion-button>
        <ion-button 
          fill="solid" 
          :color="confirmButtonColor" 
          @click="handleConfirm"
          class="alert-button"
        >
          {{ confirmButtonText }}
        </ion-button>
      </div>
      
      <!-- Single OK button for non-confirmation alerts -->
      <div class="alert-buttons" v-else>
        <ion-button 
          fill="solid" 
          :color="confirmButtonColor" 
          @click="handleOk"
          class="alert-button single-button"
        >
          OK
        </ion-button>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonContent, 
  IonIcon 
} from '@ionic/vue';
import { 
  alertCircleOutline, 
  checkmarkCircleOutline, 
  warningOutline, 
  informationCircleOutline 
} from 'ionicons/icons';

export type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertOptions {
  title?: string;
  message: string;
  type?: AlertType;
  closeButtonText?: string;
  showConfirmCancel?: boolean;
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonColor?: string;
}

const isOpen = ref(false);
const title = ref('Alert');
const message = ref('');
const type = ref<AlertType>('info');
const closeButtonText = ref('OK');
const showConfirmCancel = ref(false);
const confirmButtonText = ref('Confirm');
const cancelButtonText = ref('Cancel');
const confirmButtonColor = ref('primary');

// Computed property for header button text
const headerButtonText = computed(() => {
  return showConfirmCancel.value ? 'Close' : 'Close';
});

let resolvePromise: ((value: boolean) => void) | null = null;

const formattedMessage = computed(() => {
  return message.value.replace(/\n/g, '<br>');
});

const openAlert = (options: AlertOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    title.value = options.title || getDefaultTitle(options.type || 'info');
    message.value = options.message;
    type.value = options.type || 'info';
    closeButtonText.value = options.closeButtonText || 'OK';
    showConfirmCancel.value = options.showConfirmCancel || false;
    confirmButtonText.value = options.confirmButtonText || 'Confirm';
    cancelButtonText.value = options.cancelButtonText || 'Cancel';
    confirmButtonColor.value = options.confirmButtonColor || getDefaultButtonColor(options.type || 'info');
    
    resolvePromise = resolve;
    isOpen.value = true;
  });
};

const getDefaultTitle = (alertType: AlertType): string => {
  switch (alertType) {
    case 'success': return 'Success';
    case 'error': return 'Error';
    case 'warning': return 'Warning';
    default: return 'Information';
  }
};

const getDefaultButtonColor = (alertType: AlertType): string => {
  switch (alertType) {
    case 'success': return 'success';
    case 'error': return 'danger';
    case 'warning': return 'warning';
    default: return 'primary';
  }
};

// Header close button - always acts as cancel/close
const handleHeaderClose = () => {
  isOpen.value = false;
  if (resolvePromise) {
    resolvePromise(false);
    resolvePromise = null;
  }
};

// OK button for non-confirmation alerts
const handleOk = () => {
  isOpen.value = false;
  if (resolvePromise) {
    resolvePromise(true);
    resolvePromise = null;
  }
};

// Confirm button for confirmation dialogs
const handleConfirm = () => {
  isOpen.value = false;
  if (resolvePromise) {
    resolvePromise(true);
    resolvePromise = null;
  }
};

// Cancel button for confirmation dialogs
const handleCancel = () => {
  isOpen.value = false;
  if (resolvePromise) {
    resolvePromise(false);
    resolvePromise = null;
  }
};

// Modal dismiss handler
const handleDismiss = () => {
  if (resolvePromise) {
    resolvePromise(false);
    resolvePromise = null;
  }
};

// Expose methods for parent components
defineExpose({
  openAlert
});
</script>

<style scoped>
.alert-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
}

.alert-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.error-icon {
  color: var(--ion-color-danger);
}

.success-icon {
  color: var(--ion-color-success);
}

.warning-icon {
  color: var(--ion-color-warning);
}

.info-icon {
  color: var(--ion-color-primary);
}

.alert-message {
  font-size: 16px;
  line-height: 1.5;
  margin-bottom: 20px;
  max-width: 100%;
  word-wrap: break-word;
}

.alert-buttons {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.alert-button {
  flex: 1;
  max-width: 120px;
}

.single-button {
  max-width: 100px;
  margin: 0 auto;
}
</style>
