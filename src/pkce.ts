export class PKCECodePair {
  codeVerifier: string;
  codeChallenge: string;

  constructor(cv: string, cc: string) {
    this.codeVerifier = cv;
    this.codeChallenge = cc;
  }
}

const dec2hex = (dec: any) => {
  return ('0' + dec.toString(16)).substr(-2);
};

const generateRandomString = () => {
  var array = new Uint32Array(56 / 2);
  window.crypto.getRandomValues(array);
  return Array.from(array, dec2hex).join('');
};

const sha256 = (plain: string) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
};

const base64urlencode = (a: ArrayBuffer) => {
  var str = '';
  var bytes = new Uint8Array(a);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const challengeFromVerifier = async (v: string) => {
  let hashed = await sha256(v);
  let base64encoded = base64urlencode(hashed);
  return base64encoded;
};

export const createPKCECodes = async (): Promise<PKCECodePair> => {
  const codeVerifier = generateRandomString();
  const codeChallenge = await challengeFromVerifier(codeVerifier);
  const codePair = new PKCECodePair(codeVerifier, codeChallenge);
  return codePair;
};