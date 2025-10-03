/**
 * SeedVaultStorageService - Core Seed Vault data management
 * Handles: sv_tags, currentSVTagIndex, currentSeedPhrase, multipleWalletsEnabled, temp_tag_id, temp_tag_labels, temp_tag_chains
 */
import { Storage } from '@ionic/storage';
import { ensureSerializableTags } from '../SeedVaultUtils';

export interface SeedVaultTag {
  id: string;
  physicalId?: string;
  seedVaultKey: string;
  labels: string[];
  chains: string[];
  multipleWalletsEnabled: boolean;
}

export interface CurrentTagResult {
  tag: SeedVaultTag;
  index: number;
  allTags: SeedVaultTag[];
}

export class SeedVaultStorageService {
  private storage: Storage;

  constructor() {
    this.storage = new Storage();
    this.storage.create();
  }

  // Core Seed Vault operations
  async getCurrentTag(): Promise<CurrentTagResult | null> {
    try {
      const tags = await this.getTags();
      const currentIndex = await this.storage.get('currentSVTagIndex');
      
      if (currentIndex !== null && tags[currentIndex]) {
        return {
          tag: tags[currentIndex],
          index: currentIndex,
          allTags: tags
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current tag:', error);
      return null;
    }
  }

  async getTags(): Promise<SeedVaultTag[]> {
    try {
      const tags = await this.storage.get('sv_tags') || [];
      return Array.isArray(tags) ? tags : [];
    } catch (error) {
      console.error('Error getting tags:', error);
      return [];
    }
  }

  async saveTags(tags: SeedVaultTag[]): Promise<void> {
    try {
      const serializableTags = ensureSerializableTags(tags);
      await this.storage.set('sv_tags', serializableTags);
    } catch (error) {
      console.error('Error saving tags:', error);
      throw error;
    }
  }

  async setCurrentTagIndex(index: number): Promise<void> {
    try {
      await this.storage.set('currentSVTagIndex', index);
    } catch (error) {
      console.error('Error setting current tag index:', error);
      throw error;
    }
  }

  async updateCurrentTag(updatedTag: SeedVaultTag): Promise<void> {
    try {
      const result = await this.getCurrentTag();
      if (!result) throw new Error('No current tag found');
      
      result.allTags[result.index] = updatedTag;
      await this.saveTags(result.allTags);
    } catch (error) {
      console.error('Error updating current tag:', error);
      throw error;
    }
  }

  async removeTag(tagId: string): Promise<void> {
    try {
      const tags = await this.getTags();
      const filteredTags = tags.filter(t => t.id !== tagId);
      
      await this.saveTags(filteredTags);
      await this.storage.remove('currentSVTagIndex');
      await this.storage.remove('my-secrets');
      await this.storage.remove('currentSeedPhrase');
    } catch (error) {
      console.error('Error removing tag:', error);
      throw error;
    }
  }

  // Multiple wallets management
  async setMultipleWalletsEnabled(tagId: string, enabled: boolean): Promise<void> {
    try {
      const result = await this.getCurrentTag();
      if (!result || result.tag.id !== tagId) {
        throw new Error('Tag not found or not current');
      }
      
      result.tag.multipleWalletsEnabled = enabled;
      await this.updateCurrentTag(result.tag);
    } catch (error) {
      console.error('Error setting multiple wallets enabled:', error);
      throw error;
    }
  }

  async isMultipleWalletsEnabled(tagId: string): Promise<boolean> {
    try {
      const result = await this.getCurrentTag();
      if (!result || result.tag.id !== tagId) {
        return false;
      }
      
      return result.tag.multipleWalletsEnabled === true;
    } catch (error) {
      console.error('Error checking multiple wallets enabled:', error);
      return false;
    }
  }

  // Seed phrase management
  async getCurrentSeedPhrase(): Promise<number | null> {
    try {
      return await this.storage.get('currentSeedPhrase');
    } catch (error) {
      console.error('Error getting current seed phrase:', error);
      return null;
    }
  }

  async setCurrentSeedPhrase(index: number): Promise<void> {
    try {
      await this.storage.set('currentSeedPhrase', index);
    } catch (error) {
      console.error('Error setting current seed phrase:', error);
      throw error;
    }
  }

  async removeCurrentSeedPhrase(): Promise<void> {
    try {
      await this.storage.remove('currentSeedPhrase');
    } catch (error) {
      console.error('Error removing current seed phrase:', error);
      throw error;
    }
  }

  // Temporary tag data management
  async getTempTagId(): Promise<string | null> {
    try {
      return await this.storage.get('temp_tag_id');
    } catch (error) {
      console.error('Error getting temp tag id:', error);
      return null;
    }
  }

  async setTempTagId(tagId: string): Promise<void> {
    try {
      await this.storage.set('temp_tag_id', tagId);
    } catch (error) {
      console.error('Error setting temp tag id:', error);
      throw error;
    }
  }

  async getTempTagLabels(): Promise<string[]> {
    try {
      return await this.storage.get('temp_tag_labels') || [];
    } catch (error) {
      console.error('Error getting temp tag labels:', error);
      return [];
    }
  }

  async setTempTagLabels(labels: string[]): Promise<void> {
    try {
      await this.storage.set('temp_tag_labels', labels);
    } catch (error) {
      console.error('Error setting temp tag labels:', error);
      throw error;
    }
  }

  async getTempTagChains(): Promise<string[]> {
    try {
      return await this.storage.get('temp_tag_chains') || [];
    } catch (error) {
      console.error('Error getting temp tag chains:', error);
      return [];
    }
  }

  async setTempTagChains(chains: string[]): Promise<void> {
    try {
      await this.storage.set('temp_tag_chains', chains);
    } catch (error) {
      console.error('Error setting temp tag chains:', error);
      throw error;
    }
  }

  async getTempTagPhysicalId(): Promise<string | null> {
    try {
      return await this.storage.get('temp_tag_physical_id');
    } catch (error) {
      console.error('Error getting temp tag physical id:', error);
      return null;
    }
  }

  async setTempTagPhysicalId(physicalId: string | undefined): Promise<void> {
    try {
      if (physicalId) {
        await this.storage.set('temp_tag_physical_id', physicalId);
      } else {
        await this.storage.remove('temp_tag_physical_id');
      }
    } catch (error) {
      console.error('Error setting temp tag physical id:', error);
      throw error;
    }
  }

  // Cleanup operations
  async clearTempData(): Promise<void> {
    try {
      await this.storage.remove('temp_tag_id');
      await this.storage.remove('temp_tag_labels');
      await this.storage.remove('temp_tag_chains');
      await this.storage.remove('temp_tag_physical_id');
    } catch (error) {
      console.error('Error clearing temp data:', error);
      throw error;
    }
  }

  // Save seed vault tag (from SeedVaultUtils)
  async saveSeedVaultTag({ key, tagId, physicalId, labels, chains }: { key: string, tagId: string, physicalId?: string, labels?: string[], chains?: string[] }): Promise<void> {
    try {
      let svTags = await this.getTags();
      
      let idx = svTags.findIndex((t: SeedVaultTag) => t.id === tagId);
      if (idx === -1) {
        svTags.push({ 
          id: tagId,
          physicalId: physicalId,
          seedVaultKey: key, 
          labels: labels ? [...labels] : [],
          chains: chains ? [...chains] : [],
          multipleWalletsEnabled: false
        });
        idx = svTags.length - 1;
      } else {
        svTags[idx].seedVaultKey = key;
        if (physicalId) {
          svTags[idx].physicalId = physicalId;
        }
        if (labels) {
          svTags[idx].labels = [...labels];
        }
        if (chains) {
          svTags[idx].chains = [...chains];
        }
        // Preserve existing multipleWalletsEnabled setting or default to false
        if (svTags[idx].multipleWalletsEnabled === undefined) {
          svTags[idx].multipleWalletsEnabled = false;
        }
      }
      
      await this.saveTags(svTags);
      await this.setCurrentTagIndex(idx);
    } catch (error) {
      console.error('Error saving seed vault tag:', error);
      throw error;
    }
  }
}
