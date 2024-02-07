import { AppWallet, BlockfrostProvider } from '@meshsdk/core';
import * as bip39 from 'bip39';
import { generateKey, exportKey, importKey, encryptText, decryptText } from './AESUtils';

const BLOCKFROST_API_KEY = 'mainnetlA85V4VJtXzzoWf4DJ8U8NSsHq6z6Epf';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

const blockchainProvider = new BlockfrostProvider(BLOCKFROST_API_KEY);

export function validateMnemonic(mnemonic: string) {
  return bip39.validateMnemonic(mnemonic);
}

export function entropyToMnemonic(entropy: string) {
  return bip39.entropyToMnemonic(entropy);
}

export function loadWallet(mnemonic: string) {
  return new AppWallet({
    networkId: 1,
    fetcher: blockchainProvider,
    submitter: blockchainProvider,
    key: {
      type: 'mnemonic',
      words: mnemonic.split(' '),
    },
  });
}

export async function createWallet(mnemonic: string | null) {

  if (mnemonic == null) mnemonic = AppWallet.brew().join(' ');

  const entropy = bip39.mnemonicToEntropy(mnemonic);

  const AESKey = await generateKey();
  const encriptionKey = await exportKey(AESKey);
  const { iv, encryptedData } = await encryptText(entropy, AESKey);
  const encryptedEntropy = arrayBufferToBase64(encryptedData);

  const wallet = loadWallet(mnemonic);
  const baseAddr = wallet.getBaseAddress();
  const rewardAddr = wallet.getRewardAddress();

  return {
    mnemonic,
    baseAddr,
    rewardAddr,
    encriptionKey,
    encryptedEntropy,
    iv
  };
}

export async function decryptEntropy(encryptedEntropy: string, encriptionKey: Uint8Array, iv: Uint8Array) {
  return await decryptText(base64ToArrayBuffer(encryptedEntropy), iv, await importKey(encriptionKey));
}

export function fetchAccountInfo(address: string) {
  return blockchainProvider.fetchAccountInfo(address);
}

export async function fetchTransactions(address: string) {
  const response = await fetch(`${BLOCKFROST_API_URL}/addresses/${address}/transactions`, {
    headers: {
      'project_id': BLOCKFROST_API_KEY
    }
  });
  if (!response.ok) {
    throw new Error('API error');
  }
  const data = await response.json();
  return data;
};

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}