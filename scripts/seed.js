// 시드 CSV(channels, products, places, mentions)를 DB에 반영한다. 여러 번 실행해도 결과가 같다(upsert).
// 사용: npm run seed
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { z } from 'zod';
import { parseCsv } from '../lib/data/csv.js';
import { q } from '../lib/data/neon.js';
import { channelSeedRow, slugSchema } from '../lib/validate.js';

const seedDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'seed');
const read = (f) => parseCsv(readFileSync(join(seedDir, f), 'utf8'));
const fail = (msg) => {
  console.error(msg);
  process.exit(1);
};

const productRow = z.object({
  slug: slugSchema,
  brand: z.string().min(1),
  name_ko: z.string().min(1),
  category: z.string().min(1),
  price_krw: z.coerce.number().int().nonnegative(),
  description: z.string().default(''),
  buy_url: z.string().url().optional().or(z.literal('')),
  is_affiliate: z.enum(['true', 'false']),
  price_checked_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
const placeRow = z.object({
  slug: slugSchema,
  name_ko: z.string().min(1),
  place_type: z.string().min(1),
  district: z.string().default(''),
  address: z.string().default(''),
  website_url: z.string().url().optional().or(z.literal('')),
  description: z.string().default(''),
});

function parseAll(rows, schema, file) {
  return rows.map((r, i) => {
    const p = schema.safeParse(r);
    if (!p.success) fail(`${file} ${i + 2}번째 줄 오류: ${p.error.issues[0].path.join('.')} ${p.error.issues[0].message}`);
    return p.data;
  });
}

try {
  const channels = parseAll(read('channels.csv'), channelSeedRow, 'channels.csv');
  if (new Set(channels.map((c) => c.channel_id)).size !== channels.length) fail('channels.csv에 중복된 channel_id가 있습니다.');
  const products = parseAll(read('products.csv'), productRow, 'products.csv');
  const places = parseAll(read('places.csv'), placeRow, 'places.csv');
  for (const [name, list] of [['products', products], ['places', places]]) {
    if (new Set(list.map((x) => x.slug)).size !== list.length) fail(`${name}.csv에 중복된 slug가 있습니다.`);
  }

  for (const c of channels) {
    await q(
      `insert into channels (channel_id, category, is_brand, note) values ($1, $2, $3, $4)
       on conflict (channel_id) do update set category = excluded.category, is_brand = excluded.is_brand, note = excluded.note, updated_at = now()`,
      [c.channel_id, c.category, c.is_brand === 'true', c.note],
    );
  }
  for (const p of products) {
    await q(
      `insert into products (slug, brand, name_ko, category, price_krw, price_checked_on, description, buy_url, is_affiliate)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       on conflict (slug) do update set brand = excluded.brand, name_ko = excluded.name_ko, category = excluded.category,
         price_krw = excluded.price_krw, price_checked_on = excluded.price_checked_on, description = excluded.description,
         buy_url = excluded.buy_url, is_affiliate = excluded.is_affiliate, updated_at = now(), deleted_at = null`,
      [p.slug, p.brand, p.name_ko, p.category, p.price_krw, p.price_checked_on, p.description, p.buy_url || null, p.is_affiliate === 'true'],
    );
  }
  for (const p of places) {
    await q(
      `insert into places (slug, name_ko, place_type, district, address, website_url, description)
       values ($1, $2, $3, $4, $5, $6, $7)
       on conflict (slug) do update set name_ko = excluded.name_ko, place_type = excluded.place_type, district = excluded.district,
         address = excluded.address, website_url = excluded.website_url, description = excluded.description, updated_at = now(), deleted_at = null`,
      [p.slug, p.name_ko, p.place_type, p.district, p.address, p.website_url || null, p.description],
    );
  }

  // 멘션: 영상이 수집(videos)되어 있어야 채널을 알 수 있다. 없는 영상·슬러그는 건너뛰고 알려 준다.
  let ok = 0;
  const skipped = [];
  for (const m of read('mentions.csv')) {
    const [vid] = await q('select channel_id from videos where video_id = $1', [m.video_id]);
    if (!vid) {
      skipped.push(`${m.video_id}(영상 미수집)`);
      continue;
    }
    const slug = m.product_slug || m.place_slug;
    const table = m.product_slug ? 'products' : 'places';
    const col = m.product_slug ? 'product_id' : 'place_id';
    const [ref] = await q(`select ${col} as id from ${table} where slug = $1`, [slug]);
    if (!ref) {
      skipped.push(`${slug}(없는 슬러그)`);
      continue;
    }
    await q(
      `insert into video_mentions (video_id, channel_id, ${col}, start_sec) values ($1, $2, $3, $4) on conflict do nothing`,
      [m.video_id, vid.channel_id, ref.id, Number(m.start_sec) || null],
    );
    ok++;
  }

  console.log(`✔ 채널 ${channels.length}개, 제품 ${products.length}개, 장소 ${places.length}개 반영, 멘션 ${ok}개 연결`);
  if (skipped.length) console.log(`  건너뛴 멘션 ${skipped.length}개 (수집된 영상과 연결되지 않음)`);
} catch (err) {
  console.error(`시드 실패: ${err.message}`);
  process.exit(1);
}
