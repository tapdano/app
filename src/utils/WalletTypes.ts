export interface WalletType {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const WALLET_TYPES: WalletType[] = [
  {
    id: 'cardano',
    name: 'Cardano',
    icon: '🔵',
    color: '#0033AD'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    icon: '🔷',
    color: '#627EEA'
  },
  {
    id: 'solana',
    name: 'Solana',
    icon: '🟣',
    color: '#9945FF'
  },
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    icon: '🟠',
    color: '#F7931A'
  },
  {
    id: 'polkadot',
    name: 'Polkadot',
    icon: '🟡',
    color: '#E6007A'
  },
  {
    id: 'cosmos',
    name: 'Cosmos',
    icon: '🌌',
    color: '#2E3148'
  },
  {
    id: 'algorand',
    name: 'Algorand',
    icon: '🔺',
    color: '#000000'
  },
  {
    id: 'tezos',
    name: 'Tezos',
    icon: '🔸',
    color: '#2C7DF7'
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    icon: '❄️',
    color: '#E84142'
  },
  {
    id: 'midnight',
    name: 'Midnight',
    icon: '🌙',
    color: '#1A1A1A'
  },
  {
    id: 'milkomeda',
    name: 'Milkomeda',
    icon: '🥛',
    color: '#FF6B35'
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
