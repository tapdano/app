<template>
  <ion-tab-bar slot="bottom">
    <ion-tab-button tab="home" href="/tag/main">
      <ion-icon :icon="cardOutline" />
      <ion-label>Main</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="signing" href="/tag/signing">
      <ion-icon :icon="keyOutline" />
      <ion-label>Signing</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="settings" href="/tag/settings">
      <ion-icon :icon="settingsOutline" />
      <ion-label>Settings</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonLabel, IonIcon } from '@ionic/vue';
import { cardOutline, keyOutline, settingsOutline } from 'ionicons/icons';
</script>