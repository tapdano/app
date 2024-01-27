<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>Restore</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <p>Restore</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar } from '@ionic/vue';
import { ref, onMounted } from 'vue';

onMounted(async () => {
  try {
    alert('onMounted');
    if (("NDEFReader" in window)) {
      const ndef = new (window.NDEFReader as any)();
      await ndef.scan();
      alert("> Scan started");

      ndef.addEventListener("readingerror", () => {
        alert("Argh! Cannot read data from the NFC tag. Try another one?");
      });

      ndef.addEventListener("reading", (event: any) => {
        alert(`> Serial Number: ${ event.serialNumber }`);
        alert(`> Records: (${ event.message.records.length })`);
      });
    }
  } catch (error) {
    alert("Argh! " + error);
  }
});
</script>

<style scoped>
#container {
  text-align: center;
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}
</style>
