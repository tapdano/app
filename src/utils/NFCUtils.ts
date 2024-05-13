import { Storage } from '@ionic/storage';

let globalNdefReader: any;
let globalNdefReadHandler: any;

export const accessNFCTag = async (content?: string) => {
  return new Promise(async (resolve, reject) => {
    try {
      const hostname = new URL(location.href).hostname;
      const isLocal = (hostname == 'localhost') || (hostname == '192.168.15.77');
      
      if (!("NDEFReader" in window)) {
        const storage = new Storage();
        await storage.create();
        
        if (isLocal) {
          if (content === undefined) { // Read operation
            setTimeout(async () => {
              resolve(await storage.get('FAKE_TAG'));
            }, 500);
          } else { // Write operation
            setTimeout(async () => {
              await storage.set('FAKE_TAG', content);
              resolve(true);
            }, 500);
          }
          return;
        } else {
          reject("Sorry, NFC is not supported on your device.");
          return;
        }
      }

      globalNdefReader = new (window.NDEFReader as any)();
      globalNdefReadHandler = async (event: any) => {
        if (content === undefined) { // Read operation
          let readContent = null;
          if (event.message.records.length > 0) {
            if (event.message.records[0].recordType === "text") {
              const textDecoder = new TextDecoder(event.message.records[0].encoding);
              readContent = textDecoder.decode(event.message.records[0].data);
            }
            if (event.message.records[0].recordType === "unknown") {
              alert(dataViewToHexString(event.message.records[0].data));
            }
          }
          resolve(readContent);
        } else { // Write operation
          if (event.message.records.length > 0) {
            if (!confirm("Warning: This tag is not empty!\nAre you sure you want to overwrite its content?")) return;
          }
          //await globalNdefReader.write(content);
          await globalNdefReader.write({
            records: [{ recordType: "unknown", data: hexStringToArrayBuffer("000102030405060708090A") }],
          });
          resolve(true);
        }
        globalNdefReader.removeEventListener("reading", globalNdefReadHandler);
      };

      globalNdefReader.addEventListener("reading", globalNdefReadHandler);
      await globalNdefReader.scan();
    } catch (error) {
      reject(error);
    }
  });
}

export const cancelNFCTagReading = () => {
  if (globalNdefReader) {
    globalNdefReader.removeEventListener("reading", globalNdefReadHandler);
    globalNdefReader = null;
    globalNdefReadHandler = null;
  }
};

function hexStringToArrayBuffer(hexString: string) {
  const byteArray = Uint8Array.from(
    { length: hexString.length / 2 },
    (_, i) => parseInt(hexString.substr(i * 2, 2), 16)
  );
  return byteArray.buffer;
};

function dataViewToHexString(dataView: DataView) {
  let hexString = '';
  for (let i = 0; i < dataView.byteLength; i++) {
    const byte = dataView.getUint8(i);
    hexString += byte.toString(16).padStart(2, '0');
  }
  return hexString;
};