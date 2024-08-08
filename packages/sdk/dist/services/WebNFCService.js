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
        this.ndefReader = null;
        this.readHandler = null;
    }
    executeCommand(command) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                var _a, _b;
                try {
                    if (!('NDEFReader' in window)) {
                        throw new Error('NDEFReader is not supported on this device');
                    }
                    this.ndefReader = new NDEFReader();
                    let isFirstRead = (command != undefined);
                    this.readHandler = (event) => __awaiter(this, void 0, void 0, function* () {
                        var _a, _b, _c, _d, _e;
                        if (isFirstRead) {
                            yield ((_a = this.ndefReader) === null || _a === void 0 ? void 0 : _a.write({
                                records: [{ recordType: "unknown", data: hexStringToArrayBuffer(command) }],
                            }));
                            isFirstRead = false;
                            this.cancelReading();
                            this.ndefReader = new NDEFReader();
                            (_b = this.ndefReader) === null || _b === void 0 ? void 0 : _b.addEventListener("reading", this.readHandler);
                            yield ((_c = this.ndefReader) === null || _c === void 0 ? void 0 : _c.scan());
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
                                readContent = ((_d = record.data) === null || _d === void 0 ? void 0 : _d.buffer) ? arrayBufferToHex((_e = record.data) === null || _e === void 0 ? void 0 : _e.buffer) : '';
                            }
                        }
                        this.cancelReading();
                        resolve(new TagParser(readContent));
                    });
                    (_a = this.ndefReader) === null || _a === void 0 ? void 0 : _a.addEventListener("reading", this.readHandler);
                    yield ((_b = this.ndefReader) === null || _b === void 0 ? void 0 : _b.scan());
                }
                catch (error) {
                    alert(error);
                    this.cancelReading();
                    reject(error);
                }
            }));
        });
    }
    cancelReading() {
        if (this.ndefReader && this.readHandler) {
            this.ndefReader.removeEventListener("reading", this.readHandler);
            this.ndefReader = null;
        }
    }
}
