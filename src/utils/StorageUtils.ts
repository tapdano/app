import { Storage } from '@ionic/storage';

export async function getCurrentWallet() {
  return getCurrentItem('currentWallet', 'wallets');
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