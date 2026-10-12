export async function bookingAPI(path: string, method = 'GET', body?: unknown, revalidate?: number) {
    const res = await fetch(process.env.BOOKING_API_URL + path, {
        method,
        headers: {
            'content-type': 'application/json',
            'x-api-key': process.env.BOOKING_API_KEY ?? '',
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: revalidate ? undefined : 'no-store',
        next: revalidate ? { revalidate } : undefined,
    });
    if (res.status >= 500) {
        throw new Error(`booking api error ${res.status} on ${path}`);
    }

    return { status: res.status, data: await res.json() };
}