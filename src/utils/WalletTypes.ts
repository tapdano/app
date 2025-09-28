export interface WalletType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const WALLET_TYPES: WalletType[] = [
  {
    id: '1',
    name: 'Cardano',
    icon: '🔵',
    color: '#0033AD'
  },
  {
    id: '2',
    name: 'Ethereum',
    icon: '🔷',
    color: '#627EEA'
  },
  {
    id: '3',
    name: 'Solana',
    icon: '🟣',
    color: '#9945FF'
  },
  {
    id: '4',
    name: 'Bitcoin',
    icon: '🟠',
    color: '#F7931A'
  },
  {
    id: '5',
    name: 'Polkadot',
    icon: '🟡',
    color: '#E6007A'
  },
  {
    id: '6',
    name: 'Cosmos',
    icon: '🌌',
    color: '#2E3148'
  },
  {
    id: '7',
    name: 'Algorand',
    icon: '🔺',
    color: '#000000'
  },
  {
    id: '8',
    name: 'Tezos',
    icon: '🔸',
    color: '#2C7DF7'
  },
  {
    id: '9',
    name: 'Avalanche',
    icon: '❄️',
    color: '#E84142'
  },
  {
    id: '10',
    name: 'Midnight',
    icon: '🌙',
    color: '#1A1A1A'
  }
];

export function getWalletTypeById(id: string): WalletType | undefined {
  return WALLET_TYPES.find(type => type.id === id);
}

export function getWalletTypeIcon(id: string): string {
  const walletType = getWalletTypeById(id);
  return walletType ? walletType.icon : '❓';
}

export function getWalletTypeName(id: string): string {
  const walletType = getWalletTypeById(id);
  return walletType ? walletType.name : 'Unknown';
}

export function getWalletTypeColor(id: string): string {
  const walletType = getWalletTypeById(id);
  return walletType ? walletType.color : '#666666';
}
