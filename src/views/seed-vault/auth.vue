<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault"></ion-back-button>
        </ion-buttons>
        <ion-title>Authentication</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <ion-segment v-model="activeTab">
          <ion-segment-button value="pin">By PIN</ion-segment-button>
          <ion-segment-button value="otp">By E-mail Code</ion-segment-button>
        </ion-segment>
        <div v-if="activeTab === 'pin'" style="margin-top:20px;">
          <form @submit.prevent="handlePinSubmit">
            <ion-item>
              <ion-input v-model="pin" label="PIN" placeholder="Enter PIN" type="password" inputmode="numeric" :maxlength="6"></ion-input>
            </ion-item>
            <ion-button id="submit-button" expand="block" type="submit" :disabled="isLoading">
              {{ isLoading ? 'Authenticating...' : 'Login' }}
            </ion-button>
          </form>
        </div>
        <div v-else style="margin-top:20px;">
          <form @submit.prevent="handleOtpSubmit">
            <p>Please enter the code sent to your email</p>
            <ion-item>
              <ion-input v-model="code" label="Code" placeholder="123456" inputmode="numeric" :maxlength="6"></ion-input>
            </ion-item>
            <ion-button expand="block" type="submit" :disabled="isLoading">
              {{ isLoading ? 'Verifying...' : 'Login' }}
            </ion-button>
          </form>
          <ion-button expand="block" color="secondary" style="margin-top:10px;" @click="sendOtpCode" :disabled="isLoading">
            {{ isLoading ? 'Sending...' : 'Send Code' }}
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton, IonSegment, IonSegmentButton } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { saveSeedVaultTag } from '@/utils/SeedVaultUtils';
import { ApiService } from '@/utils/ApiService';
import { StorageService } from '@/utils/StorageService';
import { ValidationService } from '@/utils/ValidationService';
import { UIService } from '@/utils/UIService';

const router = useRouter();
const storageService = new StorageService();

const code = ref('');
const pin = ref('');
const tagId = ref('');
const email = ref('');
const activeTab = ref('pin');
const tagLabels = ref<string[]>([]);
const isLoading = ref(false);

onMounted(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  tagId.value = urlParams.get('id') || '';
  email.value = urlParams.get('email') || '';
  tagLabels.value = await storageService.get('temp_tag_labels') || [];
});

const sendOtpCode = async () => {
  if (!tagId.value) {
    UIService.showError('Tag ID not found.');
    return;
  }
  
  isLoading.value = true;
  
  try {
    await ApiService.authByOtp(tagId.value);
    UIService.showSuccess('Code sent to your email.');
  } catch (error) {
    UIService.showError(error);
  } finally {
    isLoading.value = false;
  }
};

const handleOtpSubmit = async () => {
  if (isLoading.value) return;
  
  // Validate code
  const validation = ValidationService.validateRequiredField(code.value, 'Code');
  if (!validation.isValid) {
    UIService.showError(validation.error);
    return;
  }
  
  isLoading.value = true;
  
  try {
    const result = await ApiService.verifyOtp(tagId.value, code.value) as any;
    
    if (result.verified && result.key) {
      await saveSeedVaultTag({ key: result.key, tagId: tagId.value, labels: tagLabels.value });
      await storageService.clearTempData();
      router.replace('/seed-vault/main');
    } else {
      UIService.showError('Invalid code');
    }
  } catch (error) {
    UIService.showError(error);
  } finally {
    isLoading.value = false;
  }
};

const handlePinSubmit = async () => {
  if (isLoading.value) return;
  
  // Validate PIN
  const validation = ValidationService.validatePin(pin.value);
  if (!validation.isValid) {
    UIService.showError(validation.error);
    return;
  }
  
  isLoading.value = true;
  
  try {
    const result = await ApiService.authByPin(tagId.value, pin.value) as any;
    
    if (result.verified && result.key) {
      await saveSeedVaultTag({ key: result.key, tagId: tagId.value, labels: tagLabels.value });
      await storageService.clearTempData();
      router.replace('/seed-vault/main');
    } else {
      UIService.showError('Invalid PIN');
    }
  } catch (error) {
    UIService.showError(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
#submit-button {
  margin-top: 20px;
}
</style>