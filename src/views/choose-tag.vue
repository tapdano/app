<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
          <ion-back-button color="primary" default-href="/my-tags"></ion-back-button>
        </ion-buttons>
        <ion-title>Add a Tag</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div id="container">
        <p>You have an empty TapDano Tag!<br /><br />Would you like to create a new Tag or restore a previous one?</p>
        <div id="buttons-box">
          <ion-button expand="block" @click="$router.push('/new-tag')">Create a new Tag</ion-button>
          <ion-button expand="block" @click="$router.push('/restore-tag')" fill="outline" :disabled="true">Restore Tag</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonBackButton, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/vue';
</script>

<style scoped>
#container p {
  font-size: 2em;
}

ion-button {
  height: 80px;
  margin-top: 20px;
}
</style>