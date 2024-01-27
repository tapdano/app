<template>
  <ion-modal :is-open="isOpen" @did-dismiss="handleDismiss">
    <ion-header>
      <ion-toolbar>
        <ion-title>Write NFC Wallet</ion-title>
        <ion-buttons slot="primary">
          <ion-button @click="handleCancel">Cancel</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-img src="/logo.png" style="width: 100%; max-width: 50%; height: auto; margin: 0 auto;"></ion-img>
      <p style="text-align: center;">Approximate your NFC tag to continue</p>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonImg } from '@ionic/vue';
import { defineProps } from 'vue';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['cancel', 'dismiss']);

const handleCancel = () => {
  emit('cancel');
};

const handleDismiss = () => {
  emit('dismiss');
};
</script>