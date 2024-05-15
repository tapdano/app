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
          <ion-toggle @ionChange="toggleDarkMode" :checked="isDarkMode" :disabled="true">Dark Mode</ion-toggle>
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
import { ref, onMounted, onUnmounted } from 'vue';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonToggle, IonLabel, IonButton, IonItem } from '@ionic/vue';

const isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);
const cacheName = ref<string | null>(null);

const toggleDarkMode = () => {
  document.body.classList.toggle('dark', isDarkMode.value);
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
  if ('serviceWorker' in navigator) {
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
  toggleDarkMode();
  
  try {
    cacheName.value = await getCacheName();
  } catch (error) {
    console.error('Failed to get cache name:', error);
  }
});

onUnmounted(() => {
  document.body.classList.remove('dark');
});
</script>

<style scoped>
#update-container {
  text-align: center;
  margin-top: 20px;
}
</style>