type TagType = "soulbound" | "extractable";
export declare class TagParser {
    TagID: string;
    TagVersion: string;
    Burned: boolean;
    Type?: TagType;
    ExtractLocked?: boolean;
    PinLocked?: boolean;
    PublicKey?: string;
    PrivateKey?: string;
    PolicyId?: string;
    TwoFactorKey?: string;
    LastSignature?: string;
    constructor(input: string);
    private parseType;
    private hexToBytes;
    private calculatePublicKey;
}
export {};
