import { AppWallet, BlockfrostProvider } from '@meshsdk/core';
import * as bip39 from 'bip39';

const BLOCKFROST_API_KEY = 'mainnetlA85V4VJtXzzoWf4DJ8U8NSsHq6z6Epf';
const BLOCKFROST_API_URL = 'https://cardano-mainnet.blockfrost.io/api/v0';

const blockchainProvider = new BlockfrostProvider(BLOCKFROST_API_KEY);

export function validateMnemonic(mnemonic: string) {
  return bip39.validateMnemonic(mnemonic);
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
  const wallet = loadWallet(mnemonic);
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
}