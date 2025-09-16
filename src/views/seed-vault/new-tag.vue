<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/seed-vault"></ion-back-button>
        </ion-buttons>
        <ion-title>New Seed Vault</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <form @submit.prevent="handleSubmit">
          <p>Enter an email address to associate with this tag</p>
          <ion-item>
            <ion-input v-model="email" label="E-mail" placeholder="valid e-mail"></ion-input>
          </ion-item>
          <ion-button id="submit-button" expand="block" type="submit">Send</ion-button>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonItem, IonInput, IonButton } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getSeedVaultApiUrl } from '@/utils/SeedVaultApi';

const router = useRouter();
const email = ref('');
const tagId = ref('');

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  tagId.value = urlParams.get('id') || '';
});

const handleSubmit = async () => {
  try {
    const apiUrl = await getSeedVaultApiUrl();
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'SET_EMAIL',
        id: tagId.value,
        email: email.value
      })
    });
    const result = await response.json();
    if (result.status === 'ok') {
      router.replace(`/seed-vault/auth?id=${tagId.value}&email=${encodeURIComponent(email.value)}&from=new-tag`);
    } else {
      alert(result.error || 'Erro ao associar email');
    }
  } catch (error) {
    console.error(error);
    alert(error);
  }
};
</script>

<style scoped>
#submit-button {
  margin-top: 20px;
}
</style>