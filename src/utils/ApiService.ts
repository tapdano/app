/**
 * Centralized API service for Seed Vault operations
 * Eliminates duplication and provides consistent error handling
 */
import { getSeedVaultApiUrl } from '@/utils/SeedVaultUtils';

interface ApiResponse<T = any> {
  status: string;
  error?: string;
  [key: string]: any;
}

export class ApiService {
  private static async makeRequest<T>(action: string, data: any = {}): Promise<T> {
    try {
      const apiUrl = await getSeedVaultApiUrl();
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data })
      });
      
      if (response.status === 404) {
        throw new Error('404 - Not Found');
      }
      
      const result = await response.json();
      
      if (result.status !== 'ok') {
        throw new Error(result.error || `${action} failed`);
      }
      
      return result;
    } catch (error) {
      console.error(`API Error for ${action}:`, error);
      throw error;
    }
  }

  static async addTag(
    auth: string, 
    eventId: string, 
    is_virtual: boolean,
    platform?: string,
    device_model?: string,
    device_manufacturer?: string,
    app_version?: string,
    os_version?: string,
    device_id?: string
  ) {
    return this.makeRequest('ADD_TAG', { 
      auth, 
      event_id: eventId, 
      is_virtual,
      platform,
      device_model,
      device_manufacturer,
      app_version,
      os_version,
      device_id
    });
  }

  static async getTag(id: string) {
    return this.makeRequest('GET_TAG', { id });
  }

  static async startTag(id: string, email: string, pin: string) {
    return this.makeRequest('START_TAG', { id, email, pin });
  }

  static async authByPin(id: string, pin: string) {
    return this.makeRequest('AUTH_BY_PIN', { id, pin });
  }

  static async authByOtp(id: string) {
    return this.makeRequest('AUTH_BY_OTP', { id });
  }

  static async verifyOtp(id: string, otpCode: string) {
    return this.makeRequest('VERIFY_OTP', { id, otp_code: otpCode });
  }

  static async setPin(id: string, pin: string, key: string) {
    return this.makeRequest('SET_PIN', { id, pin, key });
  }

  static async setEmail(id: string, email: string, key: string) {
    return this.makeRequest('SET_EMAIL', { id, email, key });
  }

  static async updatePhysicalId(id: string, physicalId: string, auth: string) {
    return this.makeRequest('UPDATE_PHYSICAL_ID', { id, physical_id: physicalId, auth });
  }

  static async getEvents() {
    return this.makeRequest('GET_EVENTS');
  }

  static async participateLottery(eventId: string, tagId: string, passcode: string) {
    return this.makeRequest('PARTICIPATE_LOTTERY', { event_id: eventId, tag_id: tagId, passcode: passcode });
  }

  static async getLotteryParticipants(eventId: string) {
    return this.makeRequest('GET_LOTTERY_PARTICIPANTS', { event_id: eventId });
  }

  // Admin methods
  static async adminListItems(
    tableName: string,
    networkId: number,
    auth: string,
    filter?: any,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ) {
    return this.makeRequest('ADMIN_LIST_ITEMS', {
      auth,
      table_name: tableName,
      network_id: networkId,
      filter: filter || {},
      sort_by: sortBy,
      sort_order: sortOrder || 'desc'
    });
  }

  static async adminUpdateItem(
    tableName: string,
    networkId: number,
    auth: string,
    itemData: any
  ) {
    return this.makeRequest('ADMIN_UPDATE_ITEM', {
      auth,
      table_name: tableName,
      network_id: networkId,
      item_data: itemData
    });
  }

  static async adminDeleteItem(
    tableName: string,
    networkId: number,
    auth: string,
    itemId: string
  ) {
    return this.makeRequest('ADMIN_DELETE_ITEM', {
      auth,
      table_name: tableName,
      network_id: networkId,
      item_id: itemId
    });
  }
}