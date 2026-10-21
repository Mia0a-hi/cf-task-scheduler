/**
 * Security & Authentication Module
 * Implements irreversible password hashing via Web Crypto PBKDF2-SHA256 with random salt
 * and secure HMAC-SHA256 JWT-compatible session tokens.
 */

const ITERATIONS = 100000;
const KEY_LEN = 32; // 256 bits

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuf(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a, b) {
  if (a.byteLength !== b.byteLength) return false;
  let diff = 0;
  for (let i = 0; i < a.byteLength; i++) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

/**
 * Irreversibly hash a plaintext password with PBKDF2 + random salt
 * @param {string} password 
 * @returns {Promise<string>} Format: pbkdf2:sha256:<iterations>:<saltHex>:<hashHex>
 */
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    passwordKey,
    KEY_LEN * 8
  );

  return `pbkdf2:sha256:${ITERATIONS}:${bufToHex(salt)}:${bufToHex(derivedBits)}`;
}

/**
 * Verify a plaintext password against the stored irreversible hash
 * @param {string} password 
 * @param {string} storedHash 
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
  try {
    if (!storedHash || typeof storedHash !== 'string') return false;
    const parts = storedHash.split(':');
    if (parts.length !== 5 || parts[0] !== 'pbkdf2' || parts[1] !== 'sha256') {
      return false;
    }

    const iterations = parseInt(parts[2], 10);
    const salt = hexToBuf(parts[3]);
    const expectedHashBytes = hexToBuf(parts[4]);

    const enc = new TextEncoder();
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const actualBits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: 'SHA-256'
      },
      passwordKey,
      expectedHashBytes.byteLength * 8
    );

    return timingSafeEqual(new Uint8Array(actualBits), expectedHashBytes);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Create a secure HMAC-SHA256 session token
 */
export async function createSessionToken(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const enc = new TextEncoder();

  const b64Url = (obj) => {
    const json = typeof obj === 'string' ? obj : JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(json)))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  };

  const headerB64 = b64Url(header);
  const payloadB64 = b64Url(payload);
  const dataToSign = `${headerB64}.${payloadB64}`;

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(dataToSign));
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${dataToSign}.${sigB64}`;
}

/**
 * Verify session token and return payload
 */
export async function verifySessionToken(token, secret) {
  try {
    if (!token || typeof token !== 'string') return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, sigB64] = parts;
    const dataToSign = `${headerB64}.${payloadB64}`;
    const enc = new TextEncoder();

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigStr = atob(sigB64.replace(/-/g, '+').replace(/_/g, '/'));
    const sigBytes = new Uint8Array(sigStr.length);
    for (let i = 0; i < sigStr.length; i++) {
      sigBytes[i] = sigStr.charCodeAt(i);
    }

    const isValid = await crypto.subtle.verify('HMAC', cryptoKey, sigBytes, enc.encode(dataToSign));
    if (!isValid) return null;

    const payloadJson = decodeURIComponent(escape(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))));
    const payload = JSON.parse(payloadJson);

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}
