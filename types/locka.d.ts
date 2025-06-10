declare module "locka" {
  export default function locka(value: string): LockaChain;

  export function encrypt(text: string, password: string): string;
  export function decrypt(token: string, password: string): string;
  export function generatePassword(length?: number, options?: PasswordOptions): string;
  export function generateToken(length?: number, encoding?: "hex" | "base64" | "raw"): string | Buffer;
  export function parse(token: string): LockaParsed;

  export interface LockaChain {
    aes(password: string): LockaChain | string;
    base64(): LockaChain;
    hex(): LockaChain;
    xor(key: string): LockaChain;
    hash(algorithm?: string): LockaChain;
    decrypt(): LockaChain;
    toString(): string;
  }

  export interface PasswordOptions {
    symbols?: boolean;
    uppercase?: boolean;
    numbers?: boolean;
  }

  export interface LockaParsed {
    format: string;
    version: string;
    iv: string;
    ciphertext: string;
    valid: boolean;
    reason?: string;
  }
}

declare module "locka/web" {
  export function encryptWeb(text: string, password: string): Promise<string>;
  export function decryptWeb(token: string, password: string): Promise<string>;
}
