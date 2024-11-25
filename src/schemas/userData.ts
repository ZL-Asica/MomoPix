import { z } from 'zod';

const PhotoSchema = z.object({
  id: z.string(),
  url: z.string().url(),
  size: z.number().positive(),
  lastModified: z.number(),
  uploadedAt: z.number(),
  name: z.string(),
});

const AlbumSchema = z.object({
  name: z.string(),
  thumbnail: z.string().url(),
  createdAt: z.string().datetime(),
  photos: z.array(PhotoSchema),
});

const UserDataSchema = z.object({
  uid: z.string(),
  TOKEN: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  photoURL: z.string().url().nullable(),
  createdAt: z.string().datetime(),
  albums: z.array(AlbumSchema),
});

const emailSchema = z
  .string()
  .email('邮箱格式不正确')
  .refine((email) => email.includes('@zla.app'), { message: '本站禁止注册' });

const passwordSchema = z
  .string()
  .min(8, '密码长度至少为 8 位')
  .max(50, '密码长度不能超过 50 位')
  .refine((password) => /\d/.test(password), { message: '密码必须包含数字' })
  .refine((password) => /[A-Z]/.test(password), {
    message: '密码必须包含大写字母',
  })
  .refine((password) => /[a-z]/.test(password), {
    message: '密码必须包含小写字母',
  });

export { UserDataSchema, emailSchema, passwordSchema };
