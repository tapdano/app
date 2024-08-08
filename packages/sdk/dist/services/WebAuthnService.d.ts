import { TagParser } from "../utils/TagParser";
export declare class WebAuthnService {
    private AUTHN_MAX_TRIES;
    private AUTHN_TRIES;
    executeCommand(command?: string): Promise<TagParser>;
    cancelReading(): void;
}
