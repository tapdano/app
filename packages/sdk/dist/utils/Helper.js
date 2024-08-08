export function hexStringToArrayBuffer(hex) {
    return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16))).buffer;
}
export function arrayBufferToHex(arrayBuffer) {
    return Array.from(new Uint8Array(arrayBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
