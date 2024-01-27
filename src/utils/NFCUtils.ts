import { Storage } from '@ionic/storage';

export const WriteNFCTag = async (content: string) => {
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

      const ndef = new (window.NDEFReader as any)();
      await ndef.scan();

      const ndefReadHandler = async (event: any) => {
        if (event.message.records.length > 0) {
          if (!confirm("Warning: This tag is not empty!\nAre you sure you want to overwrite its content?")) return;
        }
        await ndef.write(content);
        ndef.removeEventListener("reading", ndefReadHandler);
        resolve();
      };

      ndef.addEventListener("reading", ndefReadHandler);
    } catch (error) {
      reject(error);
    }
  });
}