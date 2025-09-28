import { stringToArray } from "./StringUtils";

declare const nfc: any;
declare const ndef: any;
declare const msgpack: {
  encode(data: any): Uint8Array;
  decode(data: Uint8Array): any;
};

export interface SVTag {
  id: string;
  labels: string[];
  secrets: string[];
  chains: string[];
}

type OperationType = 'read' | 'readWrite';

export class MobileNDEFService {
  private _forceWrite: boolean = false;
  private _tag_id: string | undefined = undefined;
  private _dataUpdateCallback: ((currentTag: SVTag) => SVTag) | undefined = undefined;
  private _resolve: ((value: any) => void) | undefined = undefined;
  private _reject: ((reason?: any) => void) | undefined = undefined;
  private isCanceled = false;
  private ndefListenerCallback: ((nfcEvent: any) => void) | undefined = undefined;
  private isIOS: boolean = false;
  private useEncode: boolean = true;

  constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  async read(): Promise<SVTag> {
    return this.executeOperation('read');
  }

  async readAndWrite(
    expectedId: string, 
    forceWrite: boolean = false,
    dataUpdateCallback: (currentTag: SVTag) => SVTag
  ): Promise<SVTag> {
    this._forceWrite = forceWrite;
    this._tag_id = expectedId;
    this._dataUpdateCallback = dataUpdateCallback;
    return this.executeOperation('readWrite');
  }

  cancel() {
    this.isCanceled = true;
    this.stopScan();
    this._reject && this._reject('canceled');
  }

  private async executeOperation(operation: OperationType): Promise<any> {
    return new Promise<any>(async (resolve, reject) => {
      try {
        this._resolve = resolve;
        this._reject = reject;
        this.isCanceled = false;
        await this.startScan(operation);
      } catch (error) {
        this.stopScan();
        reject(error);
      }
    });
  }

  private async processNFCOperation(nfcEvent: any, operation: OperationType): Promise<void> {
    try {
      if (this.isCanceled) return;

      let currentTag: SVTag | null = null;
      if ((operation === 'read') || ((operation === 'readWrite') && !this._forceWrite)) {
        currentTag = this.parseNdefContent(nfcEvent);
      }

      if ((operation === 'readWrite') && !this._forceWrite) {
        if (currentTag!.id !== this._tag_id) {
          this._reject && this._reject(new Error(`Warning: Incorrect tag. Use the tag with ID ${this._tag_id}.`));
          return;
        }
      }

      if (operation === 'read') {
        this.stopScan();
        this._resolve && this._resolve(currentTag);
        return;
      }

      let data = this._dataUpdateCallback!(currentTag!) as any;
      if (this.useEncode) {
        data = Array.from(msgpack.encode(data));
      } else {
        data = stringToArray(JSON.stringify(data));
      }
      const message = [
        ndef.record(ndef.TNF_UNKNOWN, [], [], data)
      ];
      nfc.write(message, () => {
        this.stopScan();
        this._resolve && this._resolve(undefined);
      }, (error: any) => {
        this.stopScan();
        this._reject && this._reject(error);
      });

    } catch (error) {
      this.stopScan();
      this._reject && this._reject(error);
    }
  }

  private startScan = async (operation: OperationType) => {
    try {
      this.stopScan();
      if (this.isIOS) {
        const keepSessionOpen = operation === 'readWrite';
        const nfcEvent = await nfc.scanNdef({ keepSessionOpen });
        await this.processNFCOperation(nfcEvent, operation);
      } else {
        this.ndefListenerCallback = async (nfcEvent: any) => {
          await this.processNFCOperation(nfcEvent, operation);
        };
        nfc.addNdefListener(this.ndefListenerCallback);
      }
    } catch (error) {
      this._reject && this._reject(error);
    }
  };

  private stopScan = () => {
    if (this.isIOS) {
      nfc.cancelScan();
    } else {
      if (this.ndefListenerCallback) {
        nfc.removeNdefListener(this.ndefListenerCallback);
      }
    }    
  };

  private parseNdefContent(nfcEvent: any): SVTag {
    try {
      let ndefMessage = null;
      if (this.isIOS) {
        ndefMessage = nfcEvent.ndefMessage || (nfcEvent.tag && nfcEvent.tag.ndefMessage);
      } else {
        ndefMessage = nfcEvent.tag && nfcEvent.tag.ndefMessage;
      }
      const bytes = new Uint8Array(ndefMessage[0].payload);
      let decodedData = null;
      if (this.useEncode) {
        decodedData = msgpack.decode(bytes);
      } else {
        decodedData = JSON.parse(Array.from(bytes).map(byte => String.fromCharCode(byte)).join(''));
      }
      return decodedData;
    } catch (parseError) {
      throw new Error('Failed to parse tag');
    }
  }  
}