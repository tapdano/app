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
      <div class="progress-circle" :class="{'progress-50': progress === 1 && progressTotal === 2, 'progress-100': (progress === 2) || (progress === 1 && progressTotal === 1)}">
        <div class="content">
          <span>{{ progress }}/{{ progressTotal }}</span>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonImg } from '@ionic/vue';
import { dataViewToHexString, hexStringToArrayBuffer } from '@/utils/StringUtils';

const isOpen = ref(false);
const progress = ref(0);
const progressTotal = ref(2);

let globalNdefReader: NDEFReader | null = null;
let globalNdefReadHandler: ((event: NDEFReadingEvent) => Promise<void>) | null = null;
let commandReject: ((reason?: Error) => void) | null = null;

const handleCancel = () => {
  cancelNFCTagReading();
  isOpen.value = false;
  if (commandReject) {
    commandReject();
  }
}

const handleAgain = () => {
  progress.value++;
}

const ExecuteCommand = async (command?: string): Promise<string> => {
  return new Promise<string>(async (resolve, reject) => {
    try {
      commandReject = reject;
      progress.value = 0;
      progressTotal.value = command ? 2 : 1;
      isOpen.value = true;

      const hostname = new URL(location.href).hostname;
      const isLocal = (hostname == 'localhost');

      if (isLocal) {
        isOpen.value = false;
        resolve('5444010001020100C5751BE5E0766EA436728F3B808049E16D0E11D2134219B4DC011C4849385095000000000000000000000000000000000000000000000000000000009C10A6C1A67896DF90F9B2A1326367E2A3D73C96E7667DEC407D3375A1BA8A7C00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000');
        return;
      }

      globalNdefReader = new window.NDEFReader();
      let isFirstRead = (command != undefined);

      globalNdefReadHandler = async (event: NDEFReadingEvent) => {
        if (isFirstRead && globalNdefReader) {
          await globalNdefReader.write({
            records: [{ recordType: "unknown", data: hexStringToArrayBuffer(command as string) }],
          });
          isFirstRead = false;
          handleAgain();
          return;
        }

        let readContent: string = '';
        if (event.message.records.length > 0) {
          const record = event.message.records[0];
          if (record.recordType === "text") {
            const textDecoder = new TextDecoder(record.encoding);
            readContent = textDecoder.decode(record.data);
          } else if (record.recordType === "unknown") {
            readContent = dataViewToHexString(record.data as DataView);
          }
        }

        cancelNFCTagReading();
        progress.value++;
        setTimeout(() => {
          isOpen.value = false;
          resolve(readContent);
        }, 500);
      };

      globalNdefReader.addEventListener("reading", globalNdefReadHandler as unknown as EventListenerOrEventListenerObject);
      await globalNdefReader.scan();
    } catch (error) {
      reject(error as Error);
      isOpen.value = false;
    }
  });
}

const cancelNFCTagReading = () => {
  if (globalNdefReader && globalNdefReadHandler) {
    globalNdefReader.removeEventListener("reading", globalNdefReadHandler as unknown as EventListenerOrEventListenerObject);
    globalNdefReadHandler = null;
  }
  globalNdefReader = null;
}

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