export function hexStringToArrayBuffer(hex: string): ArrayBuffer {
  return new Uint8Array(hex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))).buffer;
}

export function arrayBufferToHex(arrayBuffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(arrayBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}