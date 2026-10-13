import { getUser } from '@/lib/session';

export async function GET() {
    return Response.json({ user: await getUser() });
}