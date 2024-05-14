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
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonModal, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonImg } from '@ionic/vue';
import { dataViewToHexString, hexStringToArrayBuffer } from '@/utils/StringUtils';

const isOpen = ref(false);
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
  isOpen.value = false;
  setTimeout(() => {
    isOpen.value = true;
  }, 500);
}

const ExecuteCommand = async (command: string): Promise<string> => {
  console.log('ExecuteCommand:' + command);
  return new Promise<string>(async (resolve, reject) => {
    try {
      commandReject = reject;
      isOpen.value = true;

      const hostname = new URL(location.href).hostname;
      const isLocal = (hostname == 'localhost');

      if (isLocal) {
        isOpen.value = false;
        let result = '';
        if (command.startsWith('00A00000')) result = '5444010000';
        if (command.startsWith('00A10000')) result = '544401000101015147A101F631472917695143BCAF5CE36AB325EC82C46E5AE08806C128F955E9';
        if (command.startsWith('00A20000')) result = '';
        if (command.startsWith('00A30000')) result = '5444010000';
        resolve(result);
        return;
      }

      globalNdefReader = new window.NDEFReader();
      let isFirstRead = true;

      globalNdefReadHandler = async (event: NDEFReadingEvent) => {
        if (isFirstRead && globalNdefReader) {
          await globalNdefReader.write({
            records: [{ recordType: "unknown", data: hexStringToArrayBuffer(command) }],
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
        isOpen.value = false;
        resolve(readContent);
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
</style>