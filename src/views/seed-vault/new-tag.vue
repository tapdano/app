<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault" @click="() => { router.replace('/seed-vault'); }"></ion-back-button>
        </ion-buttons>
        <ion-title>New Seed Vault</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <form @submit.prevent="handleSubmit">
          <p>Enter an email address and PIN to associate with this tag</p>
          <ion-item>
            <ion-input v-model="email" label="E-mail" placeholder="valid e-mail"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="pin" label="PIN" placeholder="Choose a PIN" :maxlength="6" type="password" inputmode="numeric" pattern="[0-9]*"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="confirmPin" label="Confirm PIN" placeholder="Repeat your PIN" :maxlength="6" type="password" inputmode="numeric" pattern="[0-9]*"></ion-input>
          </ion-item>
          <ion-button id="submit-button" expand="block" type="submit" :disabled="isLoading">
            {{ isLoading ? 'Enviando...' : 'Send' }}
          </ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ApiService } from '@/utils/ApiService';
import { SeedVaultStorageService } from '@/utils/storage-services/SeedVaultStorageService';
import { AppConfigStorageService } from '@/utils/storage-services/AppConfigStorageService';
import { ValidationService } from '@/utils/ValidationService';
import { UIService } from '@/utils/UIService';

const router = useRouter();
const seedVaultService = new SeedVaultStorageService();
const appConfigService = new AppConfigStorageService();

const email = ref('');
const pin = ref('');
const confirmPin = ref('');
const tagId = ref('');
const tagLabels = ref<string[]>([]);
const isLoading = ref(false);

const handleSubmit = async () => {
  if (isLoading.value) return;
  
  // Validate email
  const emailValidation = ValidationService.validateEmail(email.value);
  if (!emailValidation.isValid) {
    await UIService.showError(emailValidation.error);
    return;
  }
  
  // Validate PIN confirmation
  const pinValidation = ValidationService.validatePinConfirmation(pin.value, confirmPin.value);
  if (!pinValidation.isValid) {
    await UIService.showError(pinValidation.error);
    return;
  }
  
  isLoading.value = true;
  
  try {
    const urlParams = new URLSearchParams(window.location.search);
    tagId.value = urlParams.get('id') || '';
    tagLabels.value = await seedVaultService.getTempTagLabels();

    const result = await ApiService.startTag(tagId.value, email.value, pin.value) as any;
    
    if (result.key) {
      const tagChains = await seedVaultService.getTempTagChains();
      const tagPhysicalId = await seedVaultService.getTempTagPhysicalId();
      await seedVaultService.saveSeedVaultTag({ 
        key: result.key, 
        tagId: tagId.value, 
        physicalId: tagPhysicalId || undefined,
        labels: tagLabels.value, 
        chains: tagChains 
      });
      await seedVaultService.clearTempData();
      router.replace('/seed-vault/main');
    } else {
      await UIService.showError(result.error || 'Error associating email');
    }
  } catch (error) {
    await UIService.showError(error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(async () => {
  // Se estiver em modo de desenvolvimento, preencher automaticamente os campos
  const isDevMode = await appConfigService.getDevMode();
  if (isDevMode) {
    email.value = 'boemekeld@gmail.com';
    pin.value = '123456';
    confirmPin.value = '123456';
  }
});
</script>

<style scoped>
#submit-button {
  margin-top: 20px;
}
</style>