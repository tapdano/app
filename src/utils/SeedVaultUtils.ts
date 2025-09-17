import { getDevMode } from '@/utils/StorageUtils';
import { Storage } from '@ionic/storage';

export async function getSeedVaultApiUrl(): Promise<string> {
  const isDevMode = await getDevMode();
  const lambdaId_dev = 'usi2s5r5jg';
  const lambdaId_prod = 'ywt68ywcs1';
  const useProdLambda = !isDevMode;
  return 'https://' + (useProdLambda ? lambdaId_prod : lambdaId_dev) + '.execute-api.sa-east-1.amazonaws.com/action';
}

export async function saveSeedVaultTag({ key, tagId }: { key: string, tagId: string }) {
  const storage = new Storage();
  await storage.create();
  let svTags = await storage.get('sv_tags');
  svTags = Array.isArray(svTags) ? svTags : [];
  let idx = svTags.findIndex((t: any) => t.id === tagId);
  if (idx === -1) {
    svTags.push({ id: tagId, seedVaultKey: key });
    idx = svTags.length - 1;
  }
  await storage.set('sv_tags', svTags);
  await storage.set('currentSVTagIndex', idx);
}