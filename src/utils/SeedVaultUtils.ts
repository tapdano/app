import { AppConfigStorageService } from '@/utils/storage-services/AppConfigStorageService';

export async function getSeedVaultApiUrl(): Promise<string> {
  const appConfigService = new AppConfigStorageService();
  const isDevMode = await appConfigService.getDevMode();
  const isHomologAPI = await appConfigService.getHomologAPI();
  const lambdaId_dev = 'usi2s5r5jg';
  const lambdaId_prod = 'ywt68ywcs1';
  const useProdLambda = !(isDevMode && isHomologAPI);
  return 'https://' + (useProdLambda ? lambdaId_prod : lambdaId_dev) + '.execute-api.sa-east-1.amazonaws.com/action';
}

/**
 * Ensures an array of seed vault tags is serializable for IndexedDB storage
 * by creating plain objects with only serializable properties
 */
export function ensureSerializableTags(tags: any[]): any[] {
  return tags.map((tag: any) => ({
    id: tag.id,
    physicalId: tag.physicalId || undefined,
    seedVaultKey: tag.seedVaultKey,
    labels: Array.isArray(tag.labels) ? [...tag.labels] : [],
    chains: Array.isArray(tag.chains) ? [...tag.chains] : [],
    multipleWalletsEnabled: tag.multipleWalletsEnabled === true,
  }));
}