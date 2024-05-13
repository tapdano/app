<template>
  <ion-tab-bar slot="bottom">
    <ion-tab-button tab="home" href="/wallet/main">
      <ion-icon :icon="walletOutline" />
      <ion-label>Main</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="transactions" href="/wallet/transactions">
      <ion-icon :icon="cash" />
      <ion-label>Transactions</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="assets" href="/wallet/assets">
      <ion-icon :icon="diamond" />
      <ion-label>Assets</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="settings" href="/wallet/settings">
      <ion-icon :icon="settingsOutline" />
      <ion-label>Settings</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonLabel, IonIcon } from '@ionic/vue';
import { walletOutline, settingsOutline, cash, diamond } from 'ionicons/icons';
</script>

<style scoped>
ion-tab-bar {
  -webkit-box-shadow: 0 -2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);
  box-shadow: 0 -2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);
}
</style>