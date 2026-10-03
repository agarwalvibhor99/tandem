import { z } from 'zod';

const email = z.string().trim().email('Enter a valid email address.').max(254, 'Email is too long.');

export const loginSchema = z.object({
  email,
  // Do not trim passwords or apply new-account strength rules to existing users.
  password: z.string().min(1, 'Enter your password.').max(128, 'Password is too long.'),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(80, 'Use 80 characters or fewer.'),
  email,
  password: z.string().min(12, 'Use at least 12 characters.').max(128, 'Use 128 characters or fewer.'),
});

export type LoginValues = z.infer<typeof loginSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
