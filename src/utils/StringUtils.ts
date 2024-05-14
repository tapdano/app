export function hexStringToArrayBuffer(hexString: string) {
  const byteArray = Uint8Array.from(
    { length: hexString.length / 2 },
    (_, i) => parseInt(hexString.substr(i * 2, 2), 16)
  );
  return byteArray.buffer;
}

export function dataViewToHexString(dataView: DataView) {
  let hexString = '';
  for (let i = 0; i < dataView.byteLength; i++) {
    const byte = dataView.getUint8(i);
    hexString += byte.toString(16).padStart(2, '0');
  }
  return hexString;
}