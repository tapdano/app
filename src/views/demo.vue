<template>
  <ion-content class="ion-padding">
    <div id="container">
      <div class="logo-petro"></div>
      <h1>Painel de Controle</h1>
      <div style="margin-top: 30px;">
        <h4>
          Status da Perfuração:
          <template v-if="drilling">
            <ion-icon :icon="radioButtonOn" :color="'success'" style="font-size:20px; margin-bottom:-3px;"></ion-icon><span style="color:#2dd36f">Iniciada</span>
          </template>
          <template v-else>
            <ion-icon :icon="radioButtonOff" :color="'danger'" style="font-size:20px; margin-bottom:-3px;"></ion-icon><span style="color:#eb445a">Parada</span>
          </template>
        </h4>
        <div v-if="!drilling">
          <ion-button @click="toggleDrilling" expand="block" size="large">Iniciar Perfuração</ion-button>
        </div>
        <div v-if="drilling">
          <ion-button @click="toggleDrilling" expand="block" size="large">Parar Perfuração</ion-button>
        </div>
      </div>
      <div v-if="history.length != 0" style="margin-top: 30px;">
        <h4>Histórico na Blockchain (Imutável)</h4>
        <ion-grid :fixed="true">
          <ion-row class="ic-header">
            <ion-col size="2">Data Hora</ion-col>
            <ion-col>Responsável</ion-col>
            <ion-col size="2">Ação</ion-col>
            <ion-col size="2">Status</ion-col>
          </ion-row>
          <ion-row v-for="(entry, index) in history" :key="index">
            <ion-col size="2">{{ entry.dateTime }}</ion-col>
            <ion-col>{{ entry.responsible }}</ion-col>
            <ion-col size="2">{{ entry.action }}</ion-col>
            <ion-col size="2" class="col-status" @click="handleStatusClick(entry)">
              <template v-if="entry.status == 'P'">
                <ion-spinner name="lines-sharp-small"></ion-spinner>
              </template>
              <template v-else>
                <ion-icon :icon="checkmarkCircle" :color="'success'"></ion-icon>
              </template>
            </ion-col>
          </ion-row>
        </ion-grid>
      </div>
    </div>
  </ion-content>
  <NFCModalPetro ref="nfcModal"></NFCModalPetro>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { IonContent, IonIcon, IonButton, IonGrid, IonRow, IonCol, IonSpinner } from '@ionic/vue';
import { radioButtonOn, radioButtonOff, checkmarkCircle } from 'ionicons/icons';
import { TapDanoService } from 'tapdano';
import { UIService } from '@/utils/UIService';
import { WalletStorageService } from '@/utils/storage-services/WalletStorageService';
import { getBlockfrostURL, getBlockfrostAPI, getNetworkName, getCardanoScanURL } from '@/utils/CryptoUtils';
import { serializeBigInt, utf8ToHex } from '@/utils/StringUtils';
import NFCModalPetro from '@/components/NFCModalPetro.vue';

const walletStorageService = new WalletStorageService();

const wallet = ref();
const drilling = ref(false);
const history = ref([] as any);
const Lucid = (window as any).Lucid.Lucid;
const Data = (window as any).Lucid.Data;
const Blockfrost = (window as any).Lucid.Blockfrost;
const Constr = (window as any).Lucid.Constr;
const nfcModal = ref<InstanceType<typeof NFCModalPetro> | null>(null);

const route = useRoute();

const validador = {
  type: "PlutusV2",
  script: "5903fa01000032323232323232322323223225333007323253330093370e900118051baa0011323232330010013758602260246024602460246024602460246024601c6ea8c008c038dd50031129998080008a50132533300e323233372a6eb8c018c048dd50078009bae300630123754018646466e2800400ccdc50009b9832323232323732666002002601c602e6ea8031220100222533333301e00213232323232323300b00200133714911012800002533301b337100069007099b80483c80400c54ccc06ccdc4001a410004266e00cdc0241002800690068b299980e800899b8a4881035b5d2900004133714911035b5f2000375c603e604066600e0026603c980102415d003301e375266e2922010129000044bd70111981026103422c200033020375266601001000466e28dd718090009bae30150014bd701bac301b002375a60320026466ec0dd4180c8009ba7301a0013754004264a666036002266e292201027b7d00002133714911037b5f2000375c603a603c64646600200200644a66603c0022006266446604298103422c2000330213752666012012603c00466e292201023a2000333009009301f002337146eb8c04c004dd7180b000a5eb80c080004cc008008c084004cc0713010342207d003301c375200497ae03756004264a666036002266e29221025b5d00002133714911035b5f2000375c603a603c66600a00266038980102415d003301c375200497ae0223301e4c0103422c20003301e375266600c00c00466e28dd718080009bae30130014bd701bac002133005375a0040022646466e292210268270000132333001001337006e34009200133714911012700003222533301b3371000490000800899191919980300319b8000548004cdc599b80002533301e33710004900a0a40c02903719b8b33700002a66603c66e2000520141481805206e0043370c004901019b8300148080cdc70020011bae002222323300100100422533301b0011004133003301d00133002002301e001223233001001003225333016301400113371491101300000315333016337100029000099b8a489012d003300200233702900000089980299b8400148050cdc599b803370a002900a240c00066002002444a66602666e2400920001001133300300333708004900a19b8b3370066e14009201448180004dd7180298089baa30053011375400c6eb8c04c008528899801801800980980091808000980718059baa001163001300a37540044601a601c00229309b2b2999802980198031baa00113232533300a300d002149858dd7180580098039baa001165333003300130043754004264646464a666014601a0042930b1bae300b001300b002375c6012002600a6ea800858dc3a4000ae6955ceaab9e5573eae815d0aba257481",
};

let lucid: any;
let contractAddress: any;
let isInitialzied = false;

async function initialize() {
  lucid = await Lucid.new(
    new Blockfrost(await getBlockfrostURL(), await getBlockfrostAPI()),
    await getNetworkName(),
  );
  contractAddress = lucid.utils.validatorToAddress(validador);
  wallet.value = await walletStorageService.getCurrentLocalWallet();
  const ably = new (window as any).Ably.Realtime('iTZ0XA.06wqDQ:ZI6bW8YuX0nbFqg522l6iQ1N6u382WlHzczw4M2_fe8');
  await ably.connection.once('connected');
  const channel = ably.channels.get('webhook');
  await channel.subscribe('transaction', async (message: any) => {
    const data = JSON.parse(message.data);
    console.log(data);
    for (let i = 0; i < history.value.length; i++) {
      if (history.value[i].tx == data.tx.hash) {
        history.value[i].status = 'C';
        break;
      }
    }
  });  
}

watch(() => route.path, async (newPath) => {
  if (newPath === '/demo') {
    if (!isInitialzied) {
      isInitialzied = true;
      await initialize();
    }
  }
  //if (nfcModal.value) nfcModal.value.openModal(1);
}, { immediate: true });

let nextUTXO: any = null;

const registerAction  = async () => {
  if (!nfcModal.value) return;
  
  try {
    lucid.selectWalletFromSeed(wallet.value.mnemonic);
    const publicKeyHash = lucid.utils.getAddressDetails(await lucid.wallet.address()).paymentCredential?.hash;
    const currentTag = await walletStorageService.getCurrentTag();
    if (!currentTag) return;
    let utxoToCollect = [];
    const allScriptUtxo = await lucid.utxosAt(contractAddress);
    for (let i = 0; i < allScriptUtxo.length; i++) {
      if (allScriptUtxo[i].datum || allScriptUtxo[i].datumHash) {
        if (allScriptUtxo[i].datum.toUpperCase().indexOf((currentTag.PublicKey || '').toUpperCase()) === 10) {
          if (serializeBigInt(allScriptUtxo[i].assets) == '{"lovelace":"2000000n"}') {
            utxoToCollect.push(allScriptUtxo[i]);
            break;
          }
        }
      }
    }
    if (utxoToCollect.length === 0) {
      await UIService.showError('No assets found');
      return;
    }
    if (nextUTXO != null) {
      console.log('USANDO nextUTXO');
      utxoToCollect[0] = nextUTXO;
    } else {
      console.log('USANDO LAST UTXO');
    }
    console.log(utxoToCollect);

    const tapDanoService = new TapDanoService();
    nfcModal.value.openModal(1);
    nfcModal.value.onModalClose(() => {
      tapDanoService.cancel();
    });

    let tx = await lucid.newTx();
    for (let i = 0; i < utxoToCollect.length; i++) {
      const message = utxoToCollect[i].txHash + utf8ToHex(String(utxoToCollect[i].outputIndex)) + publicKeyHash;
      const tag = await tapDanoService.signData(message);
      nfcModal.value.incrementProgress();
      const redeemer = Data.to(new Constr(0, [tag.LastSignature]));
      tx = tx.collectFrom([utxoToCollect[i]], redeemer);
    }
    await nfcModal.value.closeModal(500);
    tx = tx.addSigner(await lucid.wallet.address()).attachSpendingValidator(validador);
    const datum = Data.to(new Constr(0, [currentTag.PublicKey || '', (drilling.value ? '00' : '01') + new Date().getTime().toString(16).padStart(16, '0')]));
    const assets = {
      lovelace: 2000000n,
    };
    tx = tx.payToContract(contractAddress, { inline: datum }, assets);
    tx = await tx.complete();
    console.log('tx complete', tx);
    const signedTx = await tx.sign().complete();
    console.log('signedTx', signedTx);
    const txHash = await signedTx.submit();

    /*
    nextUTXO = {
      address: contractAddress,
      datum: datum,
      assets: assets,
      txHash: txHash,
      outputIndex: 0
    };
    */
    console.log('TX:' + txHash);

    drilling.value = !drilling.value;
    const now = new Date();
    history.value.push({
      tx: txHash,
      dateTime: now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }).slice(0, 5) + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      responsible: 'Marcelo A. F. Curi',
      action: drilling.value ? 'Iniciar' : 'Parar',
      status: 'P'
    });
  } catch (error) {
    console.error(error);
    await UIService.showError('Registrando ação anterior, por favor aguarde alguns instantes e tente novamente.');
  }
};

const toggleDrilling = async () => {
  await registerAction();
};

const handleStatusClick = async(entry: any) => {
  console.log(entry);
  const explorerUrl =  await getCardanoScanURL() + '/transaction/' + entry.tx;
  window.open(explorerUrl, '_blank');
};
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
  margin-top: 30px;
}

ion-col {
  background-color: #211d96;
  border: solid 1px #fff;
  color: #FFFFFF;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ic-header ion-col {
  background-color: #135d54;
  color: #FFFFFF;
}

.col-status {
  cursor: pointer;
}
</style>
