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
export class WebAuthnService {
    constructor() {
        this.MAX_TRIES = 3;
        this.TRIES = 0;
        this._resolve = undefined;
        this._reject = undefined;
        this.isCanceled = false;
        this.execWebAuthN = () => __awaiter(this, void 0, void 0, function* () {
            try {
                const ret = yield navigator.credentials.get({
                    publicKey: {
                        allowCredentials: [{
                                id: hexStringToArrayBuffer(this._command).buffer,
                                type: "public-key",
                                transports: ["nfc"]
                            }],
                        challenge: crypto.getRandomValues(new Uint8Array(32)),
                        rpId: window.location.hostname,
                        userVerification: "discouraged",
                        timeout: 60000
                    }
                });
                if (this.isCanceled)
                    return;
                this._resolve && this._resolve(new TagParser(arrayBufferToHex(ret.response.signature)));
            }
            catch (e) {
                if (this.isCanceled)
                    return;
                this.TRIES++;
                if (this.TRIES >= this.MAX_TRIES) {
                    this._reject && this._reject(e);
                }
                else {
                    this.execWebAuthN();
                }
            }
        });
    }
    executeCommand() {
        return __awaiter(this, arguments, void 0, function* (command = '0000') {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this._resolve = resolve;
                this._reject = reject;
                this.isCanceled = false;
                this._command = command;
                this.TRIES = 0;
                this.execWebAuthN();
            }));
        });
    }
    cancel() {
        this.isCanceled = true;
        this._reject && this._reject('canceled');
    }
}
