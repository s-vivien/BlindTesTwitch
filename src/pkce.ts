import { randomBytes, createHash } from 'crypto'

export class PKCECodePair {
    codeVerifier: string
    codeChallenge: string

    constructor(cv: string, cc: string) {
        this.codeVerifier = cv
        this.codeChallenge = cc
    }
}

export const base64URLEncode = (str: Buffer): string => {
    return str
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

export const sha256 = (buffer: Buffer): Buffer => {
    return createHash('sha256').update(buffer).digest()
}

export const createPKCECodes = (): PKCECodePair => {
    const codeVerifier = base64URLEncode(randomBytes(64))
    const codeChallenge = base64URLEncode(sha256(Buffer.from(codeVerifier)))
    const codePair = new PKCECodePair(codeVerifier, codeChallenge)
    return codePair
}