<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start" v-if="client == ''">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/my-tags"></ion-back-button>
        </ion-buttons>
        <ion-title>Data Signing</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <ion-item>
          <ion-textarea v-model="message" label="Message" label-placement="stacked" :auto-grow="true"></ion-textarea>
        </ion-item>
        <ion-item v-if="client != ''">
          <ion-input v-model="client" label="Client" readonly></ion-input>
        </ion-item>
        <ion-button color="primary" @click="signWithTag">Sign with Tag</ion-button>
        <ion-item v-if="result != ''">
          <ion-textarea v-model="result" label="Result" label-placement="stacked" :auto-grow="true" readonly></ion-textarea>
        </ion-item>
      </div>
    </ion-content>
    <TagTabBar v-if="client == ''" />
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonLabel, IonTextarea, IonInput } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NFCModal from '@/components/NFCModal.vue';
import TagTabBar from '../../components/TagTabBar.vue';
import { calculateSHA256 } from '@/utils/StringUtils';
import { TapDanoService } from 'tapdano';
import { UIService } from '@/utils/UIService';

const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);
const message = ref('');
const client = ref('');
const result = ref('');

const route = useRoute();

onMounted(() => {
  try {
    message.value = JSON.stringify(JSON.parse(route.query.message as string), null, 4);
  } catch (error) {
    message.value = route.query.message as string || '';
  }
  client.value = route.query.client as string || '';
});

const signWithTag = async () => {
  if (!nfcModal.value) return;
  try {
    const tapDanoService = new TapDanoService();
    nfcModal.value.openModal(1);
    nfcModal.value.onModalClose(() => {
      tapDanoService.cancel();
    });
    const hash = await calculateSHA256(message.value);
    const tag = await tapDanoService.signData(hash);
    nfcModal.value.incrementProgress();
    await nfcModal.value.closeModal(500);
    const response = {
      messageHash: hash,
      publicKey: tag.PublicKey,
      signature: tag.LastSignature,
      policyId: tag.PolicyId
    };
    if (client.value == '') {
      result.value = JSON.stringify(response, null, 2);
      return;
    }
    const redirectUrl = client.value + '?response=' + JSON.stringify(response);
    location.href = redirectUrl;
  } catch (error) {
    if (error && error != 'canceled') {
      await nfcModal.value.closeModal(0);
      console.error(error);
      await UIService.showError(error);
    }
  }
};
</script>

<style scoped>
ion-button {
  display: block;
  margin-top: 20px;
  height: 60px;
}

ion-item {
  margin-top: 20px;
}
</style>