export function utf8ToHex(str: any) {
  return Array.from(str).map((c: any) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

export async function calculateSHA256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);                          
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);         
  const hashArray = Array.from(new Uint8Array(hashBuffer));                     
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');  
  return hashHex;
}

export function serializeBigInt(obj: any) {
  return JSON.stringify(obj, (key, value) => {
      return typeof value === 'bigint' ? value.toString() + 'n' : value;
  });
}

export function deserializeBigInt(jsonStr: string) {
  return JSON.parse(jsonStr, (key, value) => {
      return typeof value === 'string' && value.endsWith('n') ? BigInt(value.slice(0, -1)) : value;
  });
}

export function formatIpfsUrl(url: string) {
  return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
}

export function hexToBase64(hexString: string) {
  const hex24 = hexString.slice(0, 48);
  let bytes = [];
  for (let i = 0; i < hex24.length; i += 2) {
    bytes.push(parseInt(hex24.substr(i, 2), 16));
  }
  let binary = '';
  bytes.forEach(byte => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}