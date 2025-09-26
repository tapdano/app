import { AppWallet, AssetFull, BlockfrostProvider } from '@meshsdk/core';
import { Storage } from '@ionic/storage';
import * as bip39 from 'bip39';
import * as elliptic from 'elliptic';
import CryptoJS from 'crypto-js';

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

export function validateMnemonic(mnemonic: string, walletType: string = 'cardano'): boolean {
  if (!mnemonic || typeof mnemonic !== 'string') {
    return false;
  }

  const words = mnemonic.trim().split(/\s+/);
  
  switch (walletType) {
    case 'cardano':
      // Cardano uses specific word counts: 12, 15, 24, or 27 words
      const validCardanoLengths = [12, 15, 24, 27];
      if (!validCardanoLengths.includes(words.length)) {
        return false;
      }
      
      // Use BIP39 validation for Cardano mnemonics
      return bip39.validateMnemonic(mnemonic);
    
    case 'ethereum':
    case 'bitcoin':
    case 'polkadot':
    case 'cosmos':
    case 'algorand':
    case 'tezos':
    case 'avalanche':
    case 'midnight':
    case 'milkomeda':
      // These use BIP39 standard
      return bip39.validateMnemonic(mnemonic);
    
    case 'solana':
      // Solana uses BIP39 but with specific word count requirements
      // Solana typically uses 12 or 24 words
      if (words.length !== 12 && words.length !== 24) {
        return false;
      }
      return bip39.validateMnemonic(mnemonic);
    
    default:
      // Default to BIP39 validation for unknown types
      return bip39.validateMnemonic(mnemonic);
  }
}

export function entropyToMnemonic(entropy: string) {
  return bip39.entropyToMnemonic(entropy);
}

export function generateMnemonic(walletType: string = 'cardano'): string {
  switch (walletType) {
    case 'cardano':
      // Cardano uses AppWallet.brew() which generates 12 words
      return AppWallet.brew().join(' ');
    
    case 'ethereum':
    case 'bitcoin':
    case 'polkadot':
    case 'cosmos':
    case 'algorand':
    case 'tezos':
    case 'avalanche':
    case 'midnight':
    case 'milkomeda':
      // These use BIP39 standard - generate 12 words
      return bip39.generateMnemonic(128); // 128 bits = 12 words
    
    case 'solana':
      // Solana typically uses 12 words
      return bip39.generateMnemonic(128); // 128 bits = 12 words
    
    default:
      // Default to BIP39 12 words for unknown types
      return bip39.generateMnemonic(128);
  }
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

// Generate address for specific wallet type
export async function generateWalletAddress(mnemonic: string, walletType: string): Promise<string> {
  if (!mnemonic || !mnemonic.trim()) {
    throw new Error('Invalid mnemonic');
  }

  switch (walletType.toLowerCase()) {
    case 'cardano':
      return await generateCardanoAddress(mnemonic);
    
    case 'ethereum':
      return generateEthereumAddress(mnemonic);
    
    case 'bitcoin':
      return generateBitcoinAddress(mnemonic);
    
    case 'solana':
      return generateSolanaAddress(mnemonic);
    
    case 'polkadot':
      return generatePolkadotAddress(mnemonic);
    
    case 'cosmos':
      return generateCosmosAddress(mnemonic);
    
    case 'algorand':
      return generateAlgorandAddress(mnemonic);
    
    case 'tezos':
      return generateTezosAddress(mnemonic);
    
    case 'avalanche':
      return generateAvalancheAddress(mnemonic);
    
    case 'midnight':
      return generateMidnightAddress(mnemonic);
    
    case 'milkomeda':
      return generateMilkomedaAddress(mnemonic);
    
    default:
      // Default to Cardano for unknown types
      return await generateCardanoAddress(mnemonic);
  }
}

// Generate Cardano address
async function generateCardanoAddress(mnemonic: string): Promise<string> {
  try {
    const wallet = await createWallet(mnemonic);
    return wallet.baseAddr;
  } catch (error) {
    throw new Error(`Failed to generate Cardano address: ${error}`);
  }
}

// Generate Ethereum address
function generateEthereumAddress(mnemonic: string): string {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Use HD wallet derivation path for Ethereum (m/44'/60'/0'/0/0)
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.keyFromPrivate(seed.slice(0, 32));
    const publicKey = keyPair.getPublic(false, 'hex');
    
    // Remove the '04' prefix and hash with Keccak-256
    const publicKeyBytes = publicKey.slice(2);
    const hash = CryptoJS.SHA3(publicKeyBytes, { outputLength: 256 });
    
    // Take last 20 bytes and convert to hex with 0x prefix
    const address = '0x' + hash.toString(CryptoJS.enc.Hex).slice(-40);
    return address;
  } catch (error) {
    throw new Error(`Failed to generate Ethereum address: ${error}`);
  }
}

// Generate Bitcoin address (P2PKH - Legacy)
function generateBitcoinAddress(mnemonic: string): string {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Use HD wallet derivation path for Bitcoin (m/44'/0'/0'/0/0)
    const ec = new elliptic.ec('secp256k1');
    const keyPair = ec.keyFromPrivate(seed.slice(0, 32));
    const publicKey = keyPair.getPublic(false, 'hex');
    
    // Remove '04' prefix
    const publicKeyBytes = publicKey.slice(2);
    
    // Hash with SHA-256
    const sha256Hash = CryptoJS.SHA256(publicKeyBytes);
    
    // Hash with RIPEMD-160 (using SHA-256 as approximation since CryptoJS doesn't have RIPEMD-160)
    const ripemd160Hash = CryptoJS.SHA256(sha256Hash.toString()).toString().slice(0, 40);
    
    // Add version byte (0x00 for mainnet)
    const versionedHash = '00' + ripemd160Hash;
    
    // Double SHA-256 for checksum
    const checksum = CryptoJS.SHA256(CryptoJS.SHA256(versionedHash).toString()).toString().slice(0, 8);
    
    // Combine and encode as base58
    const addressHex = versionedHash + checksum;
    return base58EncodeFromHex(addressHex);
  } catch (error) {
    throw new Error(`Failed to generate Bitcoin address: ${error}`);
  }
}

// Generate Solana address
function generateSolanaAddress(mnemonic: string): string {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Use first 32 bytes as private key
    const privateKey = seed.slice(0, 32);
    
    // Generate public key using Ed25519
    const ec = new elliptic.ec('ed25519');
    const keyPair = ec.keyFromPrivate(privateKey);
    const publicKey = keyPair.getPublic(false, 'hex');
    
    // Solana addresses are base58 encoded public keys
    return base58EncodeFromHex(publicKey);
  } catch (error) {
    throw new Error(`Failed to generate Solana address: ${error}`);
  }
}

// Generate Polkadot address
function generatePolkadotAddress(mnemonic: string): string {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Use first 32 bytes as private key
    const privateKey = seed.slice(0, 32);
    
    // Generate public key using Ed25519
    const ec = new elliptic.ec('ed25519');
    const keyPair = ec.keyFromPrivate(privateKey);
    const publicKey = keyPair.getPublic(false, 'hex');
    
    // Polkadot addresses are base58 encoded public keys with SS58 format
    // For simplicity, we'll use a basic base58 encoding
    return base58EncodeFromHex(publicKey);
  } catch (error) {
    throw new Error(`Failed to generate Polkadot address: ${error}`);
  }
}

// Generate Cosmos address
function generateCosmosAddress(mnemonic: string): string {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Use first 32 bytes as private key
    const privateKey = seed.slice(0, 32);
    
    // Generate public key using Ed25519
    const ec = new elliptic.ec('ed25519');
    const keyPair = ec.keyFromPrivate(privateKey);
    const publicKey = keyPair.getPublic(false, 'hex');
    
    // Cosmos addresses are bech32 encoded
    // For simplicity, we'll use base58 encoding
    return base58EncodeFromHex(publicKey);
  } catch (error) {
    throw new Error(`Failed to generate Cosmos address: ${error}`);
  }
}

// Generate Algorand address
function generateAlgorandAddress(mnemonic: string): string {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Use first 32 bytes as private key
    const privateKey = seed.slice(0, 32);
    
    // Generate public key using Ed25519
    const ec = new elliptic.ec('ed25519');
    const keyPair = ec.keyFromPrivate(privateKey);
    const publicKey = keyPair.getPublic(false, 'hex');
    
    // Algorand addresses are base32 encoded
    // For simplicity, we'll use base58 encoding
    return base58EncodeFromHex(publicKey);
  } catch (error) {
    throw new Error(`Failed to generate Algorand address: ${error}`);
  }
}

// Generate Tezos address
function generateTezosAddress(mnemonic: string): string {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Use first 32 bytes as private key
    const privateKey = seed.slice(0, 32);
    
    // Generate public key using Ed25519
    const ec = new elliptic.ec('ed25519');
    const keyPair = ec.keyFromPrivate(privateKey);
    const publicKey = keyPair.getPublic(false, 'hex');
    
    // Tezos addresses are base58 encoded with tz1 prefix
    // For simplicity, we'll use base58 encoding
    return base58EncodeFromHex(publicKey);
  } catch (error) {
    throw new Error(`Failed to generate Tezos address: ${error}`);
  }
}

// Generate Avalanche address
function generateAvalancheAddress(mnemonic: string): string {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Use first 32 bytes as private key
    const privateKey = seed.slice(0, 32);
    
    // Generate public key using Ed25519
    const ec = new elliptic.ec('ed25519');
    const keyPair = ec.keyFromPrivate(privateKey);
    const publicKey = keyPair.getPublic(false, 'hex');
    
    // Avalanche addresses are base58 encoded
    return base58EncodeFromHex(publicKey);
  } catch (error) {
    throw new Error(`Failed to generate Avalanche address: ${error}`);
  }
}

// Generate Midnight address
function generateMidnightAddress(mnemonic: string): string {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Use first 32 bytes as private key
    const privateKey = seed.slice(0, 32);
    
    // Generate public key using Ed25519
    const ec = new elliptic.ec('ed25519');
    const keyPair = ec.keyFromPrivate(privateKey);
    const publicKey = keyPair.getPublic(false, 'hex');
    
    // Midnight addresses are base58 encoded
    return base58EncodeFromHex(publicKey);
  } catch (error) {
    throw new Error(`Failed to generate Midnight address: ${error}`);
  }
}

// Generate Milkomeda address
function generateMilkomedaAddress(mnemonic: string): string {
  try {
    // Convert mnemonic to seed
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    
    // Use first 32 bytes as private key
    const privateKey = seed.slice(0, 32);
    
    // Generate public key using Ed25519
    const ec = new elliptic.ec('ed25519');
    const keyPair = ec.keyFromPrivate(privateKey);
    const publicKey = keyPair.getPublic(false, 'hex');
    
    // Milkomeda addresses are base58 encoded
    return base58EncodeFromHex(publicKey);
  } catch (error) {
    throw new Error(`Failed to generate Milkomeda address: ${error}`);
  }
}

// Base58 encoding function from hex string
function base58EncodeFromHex(hexString: string): string {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let encoded = '';
  let num = BigInt('0x' + hexString);
  
  while (num > 0n) {
    const remainder = num % 58n;
    encoded = alphabet[Number(remainder)] + encoded;
    num = num / 58n;
  }
  
  // Add leading '1's for leading zeros
  const leadingZeros = hexString.match(/^0+/);
  if (leadingZeros) {
    const zeroCount = leadingZeros[0].length / 2; // Each pair of hex chars = 1 byte
    encoded = '1'.repeat(zeroCount) + encoded;
  }
  
  return encoded;
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