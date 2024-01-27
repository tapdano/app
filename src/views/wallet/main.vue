<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button color="primary"></ion-menu-button>
        </ion-buttons>
        <ion-title>{{ walletName }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div id="container">
        <h1>ADA / USD</h1>
        <PriceChart />
        <div id="myWalletBox">
          <ion-textarea v-model="walletReceiveAddress" label="Receive Address" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(walletReceiveAddress, true)" :readonly="true"></ion-textarea>
          <ion-textarea v-model="walletStakingAddress" label="Staking Address" :label-placement="'stacked'" :auto-grow="true" @click="() => copyToClipboard(walletStakingAddress, true)" :readonly="true"></ion-textarea>
        </div>
        <div>
          <h2>Wallet Balance:</h2>
          <p>{{ walletBalance }} ADA</p>
        </div>
        <div>
          <h2>Send ADA</h2>
          <ion-item>
            <ion-input v-model="destinationAddress" type="text" label="Destination Address" :label-placement="'stacked'"></ion-input>
          </ion-item>
          <ion-item>
            <ion-input v-model="adaAmount" type="number" label="ADA Amount" :label-placement="'stacked'"></ion-input>
          </ion-item>
          <ion-button @click="sendTransaction">Send</ion-button>
        </div>
      </div>
    </ion-content>

    <NFCModal :is-open="showModal" @cancel="handleModalCancel" @dismiss="handleModalDismiss"></NFCModal>

    <WalletTabBar />

  </ion-page>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonButtons, IonContent, IonHeader, IonMenuButton, IonPage, IonTitle, IonToolbar, IonTextarea, IonLabel, IonInput, IonItem, IonButton } from '@ionic/vue';
import WalletTabBar from '../../components/WalletTabBar.vue';
import PriceChart from '../../components/PriceChart.vue';
import { getCurrentWallet } from '@/utils/StorageUtils';
import { copyToClipboard } from '@/utils/ClipboardUtils';
import { accessNFCTag, cancelNFCTagReading } from '@/utils/NFCUtils';
import { entropyToMnemonic, validateMnemonic, createWallet } from '@/utils/CryptoUtils';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-browser';
import * as bip39 from 'bip39';
import NFCModal from '@/components/NFCModal.vue';
import { AppWallet } from '@meshsdk/core';

const mnemonic = AppWallet.brew();
console.log(mnemonic);

const BLOCKFROST_API_KEY = 'mainnetlA85V4VJtXzzoWf4DJ8U8NSsHq6z6Epf';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

const walletBalance = ref(0);

const fetchWalletBalance = async (address: string) => {
  try {
    const response = await fetch(`${BLOCKFROST_API_URL}/addresses/${address}`, {
      headers: {
        'project_id': BLOCKFROST_API_KEY
      }
    });
    if (!response.ok) {
      throw new Error('API error');
    }
    const data = await response.json();
    walletBalance.value = data.amount[0].quantity / 1000000;
  } catch (error) {
    console.error(error);
  }
};

const router = useRouter();
const route = useRoute();

const walletName = ref('');
const walletReceiveAddress = ref('');
const walletStakingAddress = ref('');

const destinationAddress = ref('');
const adaAmount = ref(0);

const showModal = ref(false);

const handleModalCancel = () => {
  showModal.value = false;
  cancelNFCTagReading();
};

const handleModalDismiss = () => {
  showModal.value = false;
};

const getMnemonic = async () => {
  try {
    const currentWallet = await getCurrentWallet();
    showModal.value = true;
    const entropy = await accessNFCTag() as string;
    showModal.value = false;
    const mnemonic = entropyToMnemonic(entropy);
    if (!validateMnemonic(mnemonic)) throw ('Entropy invalid.');
    const cryptoWallet = createWallet(mnemonic);
    if (cryptoWallet.baseAddr != currentWallet.baseAddr) throw ('Wrong Wallet.');
    return cryptoWallet.mnemonic;
  } catch (error) {
    showModal.value = false;
    console.error(error);
    throw error;
  }
};

const sendTransaction = async () => {
  /*
  if (!destinationAddress.value || adaAmount.value <= 0) {
    alert('Please fill in all fields correctly.');
    return;
  }
  */

  const linearFee = CardanoWasm.LinearFee.new(
    CardanoWasm.BigNum.from_str('44'),
    CardanoWasm.BigNum.from_str('155381')
  );
  const txBuilderCfg = CardanoWasm.TransactionBuilderConfigBuilder.new()
    .fee_algo(linearFee)
    .pool_deposit(CardanoWasm.BigNum.from_str('500000000'))
    .key_deposit(CardanoWasm.BigNum.from_str('2000000'))
    .max_value_size(4000)
    .max_tx_size(8000)
    .coins_per_utxo_word(CardanoWasm.BigNum.from_str('34482'))
    .build();

  const txBuilder = CardanoWasm.TransactionBuilder.new(txBuilderCfg);

  const mnemonic = await getMnemonic();
  const cryptoWallet = createWallet(mnemonic);

  const entropy = bip39.mnemonicToEntropy(mnemonic);
  const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
    Buffer.from(entropy, 'hex'),
    Buffer.from('')
  );

  const prvKey = CardanoWasm.PrivateKey.from_bech32(rootKey.to_raw_key().to_bech32());

  interface Amount {
    unit: string;
    quantity: string;
  }

  interface Utxo {
    tx_hash: string;
    output_index: number;
    amount: Amount[];
  }

  let utxos: Utxo[] = [];
  try {
    const utxosResponse = await fetch(`${BLOCKFROST_API_URL}/addresses/${walletReceiveAddress.value}/utxos`, {
      headers: {
        'project_id': BLOCKFROST_API_KEY
      }
    });
    if (!utxosResponse.ok) {
      throw new Error('UTXOs error');
    }
    const utxosResponseJson = await utxosResponse.json();
    utxos = utxosResponseJson;
  } catch (error) {
    console.error(error);
    return;
  }

  utxos.forEach(utxo => {
    const lovelaceAmountObj = utxo.amount.find(a => a.unit === 'lovelace');
    if (lovelaceAmountObj && lovelaceAmountObj.quantity !== '0') {
      const lovelaceAmount = lovelaceAmountObj.quantity;
      txBuilder.add_key_input(
        prvKey.to_public().hash(),
        CardanoWasm.TransactionInput.new(
          CardanoWasm.TransactionHash.from_bytes(Buffer.from(utxo.tx_hash, "hex")),
          utxo.output_index,
        ),
        CardanoWasm.Value.new(CardanoWasm.BigNum.from_str(lovelaceAmount))
      );
    }
  });

  // base address
  const shelleyOutputAddress = CardanoWasm.Address.from_bech32("addr1qy3lu5gahlnw9xn7qjehfjs2q62tz85setj5alq3t5xjjvejcd9kv5awyl0zz46tdyrgvhg3yxx36udhafcfyt5m7yvq2k0jmv");

  // pointer address
  const shelleyChangeAddress = CardanoWasm.Address.from_bech32(cryptoWallet.ptrAddr);

  // add output to the tx
  txBuilder.add_output(
    CardanoWasm.TransactionOutput.new(
      shelleyOutputAddress,
      CardanoWasm.Value.new(CardanoWasm.BigNum.from_str('1000000'))
    ),
  );  

  // set the time to live - the absolute slot value before the tx becomes invalid
  txBuilder.set_ttl(410021);

  // calculate the min fee required and send any change to an address
  txBuilder.add_change_if_needed(shelleyChangeAddress);

  // once the transaction is ready, we build it to get the tx body without witnesses
  const txBody = txBuilder.build();
  const txHash = CardanoWasm.hash_transaction(txBody);
  const witnesses = CardanoWasm.TransactionWitnessSet.new();

  // add keyhash witnesses
  const vkeyWitnesses = CardanoWasm.Vkeywitnesses.new();
  const vkeyWitness = CardanoWasm.make_vkey_witness(txHash, prvKey);
  vkeyWitnesses.add(vkeyWitness);
  witnesses.set_vkeys(vkeyWitnesses);

  // create the finalized transaction with witnesses
  const transaction = CardanoWasm.Transaction.new(
    txBody,
    witnesses,
    undefined, // transaction metadata
  );

  console.log(transaction.is_valid());
  console.log(transaction.to_js_value());

  const transactionData = Buffer.from(transaction.to_bytes()).toString('hex');

  try {
    const response = await fetch(`${BLOCKFROST_API_URL}/tx/submit`, {
      method: 'POST',
      headers: {
        'project_id': BLOCKFROST_API_KEY,
        'Content-Type': 'application/cbor',
        'Accept': 'application/json'
      },
      body: transactionData
    });

    if (!response.ok) {
      console.log(response);
      throw new Error('Transaction error');
    }

    alert('Success!');
  } catch (error) {
    console.error(error);
    alert(error);
  }
};

watch(() => route.path, async (newPath) => {
  if (newPath === '/wallet/main') {
    const currentWallet = await getCurrentWallet();
    if (currentWallet == null) {
      router.push('/my-wallets');
      return;
    }
    walletName.value = currentWallet.name;
    walletReceiveAddress.value = currentWallet.baseAddr;
    walletStakingAddress.value = currentWallet.rewardAddr;
    await fetchWalletBalance(currentWallet.baseAddr);
  }
}, { immediate: true });
</script>

<style scoped>
#container {
  margin: 20px;
}

#myWalletBox{
  margin: 20px 0;
}

h1 {
  text-align: center;
}
</style>
