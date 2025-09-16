import { getDevMode } from '@/utils/StorageUtils';

export async function getSeedVaultApiUrl(): Promise<string> {
  const isDevMode = await getDevMode();
  const lambdaId_dev = 'usi2s5r5jg';
  const lambdaId_prod = 'ywt68ywcs1';
  const useProdLambda = !isDevMode;
  return 'https://' + (useProdLambda ? lambdaId_prod : lambdaId_dev) + '.execute-api.sa-east-1.amazonaws.com/action';
}