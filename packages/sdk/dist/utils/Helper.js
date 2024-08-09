import nacl from 'tweetnacl';
export function hexStringToArrayBuffer(hex) {
    return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}
export function arrayBufferToHex(arrayBuffer) {
    return Array.from(new Uint8Array(arrayBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}
export function intToHexString(num) {
    return num.toString(16).padStart(2, '0').toUpperCase();
}
export function calculatePublicKey(privateKey) {
    const privateKeyBytes = hexStringToArrayBuffer(privateKey);
    const keyPair = nacl.sign.keyPair.fromSeed(privateKeyBytes);
    return Buffer.from(keyPair.publicKey).toString('hex');
}
