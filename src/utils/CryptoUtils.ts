import * as bip39 from 'bip39';
import * as CardanoWasm from '@emurgo/cardano-serialization-lib-browser';

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
  if (mnemonic == null) mnemonic = bip39.generateMnemonic();
  const entropy = bip39.mnemonicToEntropy(mnemonic);
  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const rootKey = CardanoWasm.Bip32PrivateKey.from_bip39_entropy(
    seed,
    Buffer.from('')
  );

  const accountKey = rootKey
    .derive(harden(1852)) // purpose
    .derive(harden(1815)) // coin type (Cardano)
    .derive(harden(0)); // account #0

  const publicKey = accountKey.to_public();

  const address = CardanoWasm.BaseAddress.new(
    CardanoWasm.NetworkInfo.mainnet().network_id(),
    CardanoWasm.StakeCredential.from_keyhash(publicKey.to_raw_key().hash()),
    CardanoWasm.StakeCredential.from_keyhash(publicKey.to_raw_key().hash())
  ).to_address().to_bech32();

  return {
    entropy,
    mnemonic,
    address,
    publicKey: publicKey.to_bech32(),
    privateKey: rootKey.to_bech32(),
  };
}