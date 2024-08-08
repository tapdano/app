<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Test V5</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <ion-button expand="block" @click="startEvent">START</ion-button>
        <div id="console" class="console"></div>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import NFCModal from '@/components/NFCModal.vue';

const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const startEvent = async () => {
  if (!nfcModal.value) return;

  addLog('----------------');
  addLog('- TEST STARTED -');
  addLog('----------------');  

  let round = 1;
  const maxRound = 100;
  while (true) {
    
    addLog('');
    addLog('ROUND: #' + round);
    try {

      let tag = await nfcModal.value.ExecuteCommand(undefined, true);

      if (tag.TagID != '5444') {
        addLog('Unknow Tag. Please use a TapDano Tag.');
        addLog(JSON.stringify(tag));
        return;
      }

      //if (!tag.Burned) {

      addLog('Tag readed');
      addLog(JSON.stringify(tag));


      let isNew = true;
      let tagType = 'soulbound';
      let tagPrivateKey = '';

      let cmd = '00A10000';
      cmd += isNew ? '02' : '34'; //data length
      cmd += isNew ? '01' : '02'; //action
      if (tagType == 'soulbound')   cmd += '01';
      if (tagType == 'extractable') cmd += '02';
      if (!isNew) cmd += tagPrivateKey;

      tag = await nfcModal.value.ExecuteCommand(cmd, true);

      if (tag.TagID != '5444') {
        addLog('Unknow Tag. Please use a TapDano Tag.');
        addLog(JSON.stringify(tag));
        return;
      }
      addLog('Tag created');
      addLog(JSON.stringify(tag));


      cmd = "00A30000";
      tag = await nfcModal.value.ExecuteCommand(cmd, true);
      if (tag.TagID != '5444') {
        addLog('Unknow Tag. Please use a TapDano Tag.');
        addLog(JSON.stringify(tag));
        return;
      }
      addLog('Tag formated');
      addLog(JSON.stringify(tag));

      addLog('');

    } catch (error) {
      if (error) {
        addLog(JSON.stringify(error));
      }
      break;
    }
    if (round == maxRound) break;
    round++;
  }
  addLog('-----------------');
  addLog('- TEST FINISHED -');
  addLog('-----------------');
};

const addLog = (message: string) => {
  const consoleElement = document.getElementById('console');
  if (consoleElement) {
    const newLog = document.createElement('div');
    newLog.textContent = message;
    consoleElement.appendChild(newLog);
    consoleElement.scrollTop = consoleElement.scrollHeight;
  }
};
</script>

<style scoped>
.console {
  width: 100%;
  height: 400px;
  border: 1px solid #ccc;
  overflow: auto;
  padding: 10px;
  font-family: monospace;
  margin-top: 10px;
  white-space: nowrap;
}

.console div {
  margin-bottom: 5px;
}
</style>