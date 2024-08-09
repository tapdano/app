var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { WebNFCService } from './WebNFCService';
import { WebAuthnService } from './WebAuthnService';
import { calculatePublicKey, intToHexString } from '../utils/Helper';
export class TapDanoService {
    constructor(config) {
        this.method = (config === null || config === void 0 ? void 0 : config.method) || 'auto';
        if (this.method === 'auto') {
            this.method = 'NDEFReader' in window ? 'WebNFC' : 'WebAuthn';
        }
        this.NFCService = this.method === 'WebNFC' ? new WebNFCService() : new WebAuthnService();
    }
    readTag() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.NFCService.executeCommand();
        });
    }
    burnTag(action, type, privateKey) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = '00A10000';
            cmd += (action == 'new') ? '02' : '66'; //data length
            cmd += (action == 'new') ? '01' : '02'; //action
            if (type == 'soulbound')
                cmd += '01';
            if (type == 'extractable')
                cmd += '02';
            if (action === 'restore') {
                cmd += privateKey;
                cmd += calculatePublicKey(privateKey);
            }
            return this.NFCService.executeCommand(cmd);
        });
    }
    signData(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = '00A20000' + intToHexString(data.length / 2);
            cmd += data;
            return this.NFCService.executeCommand(cmd);
        });
    }
    formatTag() {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = '00A30000';
            return this.NFCService.executeCommand(cmd);
        });
    }
    lockTag() {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = '00A40000';
            return this.NFCService.executeCommand(cmd);
        });
    }
    pinLock(pin) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = '00A5000004';
            cmd += pin;
            return this.NFCService.executeCommand(cmd);
        });
    }
    pinUnlock(pin) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = '00A6000004';
            cmd += pin;
            return this.NFCService.executeCommand(cmd);
        });
    }
    setPolicyId(policyId) {
        return __awaiter(this, void 0, void 0, function* () {
            let cmd = '00A700001C';
            cmd += policyId;
            return this.NFCService.executeCommand(cmd);
        });
    }
    executeRawCommand(command) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.NFCService.executeCommand(command);
        });
    }
    cancel() {
        this.NFCService.cancel();
    }
}
