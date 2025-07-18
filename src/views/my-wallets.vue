<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>My Wallets</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <div v-if="wallets.length === 0" class="no-items-message">Start your journey! Scan a Tag to begin.</div>
          <div v-else>
            <ion-list>
              <ion-item v-for="(wallet, index) in wallets" :key="index" @click="selectWallet(index)">
                {{ (wallet as any).name }}
              </ion-item>
            </ion-list>
          </div>
          <div id="buttons-box">
            <ion-button expand="block" @click="addTagEvent">Scan a Tag</ion-button>
          </div>
        </div>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonButton } from '@ionic/vue';
import { Storage } from '@ionic/storage';
import NFCModal from '@/components/NFCModal.vue';
import { TagParser, TapDanoService } from 'tapdano';
import { createWallet, entropyToMnemonic } from '@/utils/CryptoUtils';

const storage = new Storage();
storage.create();

const router = useRouter();
const route = useRoute();
const wallets = ref([]);
const loading = ref(true);
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const load = async () => {
  loading.value = true;
  const storedWallets = await storage.get('my-wallets') || [];
  wallets.value = storedWallets;
  loading.value = false;
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/my-wallets') {
    await load();
  }
}, { immediate: true });

const selectWallet = async (index: number) => {
  await storage.set('currentMyWallet', index);
  router.push('/my-wallet/main');
};

async function addMyWallet(tag: TagParser, name: string | undefined) {
  const storage = new Storage();
  await storage.create();
  
  const wallets = (await storage.get('my-wallets')) || [];

  const mnemonic = entropyToMnemonic(tag.PrivateKey as string);
  const cryptoWallet = await createWallet(mnemonic);

  const index = wallets.findIndex((item: any) => {
    return item.baseAddr == cryptoWallet.baseAddr;
  });

  if (index != -1) {
    await storage.set('currentMyWallet', index);
    return;
  }
  
  const newIndex = wallets.length;
  wallets.push({
    name: name || `TapWallet #${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
    tag,
    ...cryptoWallet,
  });

  await storage.set('my-wallets', wallets);
  await storage.set('currentMyWallet', newIndex);
}

const addTagEvent = async () => {
  if (!nfcModal.value) return;
  try {
    const tapDanoService = new TapDanoService();
    nfcModal.value.openModal(1);
    nfcModal.value.onModalClose(() => {
      tapDanoService.cancel();
    });
    const tag = await tapDanoService.readTag();
    nfcModal.value.incrementProgress();
    await nfcModal.value.closeModal(500);

    if (tag.TagID != '5444') {
      alert('Unknow Tag. Please use a TapDano Tag.');
      return;
    }

    if (!tag.Burned) {
      router.push('/new-my-wallet');
    } else {
      await addMyWallet(tag, undefined);
      router.replace('/my-wallet/main');
    }
  } catch (error) {
    if (error && error != 'canceled') {
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
