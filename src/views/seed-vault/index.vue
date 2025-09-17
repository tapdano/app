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
        <div v-if="svTags.length > 0" style="margin-bottom: 20px;">
          <ion-list>
            <ion-item v-for="(tag, idx) in svTags" :key="tag.id" @click="openTag(tag, idx)">
              <span>{{ tag.id }}</span>
            </ion-item>
          </ion-list>
        </div>
        <div id="buttons-box">
          <ion-button expand="block" @click="addTagEvent">Scan a Tag</ion-button>
          <ion-button
            v-if="isDevMode"
            color="danger"
            expand="block"
            style="margin-top:10px;"
            @click="burnTagEvent"
          >
            Burn a Tag
          </ion-button>
        </div>
      </div>
    </ion-content>
    <NFCModal ref="nfcModal"></NFCModal>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonButton, IonItem, IonList } from '@ionic/vue';
import { getSimulateNFCTag, getDevMode } from '@/utils/StorageUtils';
import { Storage } from '@ionic/storage';
import NFCModal from '@/components/NFCModal.vue';
import { getSeedVaultApiUrl, saveSeedVaultTag } from '@/utils/SeedVaultUtils';

const storage = new Storage();
storage.create();

const router = useRouter();
const route = useRoute();
const nfcModal = ref<InstanceType<typeof NFCModal> | null>(null);

const isDevMode = ref(false);
const devToken = ref('');
const tagId = ref('');
const svTags = ref<{ id: string, email?: string }[]>([]);
const tagVersion = ref('');
const eventId = ref('');

onMounted(async () => {
  await reloadAll();
});

watch(() => route.path, async (newPath) => {
  if (newPath === '/seed-vault') {
    await reloadAll();
  }
});

const reloadAll = async () => {
  isDevMode.value = await getDevMode();
  devToken.value = await storage.get('dev-token') || '';
  tagId.value = await storage.get('burned-tag-id') || '';
  tagVersion.value = await storage.get('tagVersion');
  eventId.value = await storage.get('eventId');
  await loadTags();
};

const loadTags = async () => {
  const tags = await storage.get('sv_tags');
  svTags.value = Array.isArray(tags) ? tags : [];
};

const openTag = async (tag: { id: string, email?: string }, idx: number) => {
  await storage.set('currentSVTagIndex', idx);
  router.push('/seed-vault/main');
};

declare const nfc: any;

const burnTagEvent = async () => {
  try {
    const apiUrl = await getSeedVaultApiUrl();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_TAG',
        auth: devToken.value,
        version: tagVersion.value,
        event_id: eventId.value
      })
    });
    const result = await response.json();
    if (result.status === 'ok' && result.tag_id) {
      tagId.value = result.tag_id;
      await storage.set('burned-tag-id', tagId.value);
      await storage.remove('my-secrets');
      await storage.remove('currentSeedPhrase');
      alert('New Tag ID: ' + tagId.value);
    } else {
      alert(result.error);
    }
  } catch (error) {
    alert('Error communicating with server');
    console.error(error);
  }
};

const addTagEvent = async () => {
  try {
    if (!nfcModal.value) return;

    let tag_Id = null;
    const isSimulateNFCTag = await getSimulateNFCTag();
    if (isSimulateNFCTag) {
      tag_Id = tagId.value;
    } else {
      if (!nfc) {
        alert('NFC is not available on this device.');
        return;
      }
      const nfcResult = await nfc.scanTag();
      tag_Id = nfcResult.id;
    }

    const tags = await storage.get('sv_tags');
    const svTagsArr = Array.isArray(tags) ? tags : [];
    const idx = svTagsArr.findIndex((t: any) => t.id === tag_Id);
    if (idx !== -1) {
      await storage.set('currentSVTagIndex', idx);
      router.push('/seed-vault/main');
      return;
    }

    nfcModal.value.openModal(1);
    nfcModal.value.onModalClose(() => {});

    setTimeout(async () => {
      if (!nfcModal.value) return;
      nfcModal.value.incrementProgress();
      await nfcModal.value.closeModal(500);

      try {
        const apiUrl = await getSeedVaultApiUrl();
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'GET_TAG',
            id: tag_Id
          })
        });
        const result = await response.json();

        if (result.status === 'ok') {
          if (!result.is_started) {
            router.push(`/seed-vault/new-tag?id=${tag_Id}`);
          } else {
            router.push(`/seed-vault/auth?id=${tag_Id}`);
          }
        } else {
          alert(result.error || 'Error retrieving tag info');
        }
      } catch (err) {
        alert('Error communicating with server');
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
