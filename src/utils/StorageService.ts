/**
 * Centralized storage service with type safety and error handling
 * Eliminates repeated storage operations throughout the codebase
 */
import { Storage } from '@ionic/storage';
import { ensureSerializableTags } from './SeedVaultUtils';

export class StorageService {
  private storage: Storage;

  constructor() {
    this.storage = new Storage();
    this.storage.create();
  }

  // Generic storage operations
  async get<T>(key: string): Promise<T | null> {
    try {
      return await this.storage.get(key);
    } catch (error) {
      console.error(`Storage get error for ${key}:`, error);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      await this.storage.set(key, value);
    } catch (error) {
      console.error(`Storage set error for ${key}:`, error);
      throw error;
    }
  }

  async remove(key: string): Promise<void> {
    try {
      await this.storage.remove(key);
    } catch (error) {
      console.error(`Storage remove error for ${key}:`, error);
      throw error;
    }
  }

  // Seed Vault specific operations
  async getCurrentTag() {
    const tags = await this.get<any[]>('sv_tags') || [];
    const currentIndex = await this.get<number>('currentSVTagIndex');
    
    if (currentIndex !== null && tags[currentIndex]) {
      return {
        tag: tags[currentIndex],
        index: currentIndex,
        allTags: tags
      };
    }
    
    return null;
  }

  async updateCurrentTag(updatedTag: any): Promise<void> {
    const result = await this.getCurrentTag();
    if (!result) throw new Error('No current tag found');
    
    result.allTags[result.index] = updatedTag;
    const serializableTags = ensureSerializableTags(result.allTags);
    await this.set('sv_tags', serializableTags);
  }

  async saveTags(tags: any[]): Promise<void> {
    const serializableTags = ensureSerializableTags(tags);
    await this.set('sv_tags', serializableTags);
  }

  async removeTag(tagId: string): Promise<void> {
    const tags = await this.get<any[]>('sv_tags') || [];
    const filteredTags = tags.filter(t => t.id !== tagId);
    
    await this.saveTags(filteredTags);
    await this.remove('currentSVTagIndex');
    await this.remove('my-secrets');
    await this.remove('currentSeedPhrase');
  }

  async setMultipleWalletsEnabled(tagId: string, enabled: boolean): Promise<void> {
    const result = await this.getCurrentTag();
    if (!result || result.tag.id !== tagId) {
      throw new Error('Tag not found or not current');
    }
    
    result.tag.multipleWalletsEnabled = enabled;
    await this.updateCurrentTag(result.tag);
  }

  async isMultipleWalletsEnabled(tagId: string): Promise<boolean> {
    const result = await this.getCurrentTag();
    if (!result || result.tag.id !== tagId) {
      return false;
    }
    
    return result.tag.multipleWalletsEnabled === true;
  }

  // Common cleanup operations
  async clearTempData(): Promise<void> {
    await this.remove('temp_tag_id');
    await this.remove('temp_tag_labels');
    await this.remove('temp_tag_chains');
  }
}