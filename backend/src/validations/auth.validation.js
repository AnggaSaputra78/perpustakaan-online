const { z } = require('zod');

const registerSchema = z.object({
  fullName: z.string()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(100, 'Nama lengkap maksimal 100 karakter'),
  email: z.string()
    .email('Format email tidak valid')
    .toLowerCase(),
  password: z.string()
    .min(6, 'Password minimal 6 karakter')
    .max(100, 'Password maksimal 100 karakter'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Konfirmasi password tidak cocok',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string()
    .email('Format email tidak valid')
    .toLowerCase(),
  password: z.string()
    .min(1, 'Password harus diisi'),
});

module.exports = { registerSchema, loginSchema };