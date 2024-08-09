var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { arrayBufferToHex, hexStringToArrayBuffer } from "../utils/Helper";
import { TagParser } from "../utils/TagParser";
export class WebNFCService {
    constructor() {
        this.MAX_TRIES = 10;
        this.TRIES = 0;
        this.ndefReader = null;
        this.isFirstRead = true;
        this._resolve = undefined;
        this._reject = undefined;
        this.isCanceled = false;
        this.readHandler = (event) => __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                if (this.isFirstRead) {
                    yield ((_a = this.ndefReader) === null || _a === void 0 ? void 0 : _a.write({
                        records: [{ recordType: "unknown", data: hexStringToArrayBuffer(this._command).buffer }],
                    }));
                    if (this.isCanceled)
                        return;
                    this.isFirstRead = false;
                    this.startScan();
                    return;
                }
                let readContent = '';
                if (event.message.records.length > 0) {
                    const record = event.message.records[0];
                    if (record.recordType === "text") {
                        const textDecoder = new TextDecoder(record.encoding);
                        readContent = textDecoder.decode(record.data);
                    }
                    else if (record.recordType === "unknown") {
                        readContent = ((_b = record.data) === null || _b === void 0 ? void 0 : _b.buffer) ? arrayBufferToHex((_c = record.data) === null || _c === void 0 ? void 0 : _c.buffer) : '';
                    }
                }
                if (this.isCanceled)
                    return;
                this.stopScan();
                this._resolve && this._resolve(new TagParser(readContent));
            }
            catch (error) {
                if (this.isCanceled)
                    return;
                this.TRIES++;
                if (this.TRIES >= this.MAX_TRIES) {
                    this.stopScan();
                    this._reject && this._reject(error);
                }
            }
        });
        this.startScan = () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            this.stopScan();
            this.ndefReader = new NDEFReader();
            (_a = this.ndefReader) === null || _a === void 0 ? void 0 : _a.addEventListener("reading", this.readHandler);
            yield ((_b = this.ndefReader) === null || _b === void 0 ? void 0 : _b.scan());
        });
        this.stopScan = () => __awaiter(this, void 0, void 0, function* () {
            if (this.ndefReader && this.readHandler) {
                this.ndefReader.removeEventListener("reading", this.readHandler);
            }
            if (this.ndefReader) {
                this.ndefReader = null;
            }
        });
    }
    executeCommand(command) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                try {
                    this._resolve = resolve;
                    this._reject = reject;
                    this.isCanceled = false;
                    this._command = command;
                    if (!('NDEFReader' in window)) {
                        throw new Error('NDEFReader is not supported on this device');
                    }
                    this.isFirstRead = (command != undefined);
                    this.TRIES = 0;
                    this.startScan();
                }
                catch (error) {
                    this.stopScan();
                    reject(error);
                }
            }));
        });
    }
    cancel() {
        this.isCanceled = true;
        this.stopScan();
        this._reject && this._reject('canceled');
    }
}
