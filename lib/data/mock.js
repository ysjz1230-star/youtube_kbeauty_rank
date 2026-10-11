// 데이터 원천(목업). lib/ranking.js와 화면은 이 모듈의 함수만 호출한다.
// Neon 연결 시 같은 함수 이름·반환 형태로 SQL 구현(lib/data/db.js)을 만들어 교체한다.
import { readFileSync, existsSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseCsv } from './csv.js';
import { buildMockYoutube } from './mock-youtube.js';
import { todayKst } from '../format.js';
import { getConfig } from '../config.js';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const seedDir = join(rootDir, 'db', 'seed');
const storePath = join(rootDir, 'data', 'youtube.json');
const readSeed = (f) => parseCsv(readFileSync(join(seedDir, f), 'utf8'));

let cache = null;
let cacheKey = '';

// data/youtube.json(npm run ingest 결과)이 있으면 실제 YouTube 데이터를, 없으면 목업을 쓴다.
// DATA_SOURCE=mock 이면 항상 목업을 쓴다.
function readStore() {
  if (process.env.DATA_SOURCE === 'mock' || !existsSync(storePath)) return { real: null, stamp: 'none' };
  try {
    const stamp = String(statSync(storePath).mtimeMs);
    return { real: JSON.parse(readFileSync(storePath, 'utf8')), stamp };
  } catch {
    return { real: null, stamp: 'broken' };
  }
}

function load() {
  const today = todayKst();
  const { mockXss } = getConfig();
  const stamp = existsSync(storePath) && process.env.DATA_SOURCE !== 'mock' ? String(statSync(storePath).mtimeMs) : 'none';
  const key = `${today}|${mockXss}|${stamp}`;
  if (cache && cacheKey === key) return cache;

  const { real } = readStore();
  const realChannels = real?.channels?.filter((c) => c.snapshots?.length && !c.missing) ?? [];
  const useReal = realChannels.length > 0;
  const channels = useReal
    ? realChannels.map((c) => ({
        channel_id: c.channel_id,
        title: c.title,
        handle: c.handle,
        category: c.category,
        is_brand: c.is_brand,
        thumbnail_url: c.thumbnail_url ?? null,
        status: 'active',
        snapshots: [...c.snapshots].sort((a, b) => a.snapshot_date.localeCompare(b.snapshot_date)),
        videos: [...(c.videos ?? [])].sort((a, b) => b.published_at.localeCompare(a.published_at)),
      }))
    : buildMockYoutube({ today, includeXss: mockXss });
  const latestDate = useReal ? channels.map((c) => c.snapshots.at(-1).snapshot_date).sort().at(-1) : today;
  const channelsById = new Map(channels.map((c) => [c.channel_id, c]));
  const videoOwner = new Map();
  for (const c of channels) for (const v of c.videos) videoOwner.set(v.video_id, { channel: c, video: v });

  const products = readSeed('products.csv').map((p) => ({
    ...p,
    price_krw: Number(p.price_krw),
    is_affiliate: p.is_affiliate === 'true',
  }));
  const places = readSeed('places.csv');
  // 실데이터 모드에서는 수집된 영상과 연결되지 않는 목업 멘션을 쓰지 않는다
  const mentionRows = readSeed('mentions.csv')
    .map((m) => ({ ...m, start_sec: Number(m.start_sec), channel_id: videoOwner.get(m.video_id)?.channel.channel_id ?? null }))
    .filter((m) => !useReal || m.channel_id);

  cache = {
    today: latestDate,
    source: useReal ? 'youtube' : 'mock',
    meta: useReal ? { updatedAt: real.updatedAt, unitsUsed: real.unitsUsed, missing: real.missingChannelIds ?? [] } : null,
    channels,
    channelsById,
    videoOwner,
    products,
    productsBySlug: new Map(products.map((p) => [p.slug, p])),
    places,
    placesBySlug: new Map(places.map((p) => [p.slug, p])),
    mentions: mentionRows,
    sponsors: [
      {
        id: 1,
        name: '샘플 스폰서 A',
        headline: '가을 시즌 기획전 (샘플 광고)',
        body: '실제 광고가 아닌 레이아웃 확인용 목업 배너입니다.',
        link_url: 'https://example.com/sponsor-a',
        placement: 'home_top',
      },
      {
        id: 2,
        name: '샘플 스폰서 B',
        headline: '신제품 체험단 모집 (샘플 광고)',
        body: '실제 광고가 아닌 레이아웃 확인용 목업 배너입니다.',
        link_url: 'https://example.com/sponsor-b',
        placement: 'board_side',
      },
      {
        id: 3,
        name: '샘플 스폰서 C',
        headline: '브랜드 협업 문의 (샘플 광고)',
        body: '실제 광고가 아닌 레이아웃 확인용 목업 배너입니다.',
        link_url: 'https://example.com/sponsor-c',
        placement: 'channel_side',
      },
    ],
  };
  cacheKey = key;
  return cache;
}

const latestOf = (c) => c.snapshots[c.snapshots.length - 1];

export async function getLatestSnapshotDate() {
  return load().today;
}

// 모든 활성 채널의 최신 스냅샷 (보드 계산 입력)
export async function listActiveChannelLatest() {
  const { channels } = load();
  return channels
    .filter((c) => c.status === 'active')
    .map((c) => {
      const s = latestOf(c);
      const recent = [...c.videos].sort((a, b) => b.published_at.localeCompare(a.published_at))[0];
      return {
        channel_id: c.channel_id,
        title: c.title,
        handle: c.handle,
        category: c.category,
        is_brand: c.is_brand,
        thumbnail_url: c.thumbnail_url ?? null,
        subscriber_count: s.subscriber_count,
        hidden_subscribers: s.hidden_subscribers,
        view_count: s.view_count,
        video_count: s.video_count,
        snapshot_date: s.snapshot_date,
        recent_video: recent ?? null,
      };
    });
}

// 증가 보드용: 기준 스냅샷 (snapshot_date <= baseDate 중 가장 최근)
export async function getBaseSnapshots(baseDate) {
  const { channels } = load();
  const out = new Map();
  for (const c of channels) {
    if (c.status !== 'active') continue;
    const cands = c.snapshots.filter((s) => s.snapshot_date <= baseDate);
    if (cands.length) out.set(c.channel_id, cands[cands.length - 1]);
  }
  return out;
}

// 채널 상세. status가 excluded여도 반환해 호출 쪽이 410 처리한다.
export async function getChannel(channelId) {
  const { channelsById } = load();
  const c = channelsById.get(channelId);
  if (!c) return null;
  return { ...c, latest: latestOf(c) };
}

export async function listPublicChannelIds() {
  return load().channels.filter((c) => c.status === 'active').map((c) => c.channel_id);
}

function mentionLinks(m) {
  const { videoOwner } = load();
  const owner = videoOwner.get(m.video_id);
  return {
    video_id: m.video_id,
    start_sec: m.start_sec,
    channel_id: owner?.channel.channel_id ?? null,
    channel_title: owner?.channel.title ?? null,
    channel_status: owner?.channel.status ?? null,
    video_title: owner?.video.title ?? null,
    published_at: owner?.video.published_at ?? null,
  };
}

export async function listProducts({ category } = {}) {
  const { products, mentions } = load();
  const counts = new Map();
  for (const m of mentions) if (m.product_slug) counts.set(m.product_slug, (counts.get(m.product_slug) ?? 0) + 1);
  return products
    .filter((p) => !category || p.category === category)
    .map((p) => ({ ...p, mention_count: counts.get(p.slug) ?? 0 }));
}

export async function listProductCategories() {
  return [...new Set(load().products.map((p) => p.category))];
}

export async function getProduct(slug) {
  const { productsBySlug, mentions } = load();
  const p = productsBySlug.get(slug);
  if (!p) return null;
  const videos = mentions
    .filter((m) => m.product_slug === slug)
    .map(mentionLinks)
    .filter((m) => m.channel_status !== 'excluded')
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
    .slice(0, 10);
  return { ...p, videos };
}

export async function listPlaces({ district, type } = {}) {
  const { places, mentions } = load();
  const counts = new Map();
  for (const m of mentions) if (m.place_slug) counts.set(m.place_slug, (counts.get(m.place_slug) ?? 0) + 1);
  return places
    .filter((p) => (!district || p.district === district) && (!type || p.place_type === type))
    .map((p) => ({ ...p, mention_count: counts.get(p.slug) ?? 0 }));
}

export async function listPlaceFacets() {
  const { places } = load();
  return {
    districts: [...new Set(places.map((p) => p.district))],
    types: [...new Set(places.map((p) => p.place_type))],
  };
}

export async function getPlace(slug) {
  const { placesBySlug, mentions } = load();
  const p = placesBySlug.get(slug);
  if (!p) return null;
  const videos = mentions
    .filter((m) => m.place_slug === slug)
    .map(mentionLinks)
    .filter((m) => m.channel_status !== 'excluded')
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))
    .slice(0, 10);
  return { ...p, videos };
}

// 채널 상세의 "이 채널에 나온 제품·장소"
export async function getChannelMentions(channelId) {
  const { mentions, productsBySlug, placesBySlug } = load();
  const mine = mentions.filter((m) => m.channel_id === channelId);
  const products = new Map();
  const places = new Map();
  // mention_count는 "이 채널의 영상에서 언급된 횟수"
  for (const m of mine) {
    if (m.product_slug && productsBySlug.has(m.product_slug)) {
      const cur = products.get(m.product_slug) ?? { ...productsBySlug.get(m.product_slug), mention_count: 0 };
      products.set(m.product_slug, { ...cur, mention_count: cur.mention_count + 1 });
    }
    if (m.place_slug && placesBySlug.has(m.place_slug)) {
      const cur = places.get(m.place_slug) ?? { ...placesBySlug.get(m.place_slug), mention_count: 0 };
      places.set(m.place_slug, { ...cur, mention_count: cur.mention_count + 1 });
    }
  }
  return { products: [...products.values()], places: [...places.values()] };
}

export async function listSponsors(placement) {
  return load().sponsors.filter((s) => s.placement === placement);
}

// 홈 하이라이트용: 언급이 많은 순
export async function highlightProducts(n = 4) {
  const all = await listProducts();
  return all.sort((a, b) => b.mention_count - a.mention_count || a.slug.localeCompare(b.slug)).slice(0, n);
}
export async function highlightPlaces(n = 3) {
  const all = await listPlaces();
  return all.sort((a, b) => b.mention_count - a.mention_count || a.slug.localeCompare(b.slug)).slice(0, n);
}

// 제외 요청 목업 저장소 (메모리). 실제 구현은 takedown_requests 테이블.
const takedowns = [];
export async function saveTakedown(entry) {
  takedowns.push(entry);
  return entry;
}
export async function countTakedownsToday(todayKey) {
  return takedowns.filter((t) => t.receivedOn === todayKey).length;
}

export async function dbStatus() {
  return { connected: false, mode: dataMode() === 'youtube' ? 'youtube-json' : 'mock' };
}

// 'youtube' = data/youtube.json의 실제 수집 데이터, 'mock' = 가상 데이터
export function dataMode() {
  return load().source;
}

export function getIngestMeta() {
  const c = load();
  return { source: c.source, ...(c.meta ?? {}), channelCount: c.channels.length, snapshotDate: c.today };
}
