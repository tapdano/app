import { Storage } from '@ionic/storage';
import { TagParser } from 'tapdano';
import { createWallet, entropyToMnemonic, loadWallet } from '@/utils/CryptoUtils';

export async function getNetworkId() {
  const storage = new Storage();
  await storage.create();
  return parseInt(await storage.get('networkId') || '1');
}

export async function setNetworkId(networkId: Number) {
  const storage = new Storage();
  await storage.create();
  await storage.set('networkId', networkId);
}

export async function getDevMode() {
  const storage = new Storage();
  await storage.create();
  return (await storage.get('devMode')) || false;
}

export async function setDevMode(value: Boolean) {
  const storage = new Storage();
  await storage.create();
  await storage.set('devMode', value);
}

export async function getCurrentLocalWallet() {
  const currentWallet = await getCurrentItem('currentLocalWallet', 'local-wallets');
  if (currentWallet != null) {
    const wallet = await loadWallet(currentWallet.mnemonic);
    currentWallet.baseAddr = wallet.getBaseAddress();
    currentWallet.rewardAddr = wallet.getRewardAddress();
  }
  return currentWallet;
}

export async function getCurrentMyWallet() {
  const currentWallet = await getCurrentItem('currentMyWallet', 'my-wallets');
  if (currentWallet != null) {
    const wallet = await loadWallet(currentWallet.mnemonic);
    currentWallet.baseAddr = wallet.getBaseAddress();
    currentWallet.rewardAddr = wallet.getRewardAddress();
  }
  return currentWallet;
}

export async function getCurrentTag() {
  return getCurrentItem('currentTag', 'tags');
}

async function getCurrentItem(currentKey: string, itemsKey: string) {
  const storage = new Storage();
  storage.create();

  const currentIndex = await storage.get(currentKey);
  if (currentIndex === null) {
    return null;
  }

  const items = await storage.get(itemsKey);
  if (!items || !items[currentIndex]) {
    return null;
  }

  return items[currentIndex];
}

export async function deleteTagByPublicKey(publicKey: string) {
  const storage = new Storage();
  await storage.create();
  let tags = await storage.get('tags') || [];
  tags = tags.filter((tag: TagParser) => {
    return tag.PublicKey !== publicKey;
  });
  await storage.set('tags', tags);
}

export async function addTag(tag: TagParser) {
  tag.PublicKey && await deleteTagByPublicKey(tag.PublicKey);
  const storage = new Storage();
  await storage.create();
  const tags = await storage.get('tags') || [];
  tags.push(tag);
  await storage.set('tags', tags);
  await storage.set('currentTag', tags.length - 1);
}

export async function addMyWallet(tag: TagParser, name: string | undefined) {
  const storage = new Storage();
  await storage.create();
  
  const wallets = (await storage.get('my-wallets')) || [];

  const mnemonic = entropyToMnemonic(tag.PrivateKey as string);
  const cryptoWallet = await createWallet(mnemonic);

  const index = wallets.findIndex((item: any) => {
    return item.baseAddr == cryptoWallet.baseAddr;
  });

  if (index != -1) {
    await storage.set('currentMyWallet', index);
    return;
  }
  
  const newIndex = wallets.length;
  wallets.push({
    name: name || `TapWallet #${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
    tag,
    ...cryptoWallet,
  });

  await storage.set('my-wallets', wallets);
  await storage.set('currentMyWallet', newIndex);
}

export async function getLocalWallets() {
  const storage = new Storage();
  await storage.create();
  const wallets = await storage.get('local-wallets') || [];
  for (let i = 0; i < wallets.length; i++) {
    const wallet = await loadWallet(wallets[i].mnemonic);
    wallets[i].baseAddr = wallet.getBaseAddress();
    wallets[i].rewardAddr = wallet.getRewardAddress();
  }
  return wallets;
}

export async function getMyWallets() {
  const storage = new Storage();
  await storage.create();
  const wallets = await storage.get('my-wallets') || [];
  for (let i = 0; i < wallets.length; i++) {
    const wallet = await loadWallet(wallets[i].mnemonic);
    wallets[i].baseAddr = wallet.getBaseAddress();
    wallets[i].rewardAddr = wallet.getRewardAddress();
  }
  return wallets;
}