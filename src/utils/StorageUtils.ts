import { Storage } from '@ionic/storage';
import { TagParser } from 'tapdano';
import { loadWallet } from '@/utils/CryptoUtils';

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

export async function getCurrentWallet() {
  const currentWallet = await getCurrentItem('currentWallet', 'wallets');
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

export async function getWallets() {
  const storage = new Storage();
  await storage.create();
  const wallets = await storage.get('wallets') || [];
  for (let i = 0; i < wallets.length; i++) {
    const wallet = await loadWallet(wallets[i].mnemonic);
    wallets[i].baseAddr = wallet.getBaseAddress();
    wallets[i].rewardAddr = wallet.getRewardAddress();
  }
  return wallets;
}