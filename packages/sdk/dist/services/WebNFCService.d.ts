import { TagParser } from "../utils/TagParser";
export declare class WebNFCService {
    private MAX_TRIES;
    private TRIES;
    private ndefReader;
    private isFirstRead;
    private _command;
    private _resolve;
    private _reject;
    private isCanceled;
    executeCommand(command?: string): Promise<TagParser>;
    private readHandler;
    private startScan;
    private stopScan;
    cancel(): void;
}
