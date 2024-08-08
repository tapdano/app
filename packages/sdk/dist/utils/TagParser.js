import nacl from 'tweetnacl';
export class TagParser {
    constructor(input) {
        this.TagID = input.slice(0, 4);
        this.TagVersion = input.slice(4, 8);
        this.Burned = input.slice(8, 10) === "01";
        if (this.Burned) {
            this.Type = this.parseType(input.slice(10, 12));
            this.ExtractLocked = input.slice(12, 14) === "01";
            this.PinLocked = input.slice(14, 16) === "01";
            if (this.Type == "extractable" && !this.ExtractLocked && !this.PinLocked) {
                this.PrivateKey = input.slice(16, 80).toUpperCase();
                this.PublicKey = this.calculatePublicKey(this.PrivateKey).toUpperCase();
            }
            else {
                this.PublicKey = input.slice(16, 80).toUpperCase();
            }
            this.PolicyId = input.slice(80, 136).toUpperCase();
            if (!this.PinLocked) {
                this.TwoFactorKey = input.slice(136, 200).toUpperCase();
                this.LastSignature = input.slice(200, 328).toUpperCase();
            }
        }
    }
    parseType(type) {
        switch (type) {
            case "01":
                return "soulbound";
            case "02":
                return "extractable";
            default:
                return undefined;
        }
    }
    hexToBytes(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }
    calculatePublicKey(privateKey) {
        const privateKeyBytes = this.hexToBytes(privateKey);
        const keyPair = nacl.sign.keyPair.fromSeed(privateKeyBytes);
        return Buffer.from(keyPair.publicKey).toString('hex');
    }
}
