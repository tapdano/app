//generate a 256-bit AES-GCM key
export async function generateKey() {
  return await window.crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true, //extractable key
    ["encrypt", "decrypt"]
  );
}

//export key
export async function exportKey(key: CryptoKey) {
  const exportedKey = await window.crypto.subtle.exportKey(
    "raw",
    key
  );
  return new Uint8Array(exportedKey);
}

//import key
export async function importKey(rawKey: BufferSource) {
  const key = await window.crypto.subtle.importKey(
    "raw",
    rawKey,
    {
      name: "AES-GCM",
    },
    true,
    ["encrypt", "decrypt"]
  );
  return key;
}

//encrypt using AES-GCM
export async function encryptText(plainText: string, key: CryptoKey) {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = encoder.encode(plainText);

  const encryptedData = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encodedText
  );

  return {
    iv: iv,
    encryptedData: encryptedData,
  };
}

//decrypt using AES-GCM
export async function decryptText(encryptedData: BufferSource, iv: Uint8Array, key: CryptoKey) {
  const decryptedData = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encryptedData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}