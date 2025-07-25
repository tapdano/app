import { AppWallet, AssetFull, BlockfrostProvider } from '@meshsdk/core';
import { Storage } from '@ionic/storage';
import * as bip39 from 'bip39';

async function getNetworkId() {
  const storage = new Storage();
  await storage.create();
  return parseInt(await storage.get('networkId') || '1');
}

export async function getBlockfrostURL() {
  const networkId = await getNetworkId();
  //preprod
  if (networkId == 0) return 'https://cardano-preprod.blockfrost.io/api/v0';
  //mainnet
  if (networkId == 1) return 'https://cardano-mainnet.blockfrost.io/api/v0';
  //sanchonet
  if (networkId == 7) return 'https://cardano-sanchonet.blockfrost.io/api/v0';
  return '';
}

export async function getBlockfrostAPI() {
  const networkId = await getNetworkId();
  //preprod
  if (networkId == 0) return 'preprodZ7oYst1M80Svc1AINDBty3eptaGC7Et9';
  //mainnet
  if (networkId == 1) return 'mainnetlA85V4VJtXzzoWf4DJ8U8NSsHq6z6Epf';
  //sanchonet
  if (networkId == 7) return 'sanchonetga7zaqFSyMi1EH2HKZnqoJWJIt8wV4QC';
  return '';
}

export async function getNetworkName() {
  const networkId = await getNetworkId();
  //preprod
  if (networkId == 0) return 'Preprod';
  //mainnet
  if (networkId == 1) return 'Mainnet';
  //sanchonet
  if (networkId == 7) return 'Preprod';
  return '';
}

export async function getCardanoScanURL() {
  const networkId = await getNetworkId();
  //preprod
  if (networkId == 0) return 'https://preprod.cardanoscan.io';
  //mainnet
  if (networkId == 1) return 'https://cardanoscan.io';
  //sanchonet
  if (networkId == 7) return 'https://sanchonet.beta.explorer.cardano.org';
  return '';
}

export async function getCExplorerURL() {
  const networkId = await getNetworkId();
  //preprod
  if (networkId == 0) return 'https://preprod.cexplorer.io/asset';
  //mainnet
  if (networkId == 1) return 'https://cexplorer.io/asset';
  //sanchonet
  if (networkId == 7) return 'https://sanchonet.beta.explorer.cardano.org/token';
  return '';
}

const blockchainProvider = new BlockfrostProvider(await getBlockfrostAPI());

export function validateMnemonic(mnemonic: string) {
  return bip39.validateMnemonic(mnemonic);
}

export function entropyToMnemonic(entropy: string) {
  return bip39.entropyToMnemonic(entropy);
}

export async function loadWallet(mnemonic: string) {
  return new AppWallet({
    networkId: await getNetworkId() == 1 ? 1 : 0,
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
  const wallet = await loadWallet(mnemonic);
  return {
    mnemonic: mnemonic,
    baseAddr: wallet.getBaseAddress(),
    rewardAddr: wallet.getRewardAddress()
  };
}

export function fetchAccountInfo(address: string) {
  return blockchainProvider.fetchAccountInfo(address);
}

export function fetchWalletAssets(address: string) {
  return blockchainProvider.fetchWalletAssets(address);
}

export function fetchAssetMetadata(asset: string) {
  return blockchainProvider.fetchAssetMetadata(asset);
}

export function fetchAssetFull(asset: string): Promise<AssetFull> {
  return blockchainProvider.fetchAssetFull(asset);
}

export async function fetchTransactions(address: string) {
  const blockFrostURL = await getBlockfrostURL();
  const blockFrostAPI = await getBlockfrostAPI();
  const response = await fetch(`${blockFrostURL}/addresses/${address}/transactions`, {
    headers: {
      'project_id': blockFrostAPI
    }
  });
  if (!response.ok) {
    throw new Error('API error');
  }
  const data = await response.json();
  return data;
}