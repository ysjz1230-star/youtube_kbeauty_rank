// 임시 진단용 (원인 확인 후 삭제한다). 비밀값은 출력하지 않는다.
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const MODULES = [
  '../lib/config.js', '../lib/format.js', '../lib/escape.js', '../lib/data/csv.js',
  '../lib/data/mock-youtube.js', '../lib/data/mock.js', '../lib/youtube.js', '../lib/diagnostics.js',
  '../lib/validate.js', '../lib/seo.js', '../lib/ranking.js', '../lib/render/layout.js',
  '../lib/render/board.js', '../lib/render/home.js', '../lib/render/static.js', './page.js',
];

export default async function handler(req, res) {
  const out = { node: process.version, cwd: process.cwd(), modules: {}, files: {} };
  for (const m of MODULES) {
    try {
      await import(m);
      out.modules[m] = 'ok';
    } catch (e) {
      out.modules[m] = `FAIL: ${e?.name}: ${String(e?.message).slice(0, 300)}`;
    }
  }
  for (const p of ['db/seed', 'lib', 'api', 'data']) {
    const full = join(process.cwd(), p);
    try {
      out.files[p] = existsSync(full) ? readdirSync(full).slice(0, 20) : 'missing';
    } catch (e) {
      out.files[p] = `ERR ${e.message}`;
    }
  }
  try {
    const mock = await import('../lib/data/mock.js');
    out.mockLatest = await mock.getLatestSnapshotDate();
    out.mockMode = mock.dataMode();
  } catch (e) {
    out.mockError = `${e?.name}: ${String(e?.message).slice(0, 300)}`;
  }
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(out, null, 2));
}
