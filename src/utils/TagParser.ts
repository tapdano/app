type TagType = "soulbound" | "onetime" | "extractable";

export class TagParser {
  TagID: string;
  TagVersion: string;
  Burned: boolean;
  Type?: TagType;
  Extracted?: boolean;
  PublicKey?: string;
  PrivateKey?: string;

  constructor(input: string) {
    this.TagID = input.slice(0, 4);
    this.TagVersion = input.slice(4, 8);
    this.Burned = input.slice(8, 10) === "01";
    if (this.Burned) {
      this.Type = this.parseType(input.slice(10, 12));
      this.Extracted = input.slice(12, 14) === "01";
      this.PublicKey = input.slice(14, 78);
      this.PrivateKey = this.extractPrivateKey(input.slice(78));
    }
  }

  private parseType(type: string): TagType | undefined {
    switch (type) {
      case "01":
        return "soulbound";
      case "02":
        return "onetime";
      case "03":
        return "extractable";
      default:
        return undefined;
    }
  }

  private extractPrivateKey(remainingString: string): string | undefined {
    return remainingString.length === 64 ? remainingString : undefined;
  }
}