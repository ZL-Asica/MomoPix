const base64UrlEncode = (data: string | ArrayBuffer): string => {
  const str =
    typeof data === 'string'
      ? data
      : String.fromCharCode(...new Uint8Array(data));
  return btoa(str).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
};

const generateJwtWithCookie = async (
  payload: JWTPayload | JWTPayloadWithIatExp,
  secret: string,
  expiresIn: number = 3600 * 24 * 30
): Promise<Headers> => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiration = issuedAt + expiresIn;

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(
    JSON.stringify({
      ...payload,
      iat: issuedAt,
      exp: expiration,
    } as JWTPayloadWithIatExp)
  );

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(signatureInput)
  );
  const signature = base64UrlEncode(signatureBuffer);
  const token = `${signatureInput}.${signature}`;

  const headers = new Headers({
    'Content-Type': 'application/json',
    'Set-Cookie': `momo_pix_auth_token=${token}; HttpOnly; Secure; Path=/; SameSite=Strict; Max-Age=${expiresIn}`,
  });

  return headers;
};

const base64UrlDecode = (data: string): Uint8Array => {
  const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const verifyJwt = async (
  token: string,
  secret: string
): Promise<{ valid: boolean; payload?: JWTPayloadWithIatExp }> => {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return { valid: false };
  }

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const isValid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlDecode(encodedSignature),
    new TextEncoder().encode(signatureInput)
  );

  if (!isValid) {
    return { valid: false };
  }

  const payload = JSON.parse(
    new TextDecoder().decode(base64UrlDecode(encodedPayload))
  );
  const now = Math.floor(Date.now() / 1000);

  if (payload.exp && payload.exp < now) {
    return { valid: false };
  }

  return { valid: true, payload };
};

export { generateJwtWithCookie, verifyJwt };
