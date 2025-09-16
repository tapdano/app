<template>
  <ion-tab-bar slot="bottom">
    <ion-tab-button tab="home" href="/seed-vault/main">
      <ion-icon :icon="walletOutline" />
      <ion-label>Main</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="settings" href="/seed-vault/settings">
      <ion-icon :icon="settingsOutline" />
      <ion-label>Settings</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonLabel, IonIcon } from '@ionic/vue';
import { walletOutline, settingsOutline } from 'ionicons/icons';
</script>