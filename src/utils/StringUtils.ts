export function hexStringToArrayBuffer(hexString: string) {
  const byteArray = Uint8Array.from(
    { length: hexString.length / 2 },
    (_, i) => parseInt(hexString.substr(i * 2, 2), 16)
  );
  return byteArray.buffer;
}

export function bufferToHexString(byteArray: Buffer) {
  return Array.from(byteArray, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function utf8ToHex(str: any) {
  return Array.from(str).map((c: any) => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
}

export function toHex(byteArray: any) {
  return Array.from(byteArray, (byte: any) => byte.toString(16).padStart(2, '0')).join('');
}

export function intToHexString(num: Number) {
  return num.toString(16).padStart(2, '0').toUpperCase();
}

export function dataViewToHexString(dataView: DataView): string {
  let hexString = '';
  for (let i = 0; i < dataView.byteLength; i++) {
    const byte = dataView.getUint8(i);
    hexString += byte.toString(16).padStart(2, '0');
  }
  return hexString;
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
};