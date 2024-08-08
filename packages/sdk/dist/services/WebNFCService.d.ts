import { TagParser } from "../utils/TagParser";
export declare class WebNFCService {
    private ndefReader;
    private readHandler;
    executeCommand(command?: string): Promise<TagParser>;
    cancelReading(): void;
}
