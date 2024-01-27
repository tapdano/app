import { Storage } from '@ionic/storage';

let globalNdefReader: any;
let globalNdefReadHandler: any;

export const writeNFCTag = async (content: string) => {
  return new Promise<void>(async (resolve, reject) => {
    try {
      const hostname = new URL(location.href).hostname;
      const isLocal = (hostname == 'localhost') || (hostname == '192.168.15.77');
      
      if (!("NDEFReader" in window)) {
        if (isLocal) {
          setTimeout(async () => {
            const storage = new Storage();
            storage.create();
            await storage.set('FAKE_TAG', content);
            resolve();
          }, 500);
          return;
        } else {
          reject("Sorry, NFC is not supported in your device.");
          return;
        }
      }

      globalNdefReader = new (window.NDEFReader as any)();

      globalNdefReadHandler = async (event: any) => {
        if (event.message.records.length > 0) {
          if (!confirm("Warning: This tag is not empty!\nAre you sure you want to overwrite its content?")) return;
        }
        await globalNdefReader.write(content);
        globalNdefReader.removeEventListener("reading", globalNdefReadHandler);
        resolve();
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