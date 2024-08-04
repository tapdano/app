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

const useWebNFC = (window.NDEFReader != undefined);
const AUTHN_MAX_TRIES = 3;
let AUTHN_TRIES = 0;
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
      isOpen.value = true;

      const sendResolve = (content: string) => {
        cancelNFCTagReading();
        progress.value++;
        setTimeout(() => {
          isOpen.value = false;
          resolve(content);
        }, 500);
      };

      if (useWebNFC) {
        progressTotal.value = command ? 2 : 1;

        globalNdefReader = new window.NDEFReader();
        let isFirstRead = (command != undefined);

        globalNdefReadHandler = async (event: NDEFReadingEvent) => {
          if (isFirstRead) {
            globalNdefReader && await globalNdefReader.write({
              records: [{ recordType: "unknown", data: hexStringToArrayBuffer(command as string) }],
            });
            isFirstRead = false;
            handleAgain();
            cancelNFCTagReading();
            globalNdefReader = new window.NDEFReader();
            globalNdefReader.addEventListener("reading", globalNdefReadHandler as unknown as EventListenerOrEventListenerObject);
            await globalNdefReader.scan();
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

          sendResolve(readContent);
        };

        globalNdefReader.addEventListener("reading", globalNdefReadHandler as unknown as EventListenerOrEventListenerObject);
        await globalNdefReader.scan();
      } else { //WebAuthN
        progressTotal.value = 1;
        AUTHN_TRIES = 0;
        command = command ? command : '0000';
        const execWebAuthN = async function() {
          try {
            const ret = await navigator.credentials.get({
              publicKey: {
                allowCredentials: [{
                  id: StrToHex(command),
                  type: "public-key",
                  transports: ["nfc"]
                }],
                challenge: crypto.getRandomValues(new Uint8Array(32)),
                rpId: window.location.hostname,
                userVerification: "discouraged",
                timeout: 60000
              }
            });
            const content = arrayBufferToHex((ret as any).response.signature);
            sendResolve(content);
          } catch (e) {
            console.error(e);
            AUTHN_TRIES++;
            if (AUTHN_TRIES == AUTHN_MAX_TRIES) {
              throw e;
            } else {
              execWebAuthN();
            }
          }
        }
        execWebAuthN();
      }
    } catch (error) {
      reject(error as Error);
      isOpen.value = false;
    }
  });
}

const cancelNFCTagReading = () => {
  if (useWebNFC) {
    if (globalNdefReader && globalNdefReadHandler) {
      globalNdefReader.removeEventListener("reading", globalNdefReadHandler as unknown as EventListenerOrEventListenerObject);
    }
    globalNdefReader = null;
  }
}

const StrToHex = function(s: any) {
  return new Uint8Array(s.replaceAll(' ', '').match(/.{1,2}/g).map((b: any) => parseInt(b, 16)));
}

const arrayBufferToHex = function(arrayBuffer: any) {
  return Array.from(new Uint8Array(arrayBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
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