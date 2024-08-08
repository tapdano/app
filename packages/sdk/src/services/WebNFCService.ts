import { arrayBufferToHex, hexStringToArrayBuffer } from "../utils/Helper";
import { TagParser } from "../utils/TagParser";

export class WebNFCService {
  private ndefReader: NDEFReader | null = null;
  private readHandler: ((event: NDEFReadingEvent) => Promise<void>) | null = null;

  async executeCommand(command?: string): Promise<TagParser> {
    return new Promise<TagParser>(async (resolve, reject) => {
      try {
        if (!('NDEFReader' in window)) {
          throw new Error('NDEFReader is not supported on this device');
        }
        this.ndefReader = new NDEFReader();
                
        let isFirstRead = (command != undefined);

        this.readHandler = async (event: NDEFReadingEvent) => {
          if (isFirstRead) {
            await this.ndefReader?.write({
              records: [{ recordType: "unknown", data: hexStringToArrayBuffer(command as string) }],
            });
            isFirstRead = false;
            this.cancelReading();
            this.ndefReader = new NDEFReader();
            this.ndefReader?.addEventListener("reading", this.readHandler as unknown as EventListenerOrEventListenerObject);
            await this.ndefReader?.scan();
            return;
          }

          let readContent: string = '';
          if (event.message.records.length > 0) {
            const record = event.message.records[0];
            if (record.recordType === "text") {
              const textDecoder = new TextDecoder(record.encoding);
              readContent = textDecoder.decode(record.data);
            } else if (record.recordType === "unknown") {
              readContent = record.data?.buffer ? arrayBufferToHex(record.data?.buffer) : '';
            }
          }

          this.cancelReading();
          resolve(new TagParser(readContent));
        };

        this.ndefReader?.addEventListener("reading", this.readHandler as unknown as EventListenerOrEventListenerObject);
        await this.ndefReader?.scan();
      } catch (error) {
        alert(error);
        this.cancelReading();
        reject(error);
      }
    });
  }

  cancelReading() {
    if (this.ndefReader && this.readHandler) {
      this.ndefReader.removeEventListener("reading", this.readHandler as unknown as EventListenerOrEventListenerObject);
      this.ndefReader = null;
    }
  }
}