<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Seed Vault</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <h2>Here you can manage your Seed Vault Tags, set it up, protect it, and much more.</h2>
        <div id="buttons-box">
          <ion-button expand="block" @click="addTagEvent">Scan a Tag</ion-button>
        </div>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
import { getSimulateNFCTag } from '@/utils/StorageUtils';
import { Storage } from '@ionic/storage';
import NFCModal from '@/components/NFCModal.vue';
import { getSeedVaultApiUrl } from '@/utils/SeedVaultApi';

const storage = new Storage();
storage.create();

const router = useRouter();
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

declare const nfc: any;

const addTagEvent = async () => {
  try {
    if (!nfcModal.value) return;

    const isSimulateNFCTag = await getSimulateNFCTag();

    //const tapDanoService = new TapDanoService();
    nfcModal.value.openModal(1);
    nfcModal.value.onModalClose(() => {
      //tapDanoService.cancel();
    });
    //const tag = await tapDanoService.readTag();

    /*
    const ndefListenerCallback = async (nfcEvent: any) => {
      try {
        alert('ndefListenerCallback');
        console.log(nfcEvent);
        console.log(nfcEvent.tag);
        /*
        if (this.isFirstRead) {
          const message = [
            ndef.record(ndef.TNF_UNKNOWN, [], [], hexStringToArray(this._command as string))
          ];
          await nfc.write(message);
          if (this.isCanceled) return;
          this.isFirstRead = false;
          this.startScan();
          return;
        }

        let readContent: string = '';
        const record = nfcEvent.tag.ndefMessage[0];
        if (record) {
          readContent = arrayBufferToHex(record.payload);
        }

        if (this.isCanceled) return;
        this.stopScan();
        this._resolve && this._resolve(new TagParser(readContent));
        
      } catch (error) {
        console.error(error);
        alert(error);
        //if (this.isCanceled) return;
        //this.TRIES++;
        //if (this.TRIES >= this.MAX_TRIES) {
        //  this.stopScan();
        //  this._reject && this._reject(error);
        //}
      }
    };
    nfc.addNdefListener(ndefListenerCallback);
    */

    //nfcModal.value.incrementProgress();
    //await nfcModal.value.closeModal(500);

    setTimeout(async () => {
      if (!nfcModal.value) return;
      nfcModal.value.incrementProgress();
      await nfcModal.value.closeModal(500);

      const tag_id = "2eca12a1def4601de0994e2a143f0674";

      // Chamada ao backend para verificar se o email está associado
      try {
        const apiUrl = await getSeedVaultApiUrl();
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'GET_TAG',
            id: tag_id
          })
        });
        const result = await response.json();

        console.log('aki');
        console.log(result);

        if (result.status === 'ok') {
          if (result.has_email) {
            router.push(`/seed-vault/auth?id=${tag_id}`);
          } else {
            router.push(`/seed-vault/new-tag?id=${tag_id}`);
          }
        } else {
          alert(result.error || 'Erro ao consultar tag');
        }
      } catch (err) {
        alert('Erro de comunicação com o servidor');
        console.error(err);
      }
    }, 1000);

  } catch (error) {
    if (error && error != 'canceled') {
      if (!nfcModal.value) return;
      await nfcModal.value.closeModal(0);
      console.error(error);
      alert(error);
    }
  }
};
</script>

<style scoped>
#buttons-box {
  margin-top: 20px;
}
ion-button {
  min-height: 50px;
  margin-top: 10px;
}
</style>
