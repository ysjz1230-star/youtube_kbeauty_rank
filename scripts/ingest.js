// 일일 수집: channels.list → playlistItems.list(업로드) → videos.list(조회수) → data/youtube.json
// 사용: npm run ingest   (같은 날 여러 번 실행해도 결과가 같다: 스냅샷은 날짜로 덮어씀)
import { readFileSync, writeFileSync, mkdirSync, existsSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from '../lib/data/csv.js';
import { channelSeedRow } from '../lib/validate.js';
import { fetchChannels, fetchUploads, fetchVideoStats, quota, YoutubeApiError } from '../lib/youtube.js';
import { todayKst, retentionCutoff } from '../lib/format.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const storePath = join(root, 'data', 'youtube.json');
const SOFT_LIMIT = Number(process.env.QUOTA_SOFT_LIMIT || 8000);
const RETENTION = Math.min(Number(process.env.RETENTION_DAYS || 30), 30);
const VIDEOS_PER_CHANNEL = 10;
const today = todayKst();

// 1) 시드 읽기·검증 (잘못된 줄은 줄 번호와 함께 중단)
const seed = parseCsv(readFileSync(join(root, 'db', 'seed', 'channels.csv'), 'utf8')).map((r, i) => {
  const p = channelSeedRow.safeParse(r);
  if (!p.success) {
    console.error(`channels.csv ${i + 2}번째 줄이 올바르지 않습니다: ${p.error.issues[0].message}`);
    process.exit(1);
  }
  return p.data;
});
if (new Set(seed.map((s) => s.channel_id)).size !== seed.length) {
  console.error('channels.csv에 중복된 channel_id가 있습니다.');
  process.exit(1);
}

const prev = existsSync(storePath) ? JSON.parse(readFileSync(storePath, 'utf8')) : { channels: [] };
const prevById = new Map((prev.channels ?? []).map((c) => [c.channel_id, c]));
const guard = () => {
  if (quota.units >= SOFT_LIMIT) throw new Error(`자체 쿼터 한도(${SOFT_LIMIT} units)에 도달해 중단합니다.`);
};

try {
  // 2) 채널 지표 (id 50개씩)
  console.log(`[1/3] 채널 지표 조회 (${seed.length}개)`);
  const items = await fetchChannels(seed.map((s) => s.channel_id));
  const apiById = new Map(items.map((c) => [c.id, c]));
  const missing = seed.filter((s) => !apiById.has(s.channel_id)).map((s) => s.channel_id);

  // 3) 업로드 목록 (채널당 1회)
  console.log(`[2/3] 업로드 목록 조회 (${items.length}개 채널)`);
  const uploads = new Map();
  for (const ch of items) {
    guard();
    const pl = ch.contentDetails?.relatedPlaylists?.uploads;
    uploads.set(ch.id, pl ? await fetchUploads(pl, VIDEOS_PER_CHANNEL) : []);
  }

  // 4) 영상 조회수 (id 50개씩)
  const allIds = [...new Set([...uploads.values()].flat().map((u) => u.contentDetails?.videoId ?? u.snippet?.resourceId?.videoId).filter(Boolean))];
  console.log(`[3/3] 영상 조회수 조회 (${allIds.length}개)`);
  guard();
  const stats = new Map((await fetchVideoStats(allIds)).map((v) => [v.id, Number(v.statistics?.viewCount ?? 0)]));

  // 5) 병합·저장
  const cutoff = retentionCutoff(today, RETENTION);
  const channels = [];
  for (const s of seed) {
    const api = apiById.get(s.channel_id);
    const old = prevById.get(s.channel_id);
    if (!api) {
      if (old) channels.push({ ...old, category: s.category, is_brand: s.is_brand === 'true', missing: true });
      continue;
    }
    const st = api.statistics ?? {};
    const hidden = Boolean(st.hiddenSubscriberCount);
    const snapshot = {
      snapshot_date: today,
      subscriber_count: hidden ? null : Number(st.subscriberCount ?? 0),
      hidden_subscribers: hidden,
      view_count: Number(st.viewCount ?? 0),
      video_count: Number(st.videoCount ?? 0),
    };
    const snapshots = [...(old?.snapshots ?? []).filter((x) => x.snapshot_date !== today), snapshot]
      .filter((x) => x.snapshot_date >= cutoff)
      .sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date));
    const videos = (uploads.get(api.id) ?? []).map((u) => {
      const id = u.contentDetails?.videoId ?? u.snippet.resourceId.videoId;
      const th = u.snippet.thumbnails ?? {};
      return {
        video_id: id,
        channel_id: api.id,
        title: u.snippet.title,
        published_at: u.contentDetails?.videoPublishedAt ?? u.snippet.publishedAt,
        thumbnail_url: (th.medium ?? th.default ?? {}).url ?? null,
        view_count: stats.get(id) ?? null,
        fetched_at: new Date().toISOString(),
      };
    });
    channels.push({
      channel_id: api.id,
      title: api.snippet?.title ?? '',
      handle: api.snippet?.customUrl ?? '',
      thumbnail_url: (api.snippet?.thumbnails?.default ?? {}).url ?? null,
      country: api.snippet?.country ?? null,
      category: s.category,
      is_brand: s.is_brand === 'true',
      last_refreshed_at: new Date().toISOString(),
      snapshots,
      videos,
    });
  }

  mkdirSync(dirname(storePath), { recursive: true });
  const out = {
    version: 1,
    updatedAt: new Date().toISOString(),
    snapshotDate: today,
    unitsUsed: quota.units,
    missingChannelIds: missing,
    channels,
  };
  writeFileSync(`${storePath}.tmp`, JSON.stringify(out, null, 2));
  renameSync(`${storePath}.tmp`, storePath);

  console.log(`\n완료: 채널 ${channels.length}개, 영상 ${allIds.length}개, 사용 쿼터 ${quota.units} units → data/youtube.json`);
  if (missing.length) console.log(`응답에 없는 채널 ID ${missing.length}개: ${missing.join(', ')}`);
} catch (err) {
  // 오류 메시지에는 API 응답 본문과 키를 싣지 않는다
  console.error(`수집 실패: ${err instanceof YoutubeApiError ? err.message : err.message}`);
  process.exit(1);
}
