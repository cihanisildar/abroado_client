import { z } from 'zod';

// Sanitize username function
const sanitizeUsername = (username: string) => {
  return username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
};

// Validation schemas for individual fields
export const UsernameSchema = z.string()
  .min(2, 'Username must be at least 2 characters')
  .max(50, 'Username must be less than 50 characters');

export const EmailSchema = z.string().email('Invalid email format');

export const PasswordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password too long')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
  );

export const RoleSchema = z.enum(['EXPLORER', 'ABROADER']);

// Main schema for form submission
export const RegisterSchema = z.object({
  username: UsernameSchema.transform(sanitizeUsername),
  email: EmailSchema.toLowerCase(),
  password: PasswordSchema,
  role: RoleSchema
}).transform(data => ({
  ...data,
  role: data.role || 'EXPLORER' as const
}));

export type RegisterFormData = z.infer<typeof RegisterSchema>; 