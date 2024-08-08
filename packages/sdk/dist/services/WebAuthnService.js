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
        this.AUTHN_MAX_TRIES = 3;
        this.AUTHN_TRIES = 0;
    }
    executeCommand() {
        return __awaiter(this, arguments, void 0, function* (command = '0000') {
            this.AUTHN_TRIES = 0;
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const execWebAuthN = () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const ret = yield navigator.credentials.get({
                            publicKey: {
                                allowCredentials: [{
                                        id: hexStringToArrayBuffer(command),
                                        type: "public-key",
                                        transports: ["nfc"]
                                    }],
                                challenge: crypto.getRandomValues(new Uint8Array(32)),
                                rpId: window.location.hostname,
                                userVerification: "discouraged",
                                timeout: 60000
                            }
                        });
                        resolve(new TagParser(arrayBufferToHex(ret.response.signature)));
                    }
                    catch (e) {
                        console.error(e);
                        this.AUTHN_TRIES++;
                        if (this.AUTHN_TRIES === this.AUTHN_MAX_TRIES) {
                            reject(e);
                        }
                        else {
                            execWebAuthN();
                        }
                    }
                });
                execWebAuthN();
            }));
        });
    }
    cancelReading() {
    }
}
