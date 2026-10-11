import { z } from 'zod';
import { BOARDS, CATEGORY_KEYS } from './config.js';

// 쿼리 값은 모두 여기서 검증한다. 허용 목록 밖 값은 호출 쪽에서 404로 처리한다.
export const boardSchema = z.enum(Object.keys(BOARDS));
export const categorySchema = z.enum(CATEGORY_KEYS);

export const boardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(2).catch(1),
  type: z.enum(['creator', 'brand']).optional().catch(undefined),
  period: z.enum(['7', '30']).catch('7'),
});

export const channelIdSchema = z.string().regex(/^UC[\w-]{22}$/);

export const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{0,79}$/);

const channelRef = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => {
    if (!v) return undefined;
    const m = v.match(/UC[\w-]{22}/);
    return m ? m[0] : undefined;
  });

export const takedownSchema = z.object({
  channelId: channelRef,
  email: z.string().trim().email().max(200),
  message: z.string().trim().max(500).optional().default(''),
  website: z.string().max(0).optional().default(''), // 스팸 방지용 빈 칸
});

// 시드 CSV 검증 (channels.csv)
export const channelSeedRow = z.object({
  channel_id: channelIdSchema,
  category: categorySchema,
  is_brand: z.enum(['true', 'false']),
  note: z.string().optional().default(''),
});
