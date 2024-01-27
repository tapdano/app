import * as bip39 from 'bip39';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-browser';
import { AppWallet } from '@meshsdk/core';

export function harden(num: number) {
  return 0x80000000 + num;
}

export function validateMnemonic(mnemonic: string) {
  return bip39.validateMnemonic(mnemonic);
}

export function entropyToMnemonic(entropy: string) {
  return bip39.entropyToMnemonic(entropy);
}

export function createWallet(mnemonic: string | null) {
  //if (mnemonic == null) mnemonic = bip39.generateMnemonic();
  if (mnemonic == null) mnemonic = AppWallet.brew().join(' ');
  const entropy = bip39.mnemonicToEntropy(mnemonic);
  const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
    Buffer.from(entropy, 'hex'),
    Buffer.from('')
  );

  const accountKey = rootKey
    .derive(harden(1852)) // purpose
    .derive(harden(1815)) // coin type (Cardano)
    .derive(harden(0)); // account #0

  const utxoPubKey = accountKey
    .derive(0) // external
    .derive(0)
    .to_public();
  
  const stakeKey = accountKey
    .derive(2) // chimeric
    .derive(0)
    .to_public();

  // base address with staking key
  const baseAddr = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.mainnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()),
    CardanoWasm.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash()),
  );

  // enterprise address without staking ability, for use by exchanges/etc
  const enterpriseAddr = CardanoWasm.EnterpriseAddress.new(
    CardanoWasm.NetworkInfo.mainnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash())
  );

  // pointer address - similar to Base address but can be shorter, see formal spec for explanation
  const ptrAddr = CardanoWasm.PointerAddress.new(
    CardanoWasm.NetworkInfo.mainnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(utxoPubKey.to_raw_key().hash()),
    CardanoWasm.Pointer.new(
      100, // slot
      2,   // tx index in slot
      0    // cert indiex in tx
    )
  );

  // reward address - used for withdrawing accumulated staking rewards
  const rewardAddr = CardanoWasm.RewardAddress.new(
    CardanoWasm.NetworkInfo.mainnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(stakeKey.to_raw_key().hash())
  );

  // bootstrap address - byron-era addresses with no staking rights
  const byronAddr = CardanoWasm.ByronAddress.icarus_from_key(
    utxoPubKey, // Ae2* style icarus address
    CardanoWasm.NetworkInfo.mainnet().protocol_magic()
  );

  return {
    entropy,
    mnemonic,
    baseAddr: baseAddr.to_address().to_bech32(),
    enterpriseAddr: enterpriseAddr.to_address().to_bech32(),
    ptrAddr: ptrAddr.to_address().to_bech32(),
    rewardAddr: rewardAddr.to_address().to_bech32(),
    byronAddr: byronAddr.to_address().to_bech32(),
  };
}