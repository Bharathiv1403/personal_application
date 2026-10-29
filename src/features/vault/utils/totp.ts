// RFC 6238 / RFC 4226 pure TypeScript TOTP engine
// Decodes Base32 secret keys and calculates rolling 6-digit tokens

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[\s=-]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_CHARS.indexOf(clean.charAt(i));
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

// Pure JavaScript SHA1 and HMAC-SHA1 implementation (RFC 2104 / FIPS 180-1)
function sha1(bytes: Uint8Array): Uint8Array {
  let h0 = 0x67452301;
  let h1 = 0xefcdab89;
  let h2 = 0x98badcfe;
  let h3 = 0x10325476;
  let h4 = 0xc3d2e1f0;

  const len = bytes.length;
  const bitLen = len * 8;
  const paddedLen = ((len + 8) >>> 6 << 6) + 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(bytes);
  padded[len] = 0x80;

  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 4, bitLen, false);

  const words = new Uint32Array(80);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      words[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 80; i++) {
      const v = words[i - 3] ^ words[i - 8] ^ words[i - 14] ^ words[i - 16];
      words[i] = (v << 1) | (v >>> 31);
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;

    for (let i = 0; i < 80; i++) {
      let f = 0;
      let k = 0;
      if (i < 20) {
        f = (b & c) | (~b & d);
        k = 0x5a827999;
      } else if (i < 40) {
        f = b ^ c ^ d;
        k = 0x6ed9eba1;
      } else if (i < 60) {
        f = (b & c) | (b & d) | (c & d);
        k = 0x8f1bbcdc;
      } else {
        f = b ^ c ^ d;
        k = 0xca62c1d6;
      }

      const temp = (((a << 5) | (a >>> 27)) + f + e + k + words[i]) >>> 0;
      e = d;
      d = c;
      c = (b << 30) | (b >>> 2);
      b = a;
      a = temp;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
  }

  const result = new Uint8Array(20);
  const outView = new DataView(result.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  return result;
}

function hmacSha1(key: Uint8Array, message: Uint8Array): Uint8Array {
  const blockSize = 64;
  let k = key;
  if (k.length > blockSize) {
    k = sha1(k);
  }
  const paddedKey = new Uint8Array(blockSize);
  paddedKey.set(k);

  const oKeyPad = new Uint8Array(blockSize);
  const iKeyPad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    oKeyPad[i] = paddedKey[i] ^ 0x5c;
    iKeyPad[i] = paddedKey[i] ^ 0x36;
  }

  const inner = new Uint8Array(blockSize + message.length);
  inner.set(iKeyPad, 0);
  inner.set(message, blockSize);
  const innerHash = sha1(inner);

  const outer = new Uint8Array(blockSize + innerHash.length);
  outer.set(oKeyPad, 0);
  outer.set(innerHash, blockSize);
  return sha1(outer);
}

export interface TotpResult {
  code: string;
  secondsRemaining: number;
  period: number;
}

export class TotpService {
  /**
   * Generates a 6-digit TOTP code and remaining seconds for a given Base32 secret.
   * Period default is 30 seconds.
   */
  static generate(secret: string, period = 30): TotpResult | null {
    if (!secret || !secret.trim()) return null;

    try {
      // Support otpauth:// URIs as well as bare secrets
      let rawSecret = secret.trim();
      if (rawSecret.startsWith('otpauth://')) {
        const match = rawSecret.match(/secret=([A-Za-z2-7]+)/i);
        if (match && match[1]) {
          rawSecret = match[1];
        }
      }

      const keyBytes = base32ToBytes(rawSecret);
      if (keyBytes.length === 0) return null;

      const now = Math.floor(Date.now() / 1000);
      const counter = Math.floor(now / period);
      const secondsRemaining = period - (now % period);

      const msg = new Uint8Array(8);
      let temp = counter;
      for (let i = 7; i >= 0; i--) {
        msg[i] = temp & 0xff;
        temp = Math.floor(temp / 256);
      }

      const hash = hmacSha1(keyBytes, msg);
      const offset = hash[hash.length - 1] & 0x0f;

      const binary =
        ((hash[offset] & 0x7f) << 24) |
        ((hash[offset + 1] & 0xff) << 16) |
        ((hash[offset + 2] & 0xff) << 8) |
        (hash[offset + 3] & 0xff);

      const otp = binary % 1000000;
      const code = otp.toString().padStart(6, '0');

      return {
        code,
        secondsRemaining,
        period,
      };
    } catch {
      return null;
    }
  }
}
