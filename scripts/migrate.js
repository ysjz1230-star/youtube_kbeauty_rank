// db/migrations/*.sql을 이름순으로 적용한다. 이미 적용한 파일은 건너뛴다(schema_migrations).
// 사용: npm run migrate
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { q } from '../lib/data/neon.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'db', 'migrations');

function statements(text) {
  const cleaned = text.split(/\r?\n/).filter((l) => !l.trim().startsWith('--')).join('\n');
  return cleaned.split(/;\s*(?:\r?\n|$)/).map((s) => s.trim()).filter(Boolean);
}

try {
  await q('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  const applied = new Set((await q('select name from schema_migrations')).map((r) => r.name));
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  let count = 0;
  for (const f of files) {
    if (applied.has(f)) {
      console.log(`- ${f}: 이미 적용됨`);
      continue;
    }
    const stmts = statements(readFileSync(join(dir, f), 'utf8'));
    for (const s of stmts) await q(s);
    await q('insert into schema_migrations (name) values ($1)', [f]);
    console.log(`✔ ${f}: 적용 완료 (${stmts.length}개 구문)`);
    count++;
  }
  console.log(count ? `\n마이그레이션 ${count}개 적용` : '\n적용할 마이그레이션이 없습니다.');
} catch (err) {
  console.error(`마이그레이션 실패: ${err.message}`);
  process.exit(1);
}
