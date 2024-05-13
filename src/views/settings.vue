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
        <ion-label style="margin-right: 20px;">Dark Mode</ion-label>
        <ion-toggle @ionChange="toggleDarkMode" :checked="isDarkMode" :disabled="true"></ion-toggle>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonToggle, IonLabel } from '@ionic/vue';

const isDarkMode = ref(window.matchMedia('(prefers-color-scheme: dark)').matches);

const toggleDarkMode = () => {
  document.body.classList.toggle('dark', isDarkMode.value);
};

onMounted(() => {
  toggleDarkMode();
});

onUnmounted(() => {
  document.body.classList.remove('dark');
});
</script>

<style scoped>
#container {
  text-align: center;
}
</style>
