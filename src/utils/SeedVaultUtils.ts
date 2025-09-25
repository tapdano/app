import { getDevMode, getHomologAPI } from '@/utils/StorageUtils';
import { Storage } from '@ionic/storage';

export async function getSeedVaultApiUrl(): Promise<string> {
  const isDevMode = await getDevMode();
  const isHomologAPI = await getHomologAPI();
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
    seedVaultKey: tag.seedVaultKey,
    labels: Array.isArray(tag.labels) ? [...tag.labels] : [],
    multipleWalletsEnabled: tag.multipleWalletsEnabled === true,
  }));
}

export async function saveSeedVaultTag({ key, tagId, labels }: { key: string, tagId: string, labels?: string[] }) {
  const storage = new Storage();
  await storage.create();
  let svTags = await storage.get('sv_tags');
  svTags = Array.isArray(svTags) ? svTags : [];
  
  svTags = ensureSerializableTags(svTags);
  
  let idx = svTags.findIndex((t: any) => t.id === tagId);
  if (idx === -1) {
    svTags.push({ 
      id: tagId, 
      seedVaultKey: key, 
      labels: labels ? [...labels] : [],
      multipleWalletsEnabled: false
    });
    idx = svTags.length - 1;
  } else {
    svTags[idx].seedVaultKey = key;
    if (labels) {
      svTags[idx].labels = [...labels];
    }
    // Preserve existing multipleWalletsEnabled setting or default to false
    if (svTags[idx].multipleWalletsEnabled === undefined) {
      svTags[idx].multipleWalletsEnabled = false;
    }
  }
  
  await storage.set('sv_tags', svTags);
  await storage.set('currentSVTagIndex', idx);
}