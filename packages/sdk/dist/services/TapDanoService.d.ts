import { TagParser } from '../utils/TagParser';
type CommunicationMethod = 'auto' | 'WebNFC' | 'WebAuthn';
interface TapDanoServiceConfig {
    method: CommunicationMethod;
}
export declare class TapDanoService {
    private method;
    private NFCService;
    constructor(config?: TapDanoServiceConfig);
    readTag(): Promise<TagParser>;
    burnTag(action: 'new' | 'restore', type: 'soulbound' | 'extractable', privateKey?: string): Promise<TagParser>;
    signData(data: string): Promise<TagParser>;
    formatTag(): Promise<TagParser>;
    lockTag(): Promise<TagParser>;
    pinLock(pin: string): Promise<TagParser>;
    pinUnlock(pin: string): Promise<TagParser>;
    setPolicyId(policyId: string): Promise<TagParser>;
    executeRawCommand(command?: string): Promise<TagParser>;
    cancel(): void;
}
export {};
