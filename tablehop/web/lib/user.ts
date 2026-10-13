
export type User = {
    name: string;
    role: 'diner' | 'host';
    restaurantId?: string;
    restaurantName?: string;
};

export const USER_COOKIE = 'tablehop_user';

export function parseUser(raw?: string): User | null {
    if (!raw) return null;
    try {
        const user = JSON.parse(raw);
        return user?.name && user?.role ? user : null;
    } catch {
        return null;
    }
}

export function dinerId(name: string) {
    return name.trim().toLowerCase().replace(/\s+/g, '-');
}

export function formatTime(time: string) {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'pm' : 'am';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function formatDate(date: string) {
    return new Date(date + 'T12:00:00Z').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC',
    });
}

export function tableLabel(tableId: string) {
    return tableId.replace(/^table/i, 'Table ');
}
