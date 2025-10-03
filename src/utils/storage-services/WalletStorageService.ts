/**
 * WalletStorageService - Legacy wallet management
 * Handles: local-wallets, currentLocalWallet, my-wallets, currentMyWallet, tags, currentTag
 */
import { Storage } from '@ionic/storage';
import { TagParser } from 'tapdano';
import { createWallet, entropyToMnemonic, loadWallet } from '../CryptoUtils';

export interface Wallet {
  name: string;
  mnemonic: string;
  baseAddr: string;
  rewardAddr: string;
  tag?: TagParser;
}

export class WalletStorageService {
  private storage: Storage;

  constructor() {
    this.storage = new Storage();
    this.storage.create();
  }

  // Local wallets management
  async getLocalWallets(): Promise<Wallet[]> {
    try {
      const wallets = await this.storage.get('local-wallets') || [];
      for (let i = 0; i < wallets.length; i++) {
        const wallet = await loadWallet(wallets[i].mnemonic);
        wallets[i].baseAddr = wallet.getBaseAddress();
        wallets[i].rewardAddr = wallet.getRewardAddress();
      }
      return wallets;
    } catch (error) {
      console.error('Error getting local wallets:', error);
      return [];
    }
  }

  async getCurrentLocalWallet(): Promise<Wallet | null> {
    try {
      const currentWallet = await this.getCurrentItem('currentLocalWallet', 'local-wallets');
      if (currentWallet != null) {
        const wallet = await loadWallet(currentWallet.mnemonic);
        currentWallet.baseAddr = wallet.getBaseAddress();
        currentWallet.rewardAddr = wallet.getRewardAddress();
      }
      return currentWallet;
    } catch (error) {
      console.error('Error getting current local wallet:', error);
      return null;
    }
  }

  async setCurrentLocalWallet(index: number): Promise<void> {
    try {
      await this.storage.set('currentLocalWallet', index);
    } catch (error) {
      console.error('Error setting current local wallet:', error);
      throw error;
    }
  }

  async addLocalWallet(wallet: Wallet): Promise<void> {
    try {
      const wallets = await this.getLocalWallets();
      const newIndex = wallets.length;
      wallets.push(wallet);
      await this.storage.set('local-wallets', wallets);
      await this.storage.set('currentLocalWallet', newIndex);
    } catch (error) {
      console.error('Error adding local wallet:', error);
      throw error;
    }
  }

  async removeLocalWallet(index: number): Promise<void> {
    try {
      let wallets = await this.getLocalWallets();
      const currentIndex = await this.storage.get('currentLocalWallet');
      
      wallets.splice(index, 1);
      await this.storage.set('local-wallets', wallets);
      
      if (currentIndex === index) {
        await this.storage.remove('currentLocalWallet');
      }
    } catch (error) {
      console.error('Error removing local wallet:', error);
      throw error;
    }
  }

  // My wallets management
  async getMyWallets(): Promise<Wallet[]> {
    try {
      const wallets = await this.storage.get('my-wallets') || [];
      for (let i = 0; i < wallets.length; i++) {
        const wallet = await loadWallet(wallets[i].mnemonic);
        wallets[i].baseAddr = wallet.getBaseAddress();
        wallets[i].rewardAddr = wallet.getRewardAddress();
      }
      return wallets;
    } catch (error) {
      console.error('Error getting my wallets:', error);
      return [];
    }
  }

  async getCurrentMyWallet(): Promise<Wallet | null> {
    try {
      const currentWallet = await this.getCurrentItem('currentMyWallet', 'my-wallets');
      if (currentWallet != null) {
        const wallet = await loadWallet(currentWallet.mnemonic);
        currentWallet.baseAddr = wallet.getBaseAddress();
        currentWallet.rewardAddr = wallet.getRewardAddress();
      }
      return currentWallet;
    } catch (error) {
      console.error('Error getting current my wallet:', error);
      return null;
    }
  }

  async setCurrentMyWallet(index: number): Promise<void> {
    try {
      await this.storage.set('currentMyWallet', index);
    } catch (error) {
      console.error('Error setting current my wallet:', error);
      throw error;
    }
  }

  async addMyWallet(tag: TagParser, name?: string): Promise<void> {
    try {
      const wallets = await this.getMyWallets();
      const mnemonic = entropyToMnemonic(tag.PrivateKey as string);
      const cryptoWallet = await createWallet(mnemonic);

      const index = wallets.findIndex((item: Wallet) => {
        return item.baseAddr == cryptoWallet.baseAddr;
      });

      if (index != -1) {
        await this.storage.set('currentMyWallet', index);
        return;
      }
      
      const newIndex = wallets.length;
      wallets.push({
        name: name || `TapWallet #${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`,
        tag,
        ...cryptoWallet,
      });

      await this.storage.set('my-wallets', wallets);
      await this.storage.set('currentMyWallet', newIndex);
    } catch (error) {
      console.error('Error adding my wallet:', error);
      throw error;
    }
  }

  async removeMyWallet(index: number): Promise<void> {
    try {
      let wallets = await this.getMyWallets();
      const currentIndex = await this.storage.get('currentMyWallet');
      
      wallets.splice(index, 1);
      await this.storage.set('my-wallets', wallets);
      
      if (currentIndex === index) {
        await this.storage.remove('currentMyWallet');
      }
    } catch (error) {
      console.error('Error removing my wallet:', error);
      throw error;
    }
  }

  // Tags management (legacy)
  async getTags(): Promise<TagParser[]> {
    try {
      return await this.storage.get('tags') || [];
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }

  async getCurrentTag(): Promise<TagParser | null> {
    try {
      return await this.getCurrentItem('currentTag', 'tags');
    } catch (error) {
      console.error('Error getting current tag:', error);
      return null;
    }
  }

  async addTag(tag: TagParser): Promise<void> {
    try {
      if (tag.PublicKey) {
        await this.deleteTagByPublicKey(tag.PublicKey);
      }
      
      const tags = await this.getTags();
      tags.push(tag);
      await this.storage.set('tags', tags);
      await this.storage.set('currentTag', tags.length - 1);
    } catch (error) {
      console.error('Error adding tag:', error);
      throw error;
    }
  }

  async deleteTagByPublicKey(publicKey: string): Promise<void> {
    try {
      let tags = await this.getTags();
      tags = tags.filter((tag: TagParser) => {
        return tag.PublicKey !== publicKey;
      });
      await this.storage.set('tags', tags);
    } catch (error) {
      console.error('Error deleting tag by public key:', error);
      throw error;
    }
  }

  // Helper method
  private async getCurrentItem(currentKey: string, itemsKey: string): Promise<any> {
    try {
      const currentIndex = await this.storage.get(currentKey);
      if (currentIndex === null) {
        return null;
      }

      const items = await this.storage.get(itemsKey);
      if (!items || !items[currentIndex]) {
        return null;
      }

      return items[currentIndex];
    } catch (error) {
      console.error('Error getting current item:', error);
      return null;
    }
  }
}
