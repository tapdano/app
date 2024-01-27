import { Storage } from '@ionic/storage';

export const getCurrentWallet = async () => {
  const storage = new Storage();
  storage.create();

  const currentIndex = await storage.get('currentWallet');
  if (currentIndex === null) {
    return null;
  }

  const wallets = await storage.get('wallets');
  if (!wallets || !wallets[currentIndex]) {
    return null;
  }

  return wallets[currentIndex];
}