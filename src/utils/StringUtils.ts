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

export async function calculateSHA256FromHex(hexString: string): Promise<string> {
  const msgBuffer = new Uint8Array(hexString.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
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
  try {
    return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
  } catch (error) {
    return '';
  }
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

export function hexStringToArray(hex: string) {
  //@ts-ignore
  const tmpArray = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
  const result = [];
  for (let i = 0; i < tmpArray.length; i++) {
    result.push(tmpArray[i]);
  }
  return result;
};

export function arrayBufferToHex(arrayBuffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(arrayBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToString(hex: string): string {
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return result;
}

export function stringToArray(str: string): number[] {
  const result = [];
  for (let i = 0; i < str.length; i++) {
    result.push(str.charCodeAt(i));
  }
  return result;
}