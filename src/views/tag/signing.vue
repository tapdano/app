<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
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
        <ion-item>
          <ion-input v-model="client" label="Client" readonly></ion-input>
        </ion-item>
        <ion-button color="primary" @click="signWithTag">Sign with Tag</ion-button>
      </div>
    </ion-content>
    <TagTabBar />
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonLabel, IonTextarea, IonInput } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import NFCModal from '@/components/NFCModal.vue';
import TagTabBar from '../../components/TagTabBar.vue';
import { TagParser } from '@/utils/TagParser';
import { calculateSHA256 } from '@/utils/StringUtils';

const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);
const message = ref('');
const client = ref('');

const router = useRouter();
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
    const hash = await calculateSHA256(message.value);
    const command = '00A2000020' + hash;
    const tagResponse = new TagParser(await nfcModal.value.ExecuteCommand(command));
    const response = {
      messageHash: hash,
      publicKey: tagResponse.PublicKey,
      signature: tagResponse.LastSignature,
      policyId: tagResponse.PolicyId
    };
    const redirectUrl = client.value + '?response=' + JSON.stringify(response);
    location.href = redirectUrl;
  } catch (error) {
    console.error('Error signing with tag:', error);
    alert('Failed to sign the message with the tag.');
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