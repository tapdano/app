<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault" @click="() => { router.replace('/seed-vault'); }"></ion-back-button>
        </ion-buttons>
        <ion-title>Authentication</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div class="main-container">
        <!-- Header Section -->
        <div class="header-section">
          <ion-icon :icon="shieldCheckmarkOutline" class="header-icon"></ion-icon>
          <h1 class="header-title">Secure Access</h1>
          <p class="header-description">Choose your preferred authentication method</p>
        </div>

        <!-- Authentication Method Selection -->
        <div class="auth-method-section">
          <ion-segment v-model="activeTab" class="auth-segment">
            <ion-segment-button value="pin" class="segment-button">
              <ion-icon :icon="keypadOutline"></ion-icon>
              <ion-label>PIN</ion-label>
            </ion-segment-button>
            <ion-segment-button value="otp" class="segment-button">
              <ion-icon :icon="mailOutline"></ion-icon>
              <ion-label>Email Code</ion-label>
            </ion-segment-button>
          </ion-segment>
        </div>

        <!-- PIN Authentication -->
        <div v-if="activeTab === 'pin'" class="auth-form-section">
          <form @submit.prevent="handlePinSubmit">
            <ion-item class="form-item" :class="{ 'ion-invalid': pinError }">
              <ion-label position="stacked">PIN Code</ion-label>
              <ion-input 
                v-model="pin" 
                placeholder="Enter your 6-digit PIN" 
                type="password" 
                inputmode="numeric" 
                :maxlength="6"
                @ionInput="validatePin"
                @ionBlur="validatePin"
              ></ion-input>
              <ion-note slot="error" v-if="pinError">{{ pinError }}</ion-note>
            </ion-item>
            
            <ion-button 
              expand="block" 
              type="submit" 
              :disabled="isLoading || !isPinValid"
              class="submit-button"
            >
              <ion-spinner v-if="isLoading" name="crescent" slot="start"></ion-spinner>
              <ion-icon v-else :icon="logInOutline" slot="start"></ion-icon>
              {{ isLoading ? 'Authenticating...' : 'Login' }}
            </ion-button>
          </form>
        </div>

        <!-- OTP Authentication -->
        <div v-else class="auth-form-section">
          <form @submit.prevent="handleOtpSubmit">
            <div class="otp-info">
              <ion-icon :icon="mailOutline" class="info-icon"></ion-icon>
              <p>We'll send a verification code to your registered email address</p>
            </div>
            
            <ion-item class="form-item" :class="{ 'ion-invalid': codeError }">
              <ion-label position="stacked">Verification Code</ion-label>
              <ion-input 
                v-model="code" 
                placeholder="Enter 6-digit code" 
                inputmode="numeric" 
                :maxlength="6"
                @ionInput="validateCode"
                @ionBlur="validateCode"
              ></ion-input>
              <ion-note slot="error" v-if="codeError">{{ codeError }}</ion-note>
            </ion-item>
            
            <ion-button 
              expand="block" 
              fill="outline"
              @click="sendOtpCode" 
              :disabled="isLoading"
              class="send-code-button"
            >
              <ion-spinner v-if="isLoading" name="crescent" slot="start"></ion-spinner>
              <ion-icon v-else :icon="sendOutline" slot="start"></ion-icon>
              {{ isLoading ? 'Sending...' : 'Send Code' }}
            </ion-button>
            
            <ion-button 
              expand="block" 
              type="submit" 
              :disabled="isLoading || !isCodeValid"
              class="submit-button"
            >
              <ion-spinner v-if="isLoading" name="crescent" slot="start"></ion-spinner>
              <ion-icon v-else :icon="logInOutline" slot="start"></ion-icon>
              {{ isLoading ? 'Verifying...' : 'Verify Code' }}
            </ion-button>
          </form>
        </div>

        <!-- Security Notice -->
        <div class="security-notice">
          <ion-icon :icon="shieldOutline" class="notice-icon"></ion-icon>
          <p>Your authentication is encrypted and secure</p>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton, IonSegment, IonSegmentButton, IonIcon, IonLabel, IonNote, IonSpinner } from '@ionic/vue';
import { shieldCheckmarkOutline, keypadOutline, mailOutline, logInOutline, sendOutline, shieldOutline } from 'ionicons/icons';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ApiService } from '@/utils/ApiService';
import { SeedVaultStorageService } from '@/utils/storage-services/SeedVaultStorageService';
import { AppConfigStorageService } from '@/utils/storage-services/AppConfigStorageService';
import { ValidationService } from '@/utils/ValidationService';
import { UIService } from '@/utils/UIService';

const router = useRouter();
const seedVaultService = new SeedVaultStorageService();
const appConfigService = new AppConfigStorageService();

const code = ref('');
const pin = ref('');
const tagId = ref('');
const email = ref('');
const activeTab = ref('pin');
const tagLabels = ref<string[]>([]);
const tagChains = ref<string[]>([]);
const isLoading = ref(false);

// Validation states
const pinError = ref('');
const codeError = ref('');

// Computed properties for validation
const isPinValid = computed(() => {
  return pin.value.length === 6 && /^\d{6}$/.test(pin.value);
});

const isCodeValid = computed(() => {
  return code.value.length === 6 && /^\d{6}$/.test(code.value);
});

// Validation functions
const validatePin = () => {
  if (!pin.value) {
    pinError.value = '';
    return;
  }
  
  if (pin.value.length < 6) {
    pinError.value = 'PIN must be 6 digits';
  } else if (!/^\d{6}$/.test(pin.value)) {
    pinError.value = 'PIN must contain only numbers';
  } else {
    pinError.value = '';
  }
};

const validateCode = () => {
  if (!code.value) {
    codeError.value = '';
    return;
  }
  
  if (code.value.length < 6) {
    codeError.value = 'Code must be 6 digits';
  } else if (!/^\d{6}$/.test(code.value)) {
    codeError.value = 'Code must contain only numbers';
  } else {
    codeError.value = '';
  }
};

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  tagId.value = urlParams.get('id') || '';
  email.value = urlParams.get('email') || '';
  tagLabels.value = await seedVaultService.getTempTagLabels();
  tagChains.value = await seedVaultService.getTempTagChains();
  
  // Se estiver em modo de desenvolvimento, preencher automaticamente o PIN
  const isDevMode = await appConfigService.getDevMode();
  if (isDevMode) {
    pin.value = '123456';
  }
});

const sendOtpCode = async () => {
  if (!tagId.value) {
    await UIService.showError('Tag ID not found.');
    return;
  }
  
  isLoading.value = true;
  
  try {
    await ApiService.authByOtp(tagId.value);
    await UIService.showSuccess('Code sent to your email.');
  } catch (error) {
    await UIService.showError(error);
  } finally {
    isLoading.value = false;
  }
};

const handleOtpSubmit = async () => {
  if (isLoading.value) return;
  
  // Validate code
  const validation = ValidationService.validateRequiredField(code.value, 'Code');
  if (!validation.isValid) {
    await UIService.showError(validation.error);
    return;
  }
  
  isLoading.value = true;
  
  try {
    const result = await ApiService.verifyOtp(tagId.value, code.value) as any;
    
    if (result.verified && result.key) {
      const tagPhysicalId = await seedVaultService.getTempTagPhysicalId();
      await seedVaultService.saveSeedVaultTag({ 
        key: result.key, 
        tagId: tagId.value, 
        physicalId: tagPhysicalId || undefined,
        labels: tagLabels.value, 
        chains: tagChains.value 
      });
      await seedVaultService.clearTempData();
      router.replace('/seed-vault/main');
    } else {
      await UIService.showError('Invalid code');
    }
  } catch (error) {
    await UIService.showError(error);
  } finally {
    isLoading.value = false;
  }
};

const handlePinSubmit = async () => {
  if (isLoading.value) return;
  
  // Validate PIN
  const validation = ValidationService.validatePin(pin.value);
  if (!validation.isValid) {
    await UIService.showError(validation.error);
    return;
  }
  
  isLoading.value = true;
  
  try {
    const result = await ApiService.authByPin(tagId.value, pin.value) as any;
    
    if (result.verified && result.key) {
      const tagPhysicalId = await seedVaultService.getTempTagPhysicalId();
      await seedVaultService.saveSeedVaultTag({ 
        key: result.key, 
        tagId: tagId.value, 
        physicalId: tagPhysicalId || undefined,
        labels: tagLabels.value, 
        chains: tagChains.value 
      });
      await seedVaultService.clearTempData();
      router.replace('/seed-vault/main');
    } else {
      await UIService.showError('Invalid PIN');
    }
  } catch (error) {
    await UIService.showError(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.main-container {
  padding: var(--spacing-lg);
  max-width: 500px;
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

.auth-method-section {
  margin-bottom: var(--spacing-xl);
}

.auth-segment {
  --background: var(--ion-color-light);
  --border-radius: var(--border-radius-lg);
  padding: var(--spacing-xs);
}

.segment-button {
  --color: var(--ion-color-medium);
  --color-checked: var(--ion-color-primary);
  --border-radius: var(--border-radius-md);
  font-weight: var(--font-weight-medium);
}

.auth-form-section {
  margin-bottom: var(--spacing-xl);
}

.form-item {
  margin-bottom: var(--spacing-md);
  --border-radius: var(--border-radius-md);
  --background: var(--ion-color-background);
  --border-color: var(--ion-color-light-shade);
  --border-width: 1px;
  --border-style: solid;
  --padding-start: var(--spacing-md);
  --padding-end: var(--spacing-md);
  --padding-top: var(--spacing-sm);
  --padding-bottom: var(--spacing-sm);
}

.form-item.ion-invalid {
  --border-color: var(--ion-color-danger);
}

.otp-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--ion-color-primary-tint);
  border-radius: var(--border-radius-md);
}

.info-icon {
  font-size: 20px;
  color: black;
}

.otp-info p {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  color: black;
}

.submit-button {
  --border-radius: var(--border-radius-md);
  --padding-top: var(--spacing-md);
  --padding-bottom: var(--spacing-md);
  font-weight: var(--font-weight-semibold);
  margin-top: var(--spacing-md);
}

.send-code-button {
  --border-radius: var(--border-radius-md);
  --padding-top: var(--spacing-md);
  --padding-bottom: var(--spacing-md);
  font-weight: var(--font-weight-medium);
  margin-top: var(--spacing-sm);
}

.security-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--ion-color-success-tint);
  border-radius: var(--border-radius-md);
  color: black;
}

.notice-icon {
  font-size: 20px;
  color: black;
}

.security-notice p {
  margin: 0;
  font-size: 14px;
  font-weight: var(--font-weight-medium);
  color: black;
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
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .header-section {
    background: var(--ion-color-surface);
    border-color: var(--ion-color-medium);
  }
  
  .auth-segment {
    --background: var(--ion-color-surface);
  }
  
  .form-item {
    --background: var(--ion-color-surface);
    --border-color: var(--ion-color-medium);
  }
  
  .otp-info {
    background: var(--ion-color-primary-shade);
    color: var(--ion-color-primary-tint);
  }
  
  .security-notice {
    background: var(--ion-color-success-shade);
    color: var(--ion-color-success-tint);
  }
}
</style>