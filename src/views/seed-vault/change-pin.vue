<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault/settings"></ion-back-button>
        </ion-buttons>
        <ion-title>Change PIN</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <form @submit.prevent="handleChangePin">
          <ion-item>
            <ion-input 
              v-model="newPin" 
              label="New PIN" 
              placeholder="Enter new PIN" 
              :maxlength="6" 
              type="password" 
              inputmode="numeric" 
              pattern="[0-9]*"
            ></ion-input>
          </ion-item>
          <ion-item>
            <ion-input 
              v-model="confirmPin" 
              label="Confirm PIN" 
              placeholder="Repeat new PIN" 
              :maxlength="6" 
              type="password" 
              inputmode="numeric" 
              pattern="[0-9]*"
            ></ion-input>
          </ion-item>
          <ion-button 
            expand="block" 
            type="submit"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Changing...' : 'Change PIN' }}
          </ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton } from '@ionic/vue';
import { ApiService } from '@/utils/ApiService';
import { StorageService } from '@/utils/StorageService';
import { ValidationService } from '@/utils/ValidationService';
import { UIService } from '@/utils/UIService';

const router = useRouter();
const storageService = new StorageService();

const newPin = ref('');
const confirmPin = ref('');
const isLoading = ref(false);

const handleChangePin = async () => {
  if (isLoading.value) return;
  
  // Validate input
  const validation = ValidationService.validatePinConfirmation(newPin.value, confirmPin.value);
  if (!validation.isValid) {
    UIService.showError(validation.error);
    return;
  }
  
  isLoading.value = true;
  
  try {
    const currentTag = await storageService.getCurrentTag();
    if (!currentTag) {
      throw new Error('Tag not found');
    }
    
    const { id, seedVaultKey } = currentTag.tag;
    
    await ApiService.setPin(id, newPin.value, seedVaultKey || '');
    
    UIService.showSuccess('PIN changed successfully.');
    router.replace('/seed-vault/settings');
    
  } catch (error) {
    UIService.showError(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
ion-button {
  margin-top: 20px;
}
</style>