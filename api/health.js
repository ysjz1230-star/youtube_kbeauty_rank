import * as data from '../lib/data/mock.js';
import { cachedYoutubeCheck } from '../lib/diagnostics.js';

// 응답 형식: { data, error }. 키·DB 주소 같은 비밀값은 싣지 않는다.
// /api/health?check=youtube 를 붙이면 YouTube API에 실제로 1회(1 unit) 호출해 키를 점검한다.
export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const db = await data.dbStatus();
  const payload = {
    status: 'ok',
    db: db.connected,
    dataSource: db.mode,
    youtubeKeyConfigured: Boolean(process.env.YOUTUBE_API_KEY),
    lastSnapshotDate: await data.getLatestSnapshotDate(),
    lastIngestStatus: db.mode === 'mock' ? 'mock' : 'unknown',
  };
  if (url.searchParams.get('check') === 'youtube') payload.youtube = await cachedYoutubeCheck();

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ data: payload, error: null }));
}
