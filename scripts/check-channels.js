// 핸들(@이름) 목록을 channels.list(forHandle)로 채널 ID로 바꿔 channels.csv를 만든다. (핸들 1개당 1 unit)
// 사용: node --env-file=.env scripts/check-channels.js
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from '../lib/data/csv.js';
import { resolveHandle, quota, YoutubeApiError } from '../lib/youtube.js';
import { channelSeedRow } from '../lib/validate.js';

const seedDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'seed');
const rows = parseCsv(readFileSync(join(seedDir, 'handles.csv'), 'utf8'));

const found = [];
const missing = [];
for (const r of rows) {
  try {
    const ch = await resolveHandle(r.handle);
    if (!ch) {
      missing.push(r.handle);
      continue;
    }
    found.push({ ...r, channel_id: ch.id, title: ch.snippet?.title ?? '' });
    console.log(`✔ ${r.handle.padEnd(22)} → ${ch.id}  ${ch.snippet?.title ?? ''}`);
  } catch (err) {
    if (err instanceof YoutubeApiError) {
      console.error(`✖ 중단: ${err.message}`);
      process.exit(1);
    }
    throw err;
  }
}
for (const m of missing) console.log(`✖ ${m.padEnd(22)} 찾을 수 없음 (핸들 확인 필요)`);

// 중복 ID 제거 + 시드 규칙(Zod) 검증
const seen = new Set();
const lines = ['channel_id,category,is_brand,note'];
for (const f of found) {
  if (seen.has(f.channel_id)) continue;
  seen.add(f.channel_id);
  const row = channelSeedRow.parse({ channel_id: f.channel_id, category: f.category, is_brand: f.is_brand, note: `${f.handle} ${f.title}`.replace(/,/g, ' ') });
  lines.push(`${row.channel_id},${row.category},${row.is_brand},${row.note}`);
}
writeFileSync(join(seedDir, 'channels.csv'), lines.join('\n') + '\n');
console.log(`\n확인 ${seen.size}개 / 실패 ${missing.length}개 → db/seed/channels.csv 저장 (사용 쿼터 ${quota.units} units)`);
