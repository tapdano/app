<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <ion-item>
          <ion-toggle :checked="isDarkMode" :disabled="true">Dark Mode</ion-toggle>
        </ion-item>
        <ion-item>
          <ion-toggle @ionChange="toggleDevMode" :checked="isDevMode">Developer Mode</ion-toggle>
        </ion-item>
        <ion-item>
          <ion-toggle @ionChange="toggleSimulateNFCTag" :checked="isSimulateNFCTag">Simulate NFC Tag</ion-toggle>
        </ion-item>
        <ion-item>
          <ion-label>Network</ion-label>
          <ion-select v-model="network" @ionChange="updateNetwork">
            <ion-select-option value="1">Mainnet</ion-select-option>
            <ion-select-option value="0">PreProd</ion-select-option>
            <ion-select-option value="7">ShanchoNet</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item>
          <ion-label>Cache Name: {{ cacheName }}</ion-label>
        </ion-item>
        <div id="update-container">
          <ion-button @click="checkForUpdate" expand="block">Check for Updates</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonToggle, IonLabel, IonButton, IonItem, IonSelect, IonSelectOption, ToggleChangeEventDetail } from '@ionic/vue';
import { getNetworkId, setNetworkId, getDevMode, getSimulateNFCTag, setDevMode, setSimulateNFCTag } from '@/utils/StorageUtils';

const isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
const isDevMode = ref<boolean | undefined>(undefined);
const isSimulateNFCTag = ref<boolean | undefined>(undefined);
const cacheName = ref<string | null>(null);
const network = ref<string | null>(null);

const toggleDevMode = async (event: any) => {
  await setDevMode(event.detail.checked);
  window.location.reload();
};

const toggleSimulateNFCTag = async (event: any) => {
  await setSimulateNFCTag(event.detail.checked);
  window.location.reload();
};

const updateNetwork = async (event: any) => {
  await setNetworkId(event.detail.value);
  window.location.reload();
};

const getCacheName = async (): Promise<string> => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = (event) => {
        if (event.data) {
          resolve(event.data);
        } else {
          reject('No cache name returned');
        }
      };
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ action: 'getCacheName' }, [messageChannel.port2]);
      }
    });
  } else {
    return Promise.reject('Service Worker is not supported or not controlling the page');
  }
};

const checkForUpdate = () => {
  alert((window as any).nfc);
  alert(JSON.stringify((window as any).nfc));
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      if (registration && registration.waiting) {
        registration.waiting.postMessage({ action: 'skipWaiting' });
      }
    });
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.update().then(() => {
          console.log('Service Worker checked for updates.');
        }).catch((error) => {
          console.error('Error checking for Service Worker updates:', error);
        });
      } else {
        console.error('No Service Worker registration found.');
      }
    });
  }
};

onMounted(async () => {
  isDevMode.value = await getDevMode();
  isSimulateNFCTag.value = await getSimulateNFCTag();
  network.value = String(await getNetworkId());
  try {
    cacheName.value = await getCacheName();
  } catch (error) {
    console.error('Failed to get cache name:', error);
  }
});
</script>

<style scoped>
#update-container {
  text-align: center;
  margin-top: 20px;
}
</style>