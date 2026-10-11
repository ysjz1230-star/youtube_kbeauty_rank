// Neon 기반 데이터 원천. lib/data/mock.js와 같은 함수 이름·반환 형태를 따른다.
import { q, num } from './neon.js';

const D = (col) => `to_char(${col}, 'YYYY-MM-DD')`;
const TS = (col) => `to_char(${col} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')`;

const snap = (r) => ({
  snapshot_date: r.snapshot_date,
  subscriber_count: num(r.subscriber_count),
  hidden_subscribers: r.hidden_subscribers,
  view_count: num(r.view_count),
  video_count: num(r.video_count),
});

export async function hasData() {
  const [r] = await q('select count(*)::int as n from channel_snapshots');
  return r.n > 0;
}

export async function getLatestSnapshotDate() {
  const [r] = await q(`select ${D('max(snapshot_date)')} as d from channel_snapshots`);
  return r?.d ?? null;
}

export async function listActiveChannelLatest() {
  const rows = await q(`
    select c.channel_id, c.title, c.handle, c.category, c.is_brand, c.thumbnail_url,
           s.subscriber_count, s.hidden_subscribers, s.view_count, s.video_count, ${D('s.snapshot_date')} as snapshot_date,
           v.video_id as rv_id, v.title as rv_title, ${TS('v.published_at')} as rv_published
    from channels c
    join lateral (select * from channel_snapshots where channel_id = c.channel_id order by snapshot_date desc limit 1) s on true
    left join lateral (select * from videos where channel_id = c.channel_id order by published_at desc nulls last limit 1) v on true
    where c.status = 'active' and c.title is not null`);
  return rows.map((r) => ({
    channel_id: r.channel_id,
    title: r.title,
    handle: r.handle,
    category: r.category,
    is_brand: r.is_brand,
    thumbnail_url: r.thumbnail_url,
    subscriber_count: num(r.subscriber_count),
    hidden_subscribers: r.hidden_subscribers,
    view_count: num(r.view_count),
    video_count: num(r.video_count),
    snapshot_date: r.snapshot_date,
    recent_video: r.rv_id ? { video_id: r.rv_id, title: r.rv_title, published_at: r.rv_published } : null,
  }));
}

export async function getBaseSnapshots(baseDate) {
  const rows = await q(
    `select distinct on (channel_id) channel_id, ${D('snapshot_date')} as snapshot_date, subscriber_count, hidden_subscribers, view_count, video_count
     from channel_snapshots where snapshot_date <= $1 order by channel_id, snapshot_date desc`,
    [baseDate],
  );
  return new Map(rows.map((r) => [r.channel_id, snap(r)]));
}

export async function getChannel(channelId) {
  const [c] = await q('select channel_id, title, handle, thumbnail_url, category, is_brand, status from channels where channel_id = $1', [channelId]);
  if (!c) return null;
  const snaps = await q(
    `select ${D('snapshot_date')} as snapshot_date, subscriber_count, hidden_subscribers, view_count, video_count
     from channel_snapshots where channel_id = $1 order by snapshot_date`,
    [channelId],
  );
  if (!snaps.length && c.status !== 'excluded') return null;
  const vids = await q(
    `select video_id, channel_id, title, ${TS('published_at')} as published_at, thumbnail_url, view_count
     from videos where channel_id = $1 order by published_at desc nulls last limit 10`,
    [channelId],
  );
  const snapshots = snaps.map(snap);
  return {
    ...c,
    snapshots,
    videos: vids.map((v) => ({ ...v, view_count: num(v.view_count) })),
    latest: snapshots.at(-1) ?? { snapshot_date: null, subscriber_count: null, hidden_subscribers: false, view_count: 0, video_count: 0 },
  };
}

export async function listPublicChannelIds() {
  const rows = await q(`select channel_id from channels where status = 'active' and title is not null order by channel_id`);
  return rows.map((r) => r.channel_id);
}

const product = (r) => ({ ...r, price_krw: num(r.price_krw), mention_count: num(r.mention_count) ?? 0 });
const PRODUCT_COLS = `p.slug, p.brand, p.name_ko, p.category, p.price_krw, ${D('p.price_checked_on')} as price_checked_on, p.description, p.buy_url, p.is_affiliate`;

export async function listProducts({ category } = {}) {
  const rows = await q(
    `select ${PRODUCT_COLS}, (select count(*) from video_mentions m where m.product_id = p.product_id) as mention_count
     from products p where p.deleted_at is null and ($1::text is null or p.category = $1) order by p.slug`,
    [category ?? null],
  );
  return rows.map(product);
}

export async function listProductCategories() {
  const rows = await q('select distinct category from products where deleted_at is null order by category');
  return rows.map((r) => r.category);
}

const MENTION_VIDEOS = (col) => `
  select m.video_id, m.start_sec, m.channel_id, c.title as channel_title, c.status as channel_status,
         v.title as video_title, ${TS('v.published_at')} as published_at
  from video_mentions m
  join channels c on c.channel_id = m.channel_id
  left join videos v on v.video_id = m.video_id
  where m.${col} = $1 and c.status <> 'excluded'
  order by v.published_at desc nulls last limit 10`;

export async function getProduct(slug) {
  const [p] = await q(`select p.product_id, ${PRODUCT_COLS} from products p where p.slug = $1 and p.deleted_at is null`, [slug]);
  if (!p) return null;
  const { product_id, ...rest } = p;
  const videos = await q(MENTION_VIDEOS('product_id'), [product_id]);
  return { ...product({ ...rest, mention_count: videos.length }), videos: videos.map((v) => ({ ...v, start_sec: num(v.start_sec) })) };
}

export async function listPlaces({ district, type } = {}) {
  return q(
    `select p.slug, p.name_ko, p.place_type, p.district, p.address, p.website_url, p.description,
            (select count(*)::int from video_mentions m where m.place_id = p.place_id) as mention_count
     from places p where p.deleted_at is null and ($1::text is null or p.district = $1) and ($2::text is null or p.place_type = $2)
     order by p.slug`,
    [district ?? null, type ?? null],
  );
}

export async function listPlaceFacets() {
  const [d, t] = await Promise.all([
    q('select distinct district from places where deleted_at is null and district is not null order by district'),
    q('select distinct place_type from places where deleted_at is null order by place_type'),
  ]);
  return { districts: d.map((r) => r.district), types: t.map((r) => r.place_type) };
}

export async function getPlace(slug) {
  const [p] = await q(
    'select place_id, slug, name_ko, place_type, district, address, website_url, description from places where slug = $1 and deleted_at is null',
    [slug],
  );
  if (!p) return null;
  const { place_id, ...rest } = p;
  const videos = await q(MENTION_VIDEOS('place_id'), [place_id]);
  return { ...rest, mention_count: videos.length, videos: videos.map((v) => ({ ...v, start_sec: num(v.start_sec) })) };
}

export async function getChannelMentions(channelId) {
  const [products, places] = await Promise.all([
    q(
      `select ${PRODUCT_COLS}, count(*)::int as mention_count
       from video_mentions m join products p on p.product_id = m.product_id
       where m.channel_id = $1 and p.deleted_at is null group by p.product_id order by mention_count desc, p.slug`,
      [channelId],
    ),
    q(
      `select p.slug, p.name_ko, p.place_type, p.district, p.address, p.website_url, p.description, count(*)::int as mention_count
       from video_mentions m join places p on p.place_id = m.place_id
       where m.channel_id = $1 and p.deleted_at is null group by p.place_id order by mention_count desc, p.slug`,
      [channelId],
    ),
  ]);
  return { products: products.map(product), places };
}

export async function listSponsors(placement) {
  const rows = await q(
    `select id, name, link_url, placement from sponsors
     where placement = $1 and is_active and current_date between starts_on and ends_on order by id`,
    [placement],
  );
  return rows.map((r) => ({ ...r, headline: r.name, body: '' }));
}

export async function highlightProducts(n = 4) {
  return (await listProducts()).sort((a, b) => b.mention_count - a.mention_count || a.slug.localeCompare(b.slug)).slice(0, n);
}

export async function highlightPlaces(n = 3) {
  return (await listPlaces()).sort((a, b) => b.mention_count - a.mention_count || a.slug.localeCompare(b.slug)).slice(0, n);
}

export async function saveTakedown(entry) {
  await q('insert into takedown_requests (channel_id, contact_email, message, due_at) values ($1, $2, $3, $4)', [
    entry.channelId,
    entry.contactEmail,
    entry.message,
    entry.dueAt,
  ]);
  return entry;
}

export async function countTakedownsToday() {
  const [r] = await q(`select count(*)::int as n from takedown_requests where received_at > now() - interval '24 hours'`);
  return r.n;
}

export async function dbStatus() {
  await q('select 1');
  return { connected: true, mode: 'neon' };
}

export async function getIngestMeta() {
  const [runs, counts] = await Promise.all([
    q(`select ${TS('finished_at')} as finished_at, units_used from ingest_runs where status in ('ok','partial') order by id desc limit 1`),
    q(`select count(*)::int as n from channels where status = 'active' and title is not null`),
  ]);
  return {
    source: 'db',
    updatedAt: runs[0]?.finished_at ?? null,
    unitsUsed: runs[0]?.units_used ?? null,
    channelCount: counts[0].n,
    snapshotDate: await getLatestSnapshotDate(),
    missing: [],
  };
}

export const dataMode = () => 'db';
