// 로컬 개발 서버: public 정적 파일 → /api/* 함수 → 나머지는 api/page.js (vercel.json의 rewrites와 같은 순서)
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3000);
const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
  '.ico': 'image/x-icon',
};

// vercel.json의 보안 헤더를 로컬에서도 동일하게 적용한다
async function securityHeaders() {
  const cfg = JSON.parse(await readFile(join(root, 'vercel.json'), 'utf8'));
  return Object.fromEntries((cfg.headers?.[0]?.headers ?? []).map((h) => [h.key, h.value]));
}

async function loadHandler(rel) {
  // 개발 중 코드 변경이 바로 반영되도록 쿼리로 캐시를 우회하지 않고, 서버 재시작을 전제로 한다.
  const mod = await import(pathToFileURL(join(root, rel)).href);
  return mod.default;
}

const headers = await securityHeaders();

const server = http.createServer(async (req, res) => {
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  const url = new URL(req.url, `http://localhost:${port}`);
  const pathname = decodeURIComponent(url.pathname);

  try {
    if (pathname === '/sitemap.xml') return (await loadHandler('api/sitemap.js'))(req, res);

    if (pathname.startsWith('/api/')) {
      const rel = `${normalize(pathname).replace(/^[/\\]+/, '').replace(/\\/g, '/')}.js`;
      if (rel.includes('..')) throw new Error('bad path');
      try {
        return await (await loadHandler(rel))(req, res);
      } catch (e) {
        if (e.code === 'ERR_MODULE_NOT_FOUND') {
          res.statusCode = 404;
          return res.end('Not Found');
        }
        throw e;
      }
    }

    // public 정적 파일
    const filePath = normalize(join(root, 'public', pathname));
    if (filePath.startsWith(join(root, 'public')) && extname(filePath)) {
      try {
        const buf = await readFile(filePath);
        res.statusCode = 200;
        res.setHeader('Content-Type', TYPES[extname(filePath)] ?? 'application/octet-stream');
        return res.end(buf);
      } catch {
        /* 파일 없음 → 아래 page 함수로 */
      }
    }

    return (await loadHandler('api/page.js'))(req, res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(port, async () => {
  console.log(`http://localhost:${port}`);
  // 시작할 때 환경변수 상태를 터미널에 표시한다 (키 값은 출력하지 않는다)
  const { checkYoutubeKey } = await import(pathToFileURL(join(root, 'lib/youtube.js')).href);
  const yt = await checkYoutubeKey();
  const mark = yt.valid ? '✔' : '✖';
  console.log(`[env] YOUTUBE_API_KEY  ${mark} ${yt.message}`);
  console.log(`[env] DATABASE_URL     ${process.env.DATABASE_URL ? '설정됨 (DB에 수집 데이터가 있으면 Neon 데이터를 사용)' : '미설정 (목업 데이터 모드 — 정상)'}`);
  console.log(`[env] CRON_SECRET      ${process.env.CRON_SECRET ? '설정됨 (크론 엔드포인트 구현 전이라 아직 사용하지 않음)' : '미설정 (크론 미구현 — 정상)'}`);
});
