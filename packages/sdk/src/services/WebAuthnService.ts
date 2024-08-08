import { arrayBufferToHex, hexStringToArrayBuffer } from "../utils/Helper";
import { TagParser } from "../utils/TagParser";

export class WebAuthnService {
  private AUTHN_MAX_TRIES = 3;
  private AUTHN_TRIES = 0;

  async executeCommand(command: string = '0000'): Promise<TagParser> {
    this.AUTHN_TRIES = 0;
    return new Promise<TagParser>(async (resolve, reject) => {
      const execWebAuthN = async () => {
        try {
          const ret = await navigator.credentials.get({
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
          resolve(new TagParser(arrayBufferToHex((ret as any).response.signature)));
        } catch (e) {
          console.error(e);
          this.AUTHN_TRIES++;
          if (this.AUTHN_TRIES === this.AUTHN_MAX_TRIES) {
            reject(e);
          } else {
            execWebAuthN();
          }
        }
      };
      execWebAuthN();
    });
  }

  cancelReading() {
  }
}