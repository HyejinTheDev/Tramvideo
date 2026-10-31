import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email('Email không hợp lệ').max(200);
export const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu tối thiểu 8 ký tự')
  .max(128)
  .regex(/[A-Za-z]/, 'Mật khẩu cần có chữ')
  .regex(/[0-9]/, 'Mật khẩu cần có số');

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().min(1).max(100).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Nhập mật khẩu').max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({ token: z.string().min(10).max(500) });
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({ email: emailSchema });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(10).max(500),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const roleSchema = z.enum(['USER', 'ADMIN']);
export type Role = z.infer<typeof roleSchema>;

export const meResponse = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  role: roleSchema,
  emailVerified: z.boolean(),
});
export type Me = z.infer<typeof meResponse>;
