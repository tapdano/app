import nacl from 'tweetnacl';

type TagType = "soulbound" | "extractable";

export class TagParser {
  TagID: string;
  TagVersion: string;
  Burned: boolean;
  Type?: TagType;
  ExtractLocked?: boolean;
  PinLocked?: boolean;
  PublicKey?: string;
  PrivateKey?: string;
  TwoFactorKey?: string;
  LastSignature?: string;

  constructor(input: string) {
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
      } else {
        this.PublicKey = input.slice(16, 80).toUpperCase();
      }
      if (!this.PinLocked) {
        this.TwoFactorKey = input.slice(80, 144).toUpperCase();
        this.LastSignature = input.slice(144, 272).toUpperCase();
      }
    }
  }

  private parseType(type: string): TagType | undefined {
    switch (type) {
      case "01":
        return "soulbound";
      case "02":
        return "extractable";
      default:
        return undefined;
    }
  }

  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  private calculatePublicKey(privateKey: string): string {
    const privateKeyBytes = this.hexToBytes(privateKey);
    const keyPair = nacl.sign.keyPair.fromSeed(privateKeyBytes);
    return Buffer.from(keyPair.publicKey).toString('hex');
  }
}