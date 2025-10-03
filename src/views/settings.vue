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
        <!--
        <ion-item>
          <ion-toggle :checked="isDarkMode" :disabled="true">Dark Mode</ion-toggle>
        </ion-item>
        -->
        <ion-item>
          <ion-toggle @ionChange="toggleDevMode" :checked="isDevMode">Developer Mode</ion-toggle>
        </ion-item>
        <ion-item>
          <ion-toggle @ionChange="toggleSimulateNFCTag" :checked="isSimulateNFCTag">Use Virtual NFC Tag</ion-toggle>
        </ion-item>
        <ion-item v-if="isDevMode">
          <ion-toggle @ionChange="toggleHomologAPI" :checked="isHomologAPI">Use Homolog API</ion-toggle>
        </ion-item>
        <ion-item v-if="isDevMode">
          <ion-toggle @ionChange="toggleBulkBurn" :checked="isBulkBurn">Enable Bulk Burn</ion-toggle>
        </ion-item>
        <ion-item>
          <ion-label position="stacked">Virtual NFC Tag Passcode</ion-label>
          <ion-input v-model="devToken" placeholder="Enter passcode"></ion-input>
        </ion-item>
        <ion-button @click="saveDevToken" expand="block" style="margin-top:10px;">Save</ion-button>
        <div v-if="devTokenSaved" class="token-saved-msg">Passcode saved!</div>
        
        <!-- App Version Information -->
        <ion-item style="margin-top:40px;">
          <ion-label>
            <h3>App Version</h3>
            <p>Marketing Version: {{ appVersion }}</p>
            <p>Build Number: {{ buildNumber }}</p>
            <p>Last Updated: {{ lastBuildTime }}</p>
          </ion-label>
        </ion-item>
        <!--
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
        -->
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonToggle, IonLabel, IonButton, IonItem, IonSelect, IonSelectOption, ToggleChangeEventDetail, IonAccordionGroup, IonAccordion, IonInput } from '@ionic/vue';
import { AppConfigStorageService } from '@/utils/storage-services/AppConfigStorageService';
import { App } from '@capacitor/app';
import { format } from 'timeago.js';
import { UIService } from '@/utils/UIService';

const isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
const isDevMode = ref<boolean | undefined>(undefined);
const isSimulateNFCTag = ref<boolean | undefined>(undefined);
const isHomologAPI = ref<boolean | undefined>(undefined);
const isBulkBurn = ref<boolean | undefined>(undefined);
const cacheName = ref<string | null>(null);
const network = ref<string | null>(null);

const devToken = ref('');
const devTokenSaved = ref(false);
const appVersion = ref('');
const buildNumber = ref('');
const lastBuildTime = ref('');
const appConfigService = new AppConfigStorageService();

const toggleDevMode = async (event: any) => {
  isDevMode.value = event.detail.checked;
  await appConfigService.setDevMode(event.detail.checked);
  window.location.reload();
};

const toggleSimulateNFCTag = async (event: any) => {
  isSimulateNFCTag.value = event.detail.checked;
  await appConfigService.setSimulateNFCTag(event.detail.checked);
  window.location.reload();
};

const toggleHomologAPI = async (event: any) => {
  isHomologAPI.value = event.detail.checked;
  await appConfigService.setHomologAPI(event.detail.checked);
  window.location.reload();
};

const toggleBulkBurn = async (event: any) => {
  isBulkBurn.value = event.detail.checked;
  await appConfigService.setBulkBurn(event.detail.checked);
  window.location.reload();
};

const updateNetwork = async (event: any) => {
  await appConfigService.setNetworkId(event.detail.value);
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

const checkForUpdate = async () => {
  await UIService.showInfo((window as any).nfc);
  await UIService.showInfo(JSON.stringify((window as any).nfc));
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

const saveDevToken = async () => {
  await appConfigService.setDevToken(devToken.value);
  devTokenSaved.value = true;
  setTimeout(() => devTokenSaved.value = false, 1500);
};

onMounted(async () => {
  isDevMode.value = await appConfigService.getDevMode();
  isSimulateNFCTag.value = await appConfigService.getSimulateNFCTag();
  isHomologAPI.value = await appConfigService.getHomologAPI();
  isBulkBurn.value = await appConfigService.getBulkBurn();
  network.value = String(await appConfigService.getNetworkId());
  try {
    cacheName.value = await getCacheName();
  } catch (error) {
    console.error('Failed to get cache name:', error);
  }
  devToken.value = await appConfigService.getDevToken();
  
  // Get app version information
  try {
    const appInfo = await App.getInfo();
    appVersion.value = appInfo.version;
    buildNumber.value = appInfo.build;
  } catch (error) {
    console.error('Failed to get app info:', error);
    appVersion.value = 'Unknown';
    buildNumber.value = 'Unknown';
  }
  
  // Get last build information
  try {
    const response = await fetch('/last-build.json');
    if (response.ok) {
      const buildData = await response.json();
      lastBuildTime.value = format(new Date(buildData.timestamp));
    } else {
      throw new Error('Last build file not found');
    }
  } catch (error) {
    console.error('Failed to get last build info:', error);
    lastBuildTime.value = 'Unknown';
  }
});
</script>

<style scoped>
#update-container {
  text-align: center;
  margin-top: 20px;
}
.token-saved-msg {
  color: green;
  margin-top: 8px;
  text-align: center;
  font-size: 0.95em;
}
</style>