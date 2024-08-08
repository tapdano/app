<template>
  <ion-modal :is-open="isOpen">
    <ion-header>
      <ion-toolbar>
        <ion-title>Approximate your Tag</ion-title>
        <ion-buttons slot="primary">
          <ion-button @click="handleCancel">Cancel</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-img src="/logo.png" class="logo"></ion-img>
      <p class="txt">Approximate your TapDano Tag</p>
      <!--<div class="progress-circle" :class="{'progress-50': progress === 1 && progressTotal === 2, 'progress-100': (progress === 2) || (progress === 1 && progressTotal === 1)}">-->
      <div class="progress-circle">
        <div class="content">
          <span>{{ progress }}</span>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonImg } from '@ionic/vue';
import { TagParser, WebNFCService } from 'tapdano';
import { WebAuthnService } from 'tapdano';

const isOpen = ref(false);
const progress = ref(0);
const progressTotal = ref(0);

const useWebNFC = 'NDEFReader' in window;
const tapDanoService = useWebNFC ? new WebNFCService() : new WebAuthnService();

let commandReject: ((reason?: Error) => void) | null = null;

const handleCancel = () => {
  tapDanoService.cancelReading();
  isOpen.value = false;
  progress.value = 0;
  if (commandReject) {
    commandReject();
  }
};

const ExecuteCommand = async (command?: string, keepOpen: boolean = false): Promise<TagParser> => {
  return new Promise<TagParser>(async (resolve, reject) => {
    try {
      commandReject = reject;
      isOpen.value = true;

      const result = await tapDanoService.executeCommand(command);

      progress.value++;

      if (keepOpen) {
        resolve(result);
      } else {
        setTimeout(() => {
          isOpen.value = false;
          progress.value = 0;
          resolve(result);
        }, 500);
      }

    } catch (error) {
      isOpen.value = false;
      progress.value = 0;
      reject(error);
    }
  });
};

defineExpose({ ExecuteCommand });
</script>

<style scoped>
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