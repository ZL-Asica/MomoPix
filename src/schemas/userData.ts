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

const weakUsernames = new Set(['admin', 'user']);

const usernameSchema = z
  .string()
  .min(3, { message: '用户名至少需要 3 个字符' })
  .max(64, { message: '用户名最多不超过 64 个字符' })
  .regex(/^[\w\u4E00-\u9FA5-]+$/, {
    message: '用户名仅允许字母、数字、下划线、横杠和中文',
  })
  .refine((user) => !weakUsernames.has(user), {
    message: '不要使用简易用户名',
  });

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

export { UserDataSchema, usernameSchema, passwordSchema };
