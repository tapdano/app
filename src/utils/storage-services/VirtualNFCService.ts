/**
 * VirtualNFCService - Virtual NFC simulation data
 * Handles: burned-tag-id, my-secrets
 */
import { Storage } from '@ionic/storage';

export class VirtualNFCService {
  private storage: Storage;

  constructor() {
    this.storage = new Storage();
    this.storage.create();
  }

  // Burned tag ID management
  async getBurnedTagId(): Promise<string | null> {
    try {
      return await this.storage.get('burned-tag-id');
    } catch (error) {
      console.error('Error getting burned tag id:', error);
      return null;
    }
  }

  async setBurnedTagId(tagId: string): Promise<void> {
    try {
      await this.storage.set('burned-tag-id', tagId);
    } catch (error) {
      console.error('Error setting burned tag id:', error);
      throw error;
    }
  }

  async removeBurnedTagId(): Promise<void> {
    try {
      await this.storage.remove('burned-tag-id');
    } catch (error) {
      console.error('Error removing burned tag id:', error);
      throw error;
    }
  }

  // My secrets management
  async getMySecrets(): Promise<string | null> {
    try {
      return await this.storage.get('my-secrets');
    } catch (error) {
      console.error('Error getting my secrets:', error);
      return null;
    }
  }

  async setMySecrets(secrets: string): Promise<void> {
    try {
      await this.storage.set('my-secrets', secrets);
    } catch (error) {
      console.error('Error setting my secrets:', error);
      throw error;
    }
  }

  async removeMySecrets(): Promise<void> {
    try {
      await this.storage.remove('my-secrets');
    } catch (error) {
      console.error('Error removing my secrets:', error);
      throw error;
    }
  }
}
