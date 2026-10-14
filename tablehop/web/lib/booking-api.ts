import { getVercelOidcToken } from '@vercel/functions/oidc';
import { ExternalAccountClient } from 'google-auth-library';

const { GCP_PROJECT_NUMBER, GCP_POOL_ID, GCP_PROVIDER_ID, GCP_SERVICE_ACCOUNT } = process.env;

const gcp = GCP_PROJECT_NUMBER
    ? ExternalAccountClient.fromJSON({
          type: 'external_account',
          audience: `//iam.googleapis.com/projects/${GCP_PROJECT_NUMBER}/locations/global/workloadIdentityPools/${GCP_POOL_ID}/providers/${GCP_PROVIDER_ID}`,
          subject_token_type: 'urn:ietf:params:oauth:token-type:jwt',
          token_url: 'https://sts.googleapis.com/v1/token',
          subject_token_supplier: { getSubjectToken: () => getVercelOidcToken() },
      })
    : null;

let cached: { token: string; expires: number } | null = null;

async function cloudRunToken() {
    if (cached && cached.expires > Date.now() + 60_000) return cached.token;

    const { token: access } = await gcp!.getAccessToken();
    const res = await fetch(
        `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${GCP_SERVICE_ACCOUNT}:generateIdToken`,
        {
            method: 'POST',
            headers: { authorization: `Bearer ${access}`, 'content-type': 'application/json' },
            body: JSON.stringify({ audience: process.env.BOOKING_API_URL, includeEmail: true }),
        },
    );
    if (!res.ok) throw new Error(`couldn't get a Cloud Run token: ${res.status} ${await res.text()}`);

    const { token } = await res.json();
    cached = { token, expires: Date.now() + 55 * 60_000 };
    return token as string;
}

export async function bookingAPI(path: string, method = 'GET', body?: unknown, revalidate?: number) {
    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (gcp) headers.authorization = `Bearer ${await cloudRunToken()}`;
    if (process.env.BOOKING_API_KEY) headers['x-api-key'] = process.env.BOOKING_API_KEY;

    const res = await fetch(process.env.BOOKING_API_URL + path, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        cache: revalidate ? undefined : 'no-store',
        next: revalidate ? { revalidate } : undefined,
    });

    if (res.status >= 500) throw new Error(`booking api error ${res.status} on ${path}`);

    const text = await res.text();
    try {
        return { status: res.status, data: JSON.parse(text) };
    } catch {
        throw new Error(`booking api ${res.status} on ${path} (not JSON): ${text.slice(0, 120)}`);
    }
}