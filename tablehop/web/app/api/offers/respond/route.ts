import { resumeHook } from 'workflow/api';

export async function POST(req: Request) {
    const { offerStatus, accepted } = await req.json();
    try {
        await resumeHook(offerStatus, { accepted });
        return Response.json({ ok: true });
    } catch {
        return Response.json({ error: 'table is no longer available' }, { status: 409 });
    }
}