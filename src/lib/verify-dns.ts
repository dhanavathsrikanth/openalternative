import * as dns from 'dns'
import { promisify } from 'util'

const CLAIM_TOKEN_PREFIX = 'forklane-verify='

/**
 * Build the expected DNS TXT record value for a verification token.
 */
export function buildDnsTxtValue(token: string): string {
  return `${CLAIM_TOKEN_PREFIX}${token}`
}

/**
 * Look up TXT records on the given hostname and check whether any record
 * contains the expected verification token.
 *
 * The hostname is extracted from the product's homepageUrl.
 */
export async function verifyDnsTxt(
  hostname: string,
  token: string,
  resolver: (hostname: string) => Promise<string[][]> = defaultResolver,
): Promise<{ verified: boolean; records: string[][] }> {
  const expected = buildDnsTxtValue(token)

  try {
    const records = await resolver(hostname)
    const verified = records.some((rr) => rr.some((part) => part === expected))
    return { verified, records }
  } catch {
    return { verified: false, records: [] }
  }
}

function defaultResolver(hostname: string): Promise<string[][]> {
  return promisify(dns.resolveTxt)(hostname)
}

/**
 * Extract the hostname from a URL string. Returns null if the URL is invalid.
 */
export function extractHostname(url: string): string | null {
  try {
    const hostname = new URL(url).hostname
    return hostname || null
  } catch {
    return null
  }
}

/**
 * Full DNS TXT verification flow: extract hostname, resolve TXT records,
 * check for the token.
 */
export async function verifyProductDns(
  homepageUrl: string,
  token: string,
  resolver?: (hostname: string) => Promise<string[][]>,
): Promise<{ verified: boolean; hostname: string; records: string[][] }> {
  const hostname = extractHostname(homepageUrl)
  if (!hostname) {
    return { verified: false, hostname: '', records: [] }
  }
  const result = await verifyDnsTxt(hostname, token, resolver)
  return { ...result, hostname }
}
