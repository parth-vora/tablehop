import { cookies } from 'next/headers';
import { parseUser, USER_COOKIE } from './user';

export async function getUser() {
    const store = await cookies();
    return parseUser(store.get(USER_COOKIE)?.value);
}
