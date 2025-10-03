/**
 * AppConfigStorageService - Application configuration
 * Handles: devMode, dev-token, simulateNFCTag, bulkBurn, homologAPI, tagVersion, eventId, networkId
 */
import { Storage } from '@ionic/storage';

export class AppConfigStorageService {
  private storage: Storage;

  constructor() {
    this.storage = new Storage();
    this.storage.create();
  }

  // Development mode
  async getDevMode(): Promise<boolean> {
    try {
      return (await this.storage.get('devMode')) || false;
    } catch (error) {
      console.error('Error getting dev mode:', error);
      return false;
    }
  }

  async setDevMode(value: boolean): Promise<void> {
    try {
      await this.storage.set('devMode', value);
    } catch (error) {
      console.error('Error setting dev mode:', error);
      throw error;
    }
  }

  // Development token
  async getDevToken(): Promise<string> {
    try {
      return await this.storage.get('dev-token') || '';
    } catch (error) {
      console.error('Error getting dev token:', error);
      return '';
    }
  }

  async setDevToken(token: string): Promise<void> {
    try {
      await this.storage.set('dev-token', token);
    } catch (error) {
      console.error('Error setting dev token:', error);
      throw error;
    }
  }

  // NFC simulation
  async getSimulateNFCTag(): Promise<boolean> {
    try {
      return (await this.storage.get('simulateNFCTag')) || false;
    } catch (error) {
      console.error('Error getting simulate NFC tag:', error);
      return false;
    }
  }

  async setSimulateNFCTag(value: boolean): Promise<void> {
    try {
      await this.storage.set('simulateNFCTag', value);
    } catch (error) {
      console.error('Error setting simulate NFC tag:', error);
      throw error;
    }
  }

  // Bulk burn
  async getBulkBurn(): Promise<boolean> {
    try {
      return (await this.storage.get('bulkBurn')) || false;
    } catch (error) {
      console.error('Error getting bulk burn:', error);
      return false;
    }
  }

  async setBulkBurn(value: boolean): Promise<void> {
    try {
      await this.storage.set('bulkBurn', value);
    } catch (error) {
      console.error('Error setting bulk burn:', error);
      throw error;
    }
  }

  // Homolog API
  async getHomologAPI(): Promise<boolean> {
    try {
      return (await this.storage.get('homologAPI')) || false;
    } catch (error) {
      console.error('Error getting homolog API:', error);
      return false;
    }
  }

  async setHomologAPI(value: boolean): Promise<void> {
    try {
      await this.storage.set('homologAPI', value);
    } catch (error) {
      console.error('Error setting homolog API:', error);
      throw error;
    }
  }

  // Tag version
  async getTagVersion(): Promise<string> {
    try {
      return await this.storage.get('tagVersion') || '';
    } catch (error) {
      console.error('Error getting tag version:', error);
      return '';
    }
  }

  async setTagVersion(version: string): Promise<void> {
    try {
      await this.storage.set('tagVersion', version);
    } catch (error) {
      console.error('Error setting tag version:', error);
      throw error;
    }
  }

  // Event ID
  async getEventId(): Promise<string> {
    try {
      return await this.storage.get('eventId') || '';
    } catch (error) {
      console.error('Error getting event ID:', error);
      return '';
    }
  }

  async setEventId(eventId: string): Promise<void> {
    try {
      await this.storage.set('eventId', eventId);
    } catch (error) {
      console.error('Error setting event ID:', error);
      throw error;
    }
  }

  // Network ID
  async getNetworkId(): Promise<number> {
    try {
      return parseInt(await this.storage.get('networkId') || '1');
    } catch (error) {
      console.error('Error getting network ID:', error);
      return 1;
    }
  }

  async setNetworkId(networkId: number): Promise<void> {
    try {
      await this.storage.set('networkId', networkId);
    } catch (error) {
      console.error('Error setting network ID:', error);
      throw error;
    }
  }
}
