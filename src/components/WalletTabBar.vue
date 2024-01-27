<template>
  <ion-tab-bar slot="bottom">
    <ion-tab-button tab="home" href="/wallet/main">
      <ion-icon :icon="walletOutline" />
      <ion-label>Main</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="transactions" href="/wallet/transactions">
      <ion-icon :icon="library" />
      <ion-label>Transactions</ion-label>
    </ion-tab-button>

    <ion-tab-button tab="settings" href="/wallet/settings">
      <ion-icon :icon="settingsOutline" />
      <ion-label>Settings</ion-label>
    </ion-tab-button>
  </ion-tab-bar>
</template>

<script lang="ts">
  import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonLabel, IonIcon } from '@ionic/vue';

  import { walletOutline, settingsOutline, radio, library, search } from 'ionicons/icons';

  export default {
    name: 'WalletTabBar',
    components: { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonLabel, IonIcon },
    data() {
      return {
        walletOutline,
        radio,
        library,
        search,
        settingsOutline
      };
    },
  };
</script>