<template>
  <ion-content class="ion-padding">
    <div id="container">
      <div class="logo-petro"></div>
      <h1>Proof of Attendance</h1>
      <ion-item>
        <ion-input v-model="inputEmail" label="E-mail"></ion-input>
      </ion-item>
      <ion-button @click="submit">Submit</ion-button>
      <template v-if="isLoading">
        <ion-spinner name="lines-sharp-small"></ion-spinner>
      </template>
    </div>
  </ion-content>
  <NFCModalPetro ref="nfcModal"></NFCModalPetro>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonContent, IonButton, IonInput, IonItem, IonSpinner } from '@ionic/vue';
import { TapDanoService } from 'tapdano';
import { createHash, randomBytes } from 'crypto';
import { useRoute } from 'vue-router';
import NFCModalPetro from '@/components/NFCModalPetro.vue';
import { getNetworkId } from '@/utils/StorageUtils';

const isLoading = ref(false);
const inputEmail = ref('');
const nfcModal = ref<InstanceType<typeof NFCModalPetro> | null>(null);

const route = useRoute();

watch(() => route.path, async () => {
  inputEmail.value = route.query.email as string;
}, { immediate: true });

const submit  = async () => {
  if (!nfcModal.value) return;
  if (isLoading.value) return;
  
  try {

    if (!inputEmail.value) {
      alert('Preencha o E-mail');
      return;
    }

    isLoading.value = true;

    const networkId = await getNetworkId();
    const lambdaId_dev = '8yl2xan8xa';
    const lambdaId_prod = '0zx82ids4c';
    let useProdLambda = (networkId == 1); useProdLambda = false;
    let url = 'https://' + (useProdLambda ? lambdaId_prod : lambdaId_dev) + '.execute-api.sa-east-1.amazonaws.com';
    url += '/?rnd=' + Math.random();

    const isVirtual = location.href.includes('/poa-virtual');

    let tag: any;
    let code: any;
    if (!isVirtual) {
      code = generateRandomCode();
      const hash = sha256(code + inputEmail.value);
      const tapDanoService = new TapDanoService();
      nfcModal.value.openModal(1);
      nfcModal.value.onModalClose(() => {
        tapDanoService.cancel();
      });
      tag = await tapDanoService.signData(hash);
      nfcModal.value.incrementProgress();
      await nfcModal.value.closeModal(500);
    }

    const maxTry = 9;
    let tryCount = 0;
    const mintRequest = async (url: string) => {
      tryCount++;
      try {
        const body: any = {
          email: inputEmail.value
        };
        if (!isVirtual) {
          body.code = code;
          body.publicKey = tag.PublicKey;
          body.signature = tag.LastSignature;
        }
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        if (data.error) {
          throw data.error;
        }
      } catch (error) {
        try {
          if ((error as any).message.includes('401')) throw '401';
        } catch (error) {
          if (error = '401') throw 'Sua confirmação já foi solicitada.';
        }
        if (tryCount == maxTry) {
          throw error;
        } else {
          console.log('Aguardando 20s');
          await delay(20000);
          console.log('Tentando denovo...');
          await mintRequest(url);
        }
      }
    };
    await mintRequest(url);

    inputEmail.value = '';
    alert('Sucesso, você receberá sua confirmação por e-mail.');

  } catch (error) {
    await nfcModal.value.closeModal();
    console.error(error);
    alert(error);
  }
  isLoading.value = false;
};

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sha256(str: string) {
  const hash = createHash('sha256');
  hash.update(str);
  return hash.digest('hex');
}

function generateRandomCode() {
  const bytesAleatorios = randomBytes(16);
  return bytesAleatorios.toString('hex');
}
</script>

<style scoped>
#container {
  padding: 0;
}

.logo-petro {
  background-image: url('/logo-petrobras.png');
  background-repeat: no-repeat;
  background-color: #FFF;
  background-position: center;
  background-size: 80% auto;
  height: 120px;
  margin: -20px -20px 0 -20px;
}

h1 {
  margin: 30px 0;
}
</style>
