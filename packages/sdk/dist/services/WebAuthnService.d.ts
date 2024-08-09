import { TagParser } from "../utils/TagParser";
export declare class WebAuthnService {
    private MAX_TRIES;
    private TRIES;
    private _command;
    private _resolve;
    private _reject;
    private isCanceled;
    executeCommand(command?: string): Promise<TagParser>;
    private execWebAuthN;
    cancel(): void;
}
