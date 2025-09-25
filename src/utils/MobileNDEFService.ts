import { stringToArray } from "./StringUtils";

declare const nfc: any;
declare const ndef: any;

export interface SVTag {
  id: string;
  labels: string[];
  secrets: string[];
}

export class MobileNDEFService {
  private MAX_TRIES = 10;
  private TRIES = 0;
  private _isWrite: boolean = false;
  private _forceWrite: boolean = false;
  private _tag_id: string | undefined = undefined;
  private _tag_labels: string[] | undefined = undefined;
  private _tag_secrets: string[] | undefined = undefined;
  private _resolve: ((value: any) => void) | undefined = undefined;
  private _reject: ((reason?: any) => void) | undefined = undefined;
  private isCanceled = false;
  private ndefListenerCallback: ((nfcEvent: any) => void) | undefined = undefined;
  private isIOS: boolean = false;

  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  async read(): Promise<SVTag> {
    this._isWrite = false;
    return this.initializeAndExecute();
  }

  async write(id: string, labels: string[], secrets: string[], forceWrite: boolean = false): Promise<void> {
    this._isWrite = true;
    this._forceWrite = forceWrite;
    this._tag_id = id;
    this._tag_labels = labels;
    this._tag_secrets = secrets;
    return this.initializeAndExecute();
  }

  cancel() {
    this.isCanceled = true;
    if (this.isIOS) {
      nfc.cancelScan();
    } else {
      this.stopScan();
    }
    this._reject && this._reject('canceled');
  }

  private async readIOS() {
    try {
      console.log("Starting iOS NFC read");
      const nfcEvent = await nfc.scanNdef();
      console.log("NFC tag detected", nfcEvent);
      const tag = this.parseNdefContent(nfcEvent);
      this._resolve && this._resolve(tag);
    } catch (error) {
      console.log('NFC error', error);
      this._reject && this._reject(error);
    }
  }

  private async writeIOS(): Promise<void> {
    if (this.isCanceled) throw new Error('canceled');
    
    const data = {
      id: this._tag_id,
      labels: this._tag_labels,
      secrets: this._tag_secrets
    };
    const message = [
      ndef.record(ndef.TNF_UNKNOWN, [], [], stringToArray(JSON.stringify(data)))
    ];
    
    try {
      nfc.write(message, () => {
        console.log("Write success");
        this._resolve && this._resolve(undefined);
      }, (error: any) => {
        console.log("Write failed", error);
        if (this.isCanceled) return;
        this.TRIES++;
        if (this.TRIES >= this.MAX_TRIES) {
          this._reject && this._reject(error);
        } else {
          this.startScan();
        }
      });
    } catch (error) {
      this._reject && this._reject(error);
    }
  }

  private parseNdefContent(nfcEvent: any): SVTag {
    let readContent: string = '';
    
    let ndefMessage = null;
    if (this.isIOS) {
      ndefMessage = nfcEvent.ndefMessage || (nfcEvent.tag && nfcEvent.tag.ndefMessage);
    } else {
      ndefMessage = nfcEvent.tag && nfcEvent.tag.ndefMessage;
    }
    
    const record = ndefMessage && ndefMessage[0];
    if (record) {
      const bytes = new Uint8Array(record.payload);
      readContent = Array.from(bytes).map(byte => String.fromCharCode(byte)).join('');
    }
    
    let tag: SVTag = {
      id: '',
      labels: [],
      secrets: []
    };

    try {
      const parsedData = JSON.parse(readContent);
      if (parsedData && typeof parsedData === 'object') {
        tag.id = parsedData.id || '';
        tag.labels = Array.isArray(parsedData.labels) ? parsedData.labels : [];
        tag.secrets = Array.isArray(parsedData.secrets) ? parsedData.secrets : [];
      }
    } catch (parseError) {
      console.log('Failed to parse tag', parseError);
      throw new Error('Failed to parse tag');
    }

    return tag;
  }

  private async initializeAndExecute(): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this._resolve = resolve;
        this._reject = reject;
        this.isCanceled = false;
        this.TRIES = 0;
        if (this.isIOS) {
          if (this._isWrite) {
            this.writeIOS();
          } else {
            this.readIOS();
          }
        } else {
          this.startScan();
        }
      } catch (error) {
        if (!this.isIOS) {
          this.stopScan();
        }
        reject(error);
      }
    });
  }

  private ndefWriteListener = async (nfcEvent: any) => {
    try {
      let currentTag = null;
      try {
        currentTag = this.parseNdefContent(nfcEvent);
      } catch (e) {
        currentTag = { id: '', labels: [], secrets: [] };
      }
      
      if (!this._forceWrite && currentTag.id && currentTag.id !== this._tag_id) {
        console.log(`Tag ID mismatch. Current: ${currentTag.id}, Expected: ${this._tag_id}. Use forceWrite=true to override.`);
        this._reject && this._reject(new Error(`Tag ID mismatch. Current: ${currentTag.id}, Expected: ${this._tag_id}. Use forceWrite=true to override.`));
        return;
      }
      
      const data = {
        id: this._tag_id,
        labels: this._tag_labels,
        secrets: this._tag_secrets
      };
      const message = [
        ndef.record(ndef.TNF_UNKNOWN, [], [], stringToArray(JSON.stringify(data)))
      ];
      
      nfc.write(message, () => {
        console.log("Write success");
        this._resolve && this._resolve(undefined);
      }, (error: any) => {
        console.log("Write failed", error);
        if (this.isCanceled) return;
        this.TRIES++;
        if (this.TRIES >= this.MAX_TRIES) {
          this._reject && this._reject(error);
        } else {
          this.startScan();
        }
      });
      
      if (this.isCanceled) return;
      this.stopScan();
    } catch (error) {
      console.log("Error during write validation", error);
      this._reject && this._reject(error);
    }
  };

  private ndefReadListener = async (nfcEvent: any) => {
    try {
      console.log('NFC tag detected', nfcEvent);
      const tag = this.parseNdefContent(nfcEvent);
      if (this.isCanceled) return;
      this.stopScan();
      this._resolve && this._resolve(tag);
    } catch (error) {
      console.log('NFC error', error);
      if (this.isCanceled) return;
      this.TRIES++;
      if (this.TRIES >= this.MAX_TRIES) {
        this.stopScan();
        this._reject && this._reject(error);
      }
    }
  };

  private startScan = () => {
    this.stopScan();
    if (this._isWrite) {
      this.ndefListenerCallback = this.ndefWriteListener.bind(this);
    } else {
      this.ndefListenerCallback = this.ndefReadListener.bind(this);
    }
    nfc.addNdefListener(this.ndefListenerCallback);
  };

  private stopScan = () => {
    if (this.ndefListenerCallback) {
      nfc.removeNdefListener(this.ndefListenerCallback);
    }
  };
}