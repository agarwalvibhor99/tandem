import { z } from 'zod';

export const createCoupleSchema = z.object({ name: z.string().trim().min(1, 'Give your space a name.').max(80, 'Use 80 characters or fewer.') });
export const normalizeInviteCode = (code: string) => code.replace(/[\s-]/g, '').toUpperCase();
export const joinCoupleSchema = z.object({ code: z.string().transform(normalizeInviteCode).pipe(z.string().regex(/^[A-F0-9]{16}$/, 'Enter the full 16-character invitation code.')) });
export const formatInviteCode = (code: string) => code.match(/.{1,4}/g)?.join('-') ?? code;
