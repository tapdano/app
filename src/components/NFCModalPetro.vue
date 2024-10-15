<template>
  <ion-modal :is-open="isOpen">
    <ion-header>
      <ion-toolbar>
        <ion-title>Aproxime do Toten</ion-title>
        <ion-buttons slot="primary">
          <ion-button @click="handleCloseModal">X</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-img src="/logo.png" class="logo"></ion-img>
      <div class="progress-circle" :class="{'progress-50': progress >= (progressTotal / 2), 'progress-100': (progress == progressTotal)}">
        <div class="content">
          <span>{{ progress }} / {{ progressTotal }}</span>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonImg } from '@ionic/vue';

const isOpen = ref(false);
const progress = ref(0);
const progressTotal = ref(0);

const openModal = (totalProgress: number) => {
  progress.value = 0;
  progressTotal.value = totalProgress;
  isOpen.value = true;
};

const closeModal = async (delay: number = 0) => {
  return new Promise<void>(async (resolve) => {
    setTimeout(() => {
      isOpen.value = false;
      resolve();
    }, delay);
  });
};

const incrementProgress = () => {
  progress.value++;
};

let onModalCloseCallback: () => void;
const onModalClose = (callback: () => void) => {
  onModalCloseCallback = callback;
};

const handleCloseModal = () => {
  if (onModalCloseCallback) {
    onModalCloseCallback();
  }
  isOpen.value = false;
};

defineExpose({ openModal, closeModal, incrementProgress, onModalClose });
</script>

<style scoped>
ion-modal {
  --width: fit-content;
  --min-width: 250px;
  --min-height: 250px;
  --height: 45%;
  --border-radius: 6px;
  --box-shadow: 0 28px 48px rgba(0, 0, 0, 0.4);
  margin-top: -180px;
}

.logo {
  width: 100%;
  max-width: 50%;
  height: auto;
  margin: 0 auto;
}

.txt {
  text-align: center;
}

.progress-circle {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 10px solid lightgray;
  margin: 40px auto 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.5em;
  transform: rotate(45deg);
}

.progress-circle .content {
  transform: rotate(-45deg);
}

.progress-circle.progress-50 {
  border-top-color: green;
  border-right-color: green;
  transition: border-color 0.5s;
}

.progress-circle.progress-100 {
  border-top-color: green;
  border-right-color: green;
  border-bottom-color: green;
  border-left-color: green;
  transition: border-color 0.5s;
}
</style>