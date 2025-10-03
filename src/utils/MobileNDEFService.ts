import { stringToArray } from "./StringUtils";

declare const nfc: any;
declare const ndef: any;
declare const msgpack: {
  encode(data: any): Uint8Array;
  decode(data: Uint8Array): any;
};

export interface SVTag {
  physicalId: string;
  data: {
    id: string;
    labels: string[];
    secrets: string[];
    chains: string[];
  }
}

type OperationType = 'read' | 'readWrite';

export class MobileNDEFService {
  private static instance: MobileNDEFService | null = null;
  private _expectedPhysicalId: string | undefined = undefined;
  private _dataUpdateCallback: ((currentTag: SVTag) => SVTag) | undefined = undefined;
  private _resolve: ((value: any) => void) | undefined = undefined;
  private _reject: ((reason?: any) => void) | undefined = undefined;
  private isCanceled = false;
  private ndefListenerCallback: ((nfcEvent: any) => void) | undefined = undefined;
  private activeOperationCallback: ((nfcEvent: any) => void) | undefined = undefined;
  private isIOS: boolean = false;
  private useEncode: boolean = true;
  private isAndroidSessionActive: boolean = false;

  private constructor() {
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  public static getInstance(): MobileNDEFService {
    if (!MobileNDEFService.instance) {
      MobileNDEFService.instance = new MobileNDEFService();
    }
    return MobileNDEFService.instance;
  }

  public async initializeAndroidSession(): Promise<void> {
    if (!this.isIOS && !this.isAndroidSessionActive) {
      try {
        this.ndefListenerCallback = (nfcEvent: any) => {
          if (this.activeOperationCallback) {
            this.activeOperationCallback(nfcEvent);
          }
        };
        nfc.addNdefListener(this.ndefListenerCallback);
        this.isAndroidSessionActive = true;
        console.log('Android NFC session initialized and active');
      } catch (error) {
        console.error('Failed to initialize Android NFC session:', error);
      }
    }
  }

  public destroyAndroidSession(): void {
    if (!this.isIOS && this.isAndroidSessionActive && this.ndefListenerCallback) {
      try {
        nfc.removeNdefListener(this.ndefListenerCallback);
        this.isAndroidSessionActive = false;
        this.ndefListenerCallback = undefined;
        this.activeOperationCallback = undefined;
        console.log('Android NFC session destroyed');
      } catch (error) {
        console.error('Failed to destroy Android NFC session:', error);
      }
    }
  }

  async read(): Promise<SVTag> {
    this._expectedPhysicalId = undefined;
    this._dataUpdateCallback = undefined;
    return this.executeOperation('read');
  }

  async readAndWrite(
    expectedPhysicalId: string | null, 
    dataUpdateCallback: (currentTag: SVTag) => SVTag
  ): Promise<SVTag> {
    this._expectedPhysicalId = expectedPhysicalId || undefined;
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

      let currentTag = this.parseNdefContent(nfcEvent);

      if (this._expectedPhysicalId && (currentTag!.physicalId != this._expectedPhysicalId)) {
        this._reject && this._reject(new Error(`Warning: Incorrect tag. Use the tag with ID ${this._expectedPhysicalId}.`));
        return;
      }

      if (this._dataUpdateCallback) {
        const updatedTag = this._dataUpdateCallback(currentTag!);
        let data = null;
        if (this.useEncode) {
          data = Array.from(msgpack.encode(updatedTag.data)) as any;
        } else {
          data = stringToArray(JSON.stringify(updatedTag.data)) as any;
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
      } else {
        this.stopScan();
        this._resolve && this._resolve(currentTag);
      }

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
        const nfcEvent = await nfc.scanTag({ keepSessionOpen });
        await this.processNFCOperation(nfcEvent, operation);
      } else {
        this.activeOperationCallback = async (nfcEvent: any) => {
          await this.processNFCOperation(nfcEvent, operation);
        };
      }
    } catch (error) {
      this._reject && this._reject(error);
    }
  };

  private stopScan = () => {
    if (this.isIOS) {
      nfc.cancelScan();
    } else {
      this.activeOperationCallback = undefined;
    }    
  };

  private extractPhysicalId(nfcEvent: any): string {
    try {
      let idBytes: number[] | null = null;
      if (this.isIOS) {
        idBytes = nfcEvent.id || (nfcEvent.tag && nfcEvent.tag.id);
      } else {
        idBytes = nfcEvent.tag && nfcEvent.tag.id;
      }
      if (idBytes && idBytes.length > 0) {
        const rawId = nfc.bytesToHexString(idBytes);
        return rawId.toUpperCase().match(/.{1,2}/g)?.join(':') || rawId.toUpperCase();
      }
      throw new Error('Tag ID not available.');
    } catch (error) {
      console.error('Error extracting Tag ID:', error);
      throw new Error('Error extracting Tag ID.');
    }
  }

  private parseNdefContent(nfcEvent: any): SVTag {
    try {
      const physicalId = this.extractPhysicalId(nfcEvent);
      
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
      
      return {
        physicalId: physicalId,
        data: decodedData,
      };
    } catch (parseError) {
      throw new Error('Failed to parse tag. ' + parseError);
    }
  }  
}