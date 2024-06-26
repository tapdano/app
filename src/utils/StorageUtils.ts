import { Storage } from '@ionic/storage';
import { TagParser } from './TagParser';

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