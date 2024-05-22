import type { AssetMetadata } from '@mesh/common/types';

export type AssetFull = {
  asset: string;
  policy_id: string;
  asset_name: string;
  fingerprint: string;
  quantity: string;
  initial_mint_tx_hash: string;
  mint_or_burn_count: number;
  onchain_metadata: AssetMetadata | null;
  onchain_metadata_standard: string | null;
  onchain_metadata_extra: any | null;
  metadata: any | null;
};