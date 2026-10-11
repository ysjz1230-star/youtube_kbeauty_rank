// 모든 화면 요청을 받아 경로를 해석하고 HTML을 만든다 (vercel.json rewrites).
import { getConfig, BOARDS } from '../lib/config.js';
import { boardSchema, categorySchema, boardQuerySchema, channelIdSchema, slugSchema } from '../lib/validate.js';
import * as data from '../lib/data/mock.js';
import { getRawBoard, getGainBoard, categoryCounts } from '../lib/ranking.js';
import { curatedBlock } from '../lib/render/layout.js';
import { renderHome } from '../lib/render/home.js';
import { renderBoard } from '../lib/render/board.js';
import { renderChannel } from '../lib/render/channel.js';
import { renderProducts, renderProduct } from '../lib/render/products.js';
import { renderPlaces, renderPlace } from '../lib/render/places.js';
import { renderAbout, renderTakedown, renderError } from '../lib/render/static.js';
import { toStr } from '../lib/escape.js';
import { diagnosticsEnabled, runDiagnostics } from '../lib/diagnostics.js';
import { renderStatus } from '../lib/render/status.js';

const CACHE_OK = 'public, s-maxage=3600, stale-while-revalidate=86400';
const CACHE_SHORT = 'public, s-maxage=60';

const notFound = () => ({
  status: 404,
  cache: CACHE_SHORT,
  html: renderError({ status: 404, title: '페이지를 찾을 수 없어요', message: '주소가 바뀌었거나 존재하지 않는 페이지입니다.' }),
});

const gone = () => ({
  status: 410,
  cache: CACHE_SHORT,
  html: renderError({ status: 410, title: '삭제된 채널입니다', message: '운영자의 요청으로 이 채널의 정보가 삭제되었습니다.' }),
});

async function sponsorsByPlacement() {
  const [home_top, board_side, channel_side] = await Promise.all(
    ['home_top', 'board_side', 'channel_side'].map(async (p) => (await data.listSponsors(p))[0]),
  );
  return { home_top, board_side, channel_side };
}

async function curated() {
  const [products, places] = await Promise.all([data.highlightProducts(3), data.highlightPlaces(3)]);
  return curatedBlock({ products, places });
}

export async function route(pathname, searchParams) {
  const cfg = getConfig();
  const parts = pathname.split('/').filter(Boolean);
  const query = Object.fromEntries(searchParams.entries());
  const [a, b, c] = parts;

  if (parts.length === 0) {
    const [board, counts, products, places, sponsors] = await Promise.all([
      getRawBoard({ board: 'subscribers', page: 1 }),
      categoryCounts(),
      data.highlightProducts(4),
      data.highlightPlaces(3),
      sponsorsByPlacement(),
    ]);
    return {
      status: 200,
      cache: CACHE_OK,
      html: renderHome({
        top: board.items.slice(0, 10),
        snapshotDate: board.snapshotDate,
        channelCount: counts.all,
        products,
        places,
        sponsor: sponsors.home_top,
      }),
    };
  }

  if (a === 'ranking' && b && parts.length <= 3) {
    const board = boardSchema.safeParse(b);
    if (!board.success) return notFound();
    if (BOARDS[board.data].derived && !cfg.derivedMetrics) return notFound();
    let category;
    if (c !== undefined) {
      const cat = categorySchema.safeParse(c);
      if (!cat.success) return notFound();
      category = cat.data;
    }
    const q = boardQuerySchema.parse(query);
    const period = Number(q.period);
    const args = { board: board.data, category, type: q.type, page: q.page, period };
    const [result, counts, sponsors, cur] = await Promise.all([
      BOARDS[board.data].derived ? getGainBoard(args) : getRawBoard(args),
      categoryCounts(q.type),
      sponsorsByPlacement(),
      curated(),
    ]);
    return {
      status: 200,
      cache: CACHE_OK,
      html: renderBoard({ ...args, result, categoryCounts: counts, sponsors, curated: cur, path: pathname }),
    };
  }

  if (a === 'channel' && b && parts.length === 2) {
    if (!channelIdSchema.safeParse(b).success) return notFound();
    const channel = await data.getChannel(b);
    if (!channel) return notFound();
    if (channel.status === 'excluded') return gone();
    const [mentions, sponsors, cur] = await Promise.all([data.getChannelMentions(b), sponsorsByPlacement(), curated()]);
    return {
      status: 200,
      cache: CACHE_OK,
      html: renderChannel({ channel, mentions, sponsor: sponsors.channel_side, curated: cur, today: await data.getLatestSnapshotDate() }),
    };
  }

  if (a === 'products' && parts.length === 1) {
    const categories = await data.listProductCategories();
    const category = categories.includes(query.category) ? query.category : undefined;
    if (query.category && !category) return notFound();
    const [products, sponsors] = await Promise.all([data.listProducts({ category }), sponsorsByPlacement()]);
    const all = category ? await data.listProducts() : products;
    return {
      status: 200,
      cache: CACHE_OK,
      html: renderProducts({ products, categories, category, sponsor: sponsors.home_top, totalCount: all.length }),
    };
  }

  if (a === 'product' && b && parts.length === 2) {
    if (!slugSchema.safeParse(b).success) return notFound();
    const product = await data.getProduct(b);
    if (!product) return notFound();
    const sponsors = await sponsorsByPlacement();
    return { status: 200, cache: CACHE_OK, html: renderProduct({ product, sponsor: sponsors.channel_side }) };
  }

  if (a === 'places' && parts.length === 1) {
    const facets = await data.listPlaceFacets();
    const district = facets.districts.includes(query.district) ? query.district : undefined;
    const type = facets.types.includes(query.type) ? query.type : undefined;
    if ((query.district && !district) || (query.type && !type)) return notFound();
    const [places, sponsors] = await Promise.all([data.listPlaces({ district, type }), sponsorsByPlacement()]);
    return { status: 200, cache: CACHE_OK, html: renderPlaces({ places, facets, district, type, sponsor: sponsors.home_top }) };
  }

  if (a === 'place' && b && parts.length === 2) {
    if (!slugSchema.safeParse(b).success) return notFound();
    const place = await data.getPlace(b);
    if (!place) return notFound();
    const sponsors = await sponsorsByPlacement();
    return { status: 200, cache: CACHE_OK, html: renderPlace({ place, sponsor: sponsors.channel_side }) };
  }

  if (a === 'about' && parts.length === 1) {
    return { status: 200, cache: CACHE_OK, html: renderAbout({ snapshotDate: await data.getLatestSnapshotDate() }) };
  }

  if (a === 'takedown' && parts.length === 1) {
    return { status: 200, cache: 'no-store', html: renderTakedown({ received: query.received === '1' }) };
  }

  // 개발용 점검 화면: 로컬에서만 열린다 (배포 환경에서는 404)
  if (a === 'dev' && b === 'status' && parts.length === 2 && diagnosticsEnabled()) {
    const report = await runDiagnostics({ refresh: query.refresh === '1' });
    return { status: 200, cache: 'no-store', html: renderStatus({ report }) };
  }

  return notFound();
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.setHeader('Allow', 'GET, HEAD');
    res.end('Method Not Allowed');
    return;
  }
  let out;
  try {
    const url = new URL(req.url, 'http://localhost');
    const pathname = decodeURIComponent(url.pathname).replace(/\/+$/, '') || '/';
    out = await route(pathname, url.searchParams);
  } catch (err) {
    console.error('[page] render failed:', err?.stack ?? err?.message);
    let fallback;
    try {
      fallback = toStr(renderError({ status: 503, title: '잠시 후 다시 시도해 주세요', message: '데이터를 불러오지 못했습니다.' }));
    } catch (err2) {
      console.error('[page] error page failed:', err2?.message);
      fallback = '<!doctype html><meta charset="utf-8"><title>잠시 후 다시 시도해 주세요</title><p>데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p>';
    }
    out = { status: 503, cache: 'no-store', html: fallback };
  }
  res.statusCode = out.status;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', out.cache);
  res.end(req.method === 'HEAD' ? undefined : toStr(out.html));
}
