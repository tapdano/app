<template>
  <ion-content class="ion-padding">
    <div id="container">
      <h1>TapDano - Demo Auth</h1>
      <div v-if="loading" class="loading-message"><div class="loading-spinner"></div></div>
      <div v-else>
        <div id="container">
          <h1>Success!</h1>
        </div>
      </div>
    </div>
  </ion-content>
</template>
 
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { IonContent } from '@ionic/vue';

interface Asset {
  unit: string;
  quantity: string;
  soulBoundId: string;
  name: string;
  image: string;
  description: string;
}

const loading = ref(true);

onMounted(async () => {
  loading.value = false;
  const ably = new (window as any).Ably.Realtime('iTZ0XA.06wqDQ:ZI6bW8YuX0nbFqg522l6iQ1N6u382WlHzczw4M2_fe8');
  await ably.connection.once('connected');
  const channel = ably.channels.get('tapdano');
  const response = getQueryStringParameter('response');
  const parsedResponse = JSON.parse(decodeURIComponent(response || ''));
  console.log('parsedResponse.messageHash', parsedResponse.messageHash);
  await channel.publish(parsedResponse.messageHash, decodeURIComponent(response as string));
});

function getQueryStringParameter(name: string) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}
</script>

<style scoped>
h1 {
  text-align: center;
}

.loading-message {
  margin-top: 30px;
}
</style>