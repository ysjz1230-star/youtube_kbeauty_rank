// 목업 멘션 CSV(mentions.csv)를 만든다. products.csv·places.csv는 손으로 관리한다.
// 주의: channels.csv는 실제 채널 시드이므로(npm run check-channels가 생성) 이 스크립트가 건드리지 않는다.
// 사용: node scripts/gen-mock-seed.js
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { buildMockYoutube, mockVideoId } from '../lib/data/mock-youtube.js';
import { parseCsv } from '../lib/data/csv.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const seed = (f) => join(root, 'db', 'seed', f);

const channels = buildMockYoutube(); // 목업 채널 수 출력용

const products = parseCsv(readFileSync(seed('products.csv'), 'utf8'));
const places = parseCsv(readFileSync(seed('places.csv'), 'utf8'));

const byCategory = {
  스킨케어: [3, 9, 14, 19, 25, 6, 15],
  베이스: [1, 2, 4, 5, 17, 22],
  '립·치크': [1, 4, 17, 22, 5, 2],
  아이: [2, 4, 5, 17, 22, 1],
  헤어: [8, 16, 6],
  네일: [10, 18],
  향수: [11, 21, 6],
};
const anyChannels = [1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 14, 15, 17, 18, 21];

const mentions = ['video_id,product_slug,place_slug,start_sec'];
products.forEach((p, i) => {
  const pool = byCategory[p.category] ?? anyChannels;
  const n = 1 + (i % 3);
  for (let k = 0; k < n; k++) {
    const ch = pool[(i + k * 2) % pool.length];
    const v = ((i + k) % 6) + 1;
    mentions.push(`${mockVideoId(ch, v)},${p.slug},,${30 + ((i * 37 + k * 71) % 600)}`);
  }
});
places.forEach((p, i) => {
  const n = 1 + ((i + 1) % 3);
  for (let k = 0; k < n; k++) {
    const ch = anyChannels[(i * 2 + k * 3) % anyChannels.length];
    const v = ((i + k * 2) % 6) + 1;
    mentions.push(`${mockVideoId(ch, v)},,${p.slug},${20 + ((i * 53 + k * 89) % 540)}`);
  }
});
// (video_id, product) / (video_id, place) 중복 제거
const seen = new Set();
const unique = mentions.filter((l, i) => {
  if (i === 0) return true;
  const [vid, ps, pl] = l.split(',');
  const key = `${vid}|${ps}|${pl}`;
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});
writeFileSync(seed('mentions.csv'), unique.join('\n') + '\n');
console.log(`channels: ${channels.length}, products: ${products.length}, places: ${places.length}, mentions: ${unique.length - 1}`);
