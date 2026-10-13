import { flag } from 'flags/next';
import { vercelAdapter } from '@flags-sdk/vercel';
import { getUser } from '@/lib/session';
import { dinerId } from '@/lib/user';

type Entities = { user?: { id: string } };

export const agentBookingFlag = flag<boolean, Entities>({
    key: 'top-diners',
    adapter: vercelAdapter(),
    defaultValue: false,
    async identify() {
        const user = await getUser();
        return user?.role === 'diner' ? { user: { id: dinerId(user.name) } } : {};
    },
});