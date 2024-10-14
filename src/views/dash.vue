<template>
  <ion-content class="ion-padding">
    TESTE
  </ion-content>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import { IonContent } from '@ionic/vue';

const route = useRoute();

let isInitialzied = false;

async function initialize() {
}

watch(() => route.path, async (newPath) => {
  if (newPath === '/dash') {
    if (!isInitialzied) {
      isInitialzied = true;
      await initialize();
    }
  }
}, { immediate: true });

</script>

<style scoped>
</style>
