import { html, raw, escapeHtml } from '../escape.js';
import { BOARDS, CATEGORIES, SITE_NAME, categoryByKey, getConfig } from '../config.js';
import { formatDateKo, formatShortDate, daysAgoKo, fullNumber, compactKo, todayKst } from '../format.js';
import { adSlot, avatar, breadcrumb, categoryPill, curatedBlock, emptyState, layout, metricNumber } from './layout.js';
import { breadcrumbLd, itemListLd } from '../seo.js';

function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') sp.set(k, v);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export function boardPath(board, category) {
  return `/ranking/${board}${category ? `/${category}` : ''}`;
}

function staleBadge(snapshotDate) {
  const days = Math.round((Date.parse(todayKst()) - Date.parse(snapshotDate)) / 86_400_000);
  return days >= 2 ? html`<span class="badge-stale">데이터가 아직 갱신되지 않았어요</span>` : '';
}

// 순위 표 (홈의 TOP10과 보드 페이지가 함께 쓴다)
export function rankTable({ rows, board, caption, derived = false, snapshotDate, finder = false }) {
  const isViews = board.startsWith('views');
  const metricKey = isViews ? 'view_count' : 'subscriber_count';
  return html`<div class="table-wrap">
    <table class="rank-table">
      <caption>${caption}</caption>
      <thead><tr>
        <th scope="col">순위</th>
        <th scope="col">채널</th>
        <th scope="col" class="num">${isViews ? '누적 조회수' : '구독자'}</th>
        ${isViews ? html`<th scope="col" class="num">구독자</th>` : html`<th scope="col" class="num">누적 조회수</th>`}
        ${derived ? html`<th scope="col" class="num">증가수</th><th scope="col" class="num">증가율</th><th scope="col">순위 변동</th>` : ''}
        <th scope="col" class="c-video">최근 영상</th>
      </tr></thead>
      <tbody>
        ${rows.map((r) => {
          const secondary = isViews ? r.subscriber_count : r.view_count;
          const stale = r.snapshot_date !== snapshotDate;
          return html`<tr ${finder ? raw(`data-finder-row="${escapeHtml(`${r.title} ${r.handle}`.toLowerCase())}"`) : ''}>
            <td data-label="순위"><span class="rank-badge ${r.rank <= 3 ? `rank-${r.rank}` : ''}">${r.rank}</span></td>
            <td class="c-channel">
              <div class="ch">
                ${avatar(r.title, r.channel_id, false, r.thumbnail_url)}
                <div>
                  <div class="ch-name"><a href="/channel/${r.channel_id}">${r.title}</a>${categoryPill(r.category)}</div>
                  <div class="ch-sub">${r.handle} · ${r.is_brand ? '브랜드 공식' : '크리에이터'}</div>
                </div>
              </div>
            </td>
            <td class="num" data-label="${isViews ? '누적 조회수' : '구독자'}">
              ${metricNumber(r[metricKey], isViews ? '회' : '')}
              ${stale ? html`<div class="metric-sub">기준 ${formatShortDate(r.snapshot_date)}</div>` : ''}
            </td>
            <td class="num" data-label="${isViews ? '구독자' : '누적 조회수'}">${
              secondary === null
                ? html`<span class="muted">비공개</span>`
                : html`<span class="tnum" title="${fullNumber(secondary)}">${compactKo(secondary)}${isViews ? '' : '회'}</span><span class="sr-only">${fullNumber(secondary)}</span>`
            }</td>
            ${derived ? gainCells(r, isViews) : ''}
            <td class="c-video">${
              r.recent_video
                ? html`<div class="recent-video"><div class="t">${r.recent_video.title}</div><div class="metric-sub">${daysAgoKo(r.recent_video.published_at, snapshotDate)}</div></div>`
                : ''
            }</td>
          </tr>`;
        })}
      </tbody>
    </table>
  </div>`;
}

function gainCells(r, isViews) {
  const unit = isViews ? '회' : '명';
  const up = r.delta > 0;
  const down = r.delta < 0;
  const mark = up ? '▲ 증가' : down ? '▼ 감소' : '– 변동 없음';
  const cls = up ? 'delta-up' : down ? 'delta-down' : 'delta-flat';
  let change;
  if (r.rank_change === null) change = html`<span class="pill pill-neutral">신규</span>`;
  else if (r.rank_change > 0) change = html`<span class="delta-up">▲ ${r.rank_change} 상승</span>`;
  else if (r.rank_change < 0) change = html`<span class="delta-down">▼ ${Math.abs(r.rank_change)} 하락</span>`;
  else change = html`<span class="delta-flat">– 유지</span>`;
  return html`
    <td class="num c-gain" data-label="증가수"><span class="${cls} tnum" title="${fullNumber(r.delta)}${unit}">${mark} ${compactKo(Math.abs(r.delta))}${unit}</span></td>
    <td class="num c-gain" data-label="증가율"><span class="${cls} tnum">${r.delta_pct === null ? '-' : `${r.delta_pct}%`}</span></td>
    <td class="c-gain" data-label="순위 변동">${change}</td>`;
}

export function renderBoard({ board, category, type, page, period, result, categoryCounts, sponsors, curated, path }) {
  const cfg = getConfig();
  const info = BOARDS[board];
  const derived = info.derived;
  const cat = category ? categoryByKey(category) : null;
  const dateKo = formatDateKo(result.snapshotDate);
  const scope = `${cat ? `${cat.label} ` : ''}${type === 'brand' ? '브랜드 공식 채널 ' : type === 'creator' ? '크리에이터 ' : ''}`;
  const heading = `K-beauty 유튜브 채널 ${scope}${info.label}`;
  const periodLabel = derived ? ` (${period === 30 ? `최근 ${result.baseDays}일` : '최근 7일'})` : '';
  const title = `${heading} TOP ${Math.min(result.total, 100)}${periodLabel} · ${dateKo} 기준`;
  const top3 = result.items.slice(0, 3).map((r) => r.title);
  const description = `${dateKo} 기준 ${scope}${info.label}. ${top3.length ? `1위 ${top3.join(', ')} 등` : '등록된 채널이 없습니다.'} YouTube 원본 수치를 정렬한 순위입니다.`;

  const base = boardPath(board, category);
  const q = (extra = {}) => qs({ type, period: derived ? period : undefined, ...extra });
  const boardTabs = ['subscribers', 'views', ...(cfg.derivedMetrics ? ['subscribers-gain', 'views-gain'] : [])];

  const caption = `${dateKo} 기준 ${scope}${info.label}${periodLabel}. 한 페이지에 최대 50개, 상위 100개까지 표시합니다.`;

  const pager =
    result.pageCount > 1
      ? html`<nav class="pager" aria-label="페이지 이동">${Array.from({ length: result.pageCount }, (_, i) => i + 1).map((n) =>
          n === page
            ? html`<span aria-current="page">${n}</span>`
            : html`<a href="${base}${q({ page: n === 1 ? undefined : n })}">${n}</a>`,
        )}</nav>`
      : '';

  const body = html`
    <section class="hero">
      ${breadcrumb([{ name: '홈', path: '/' }, { name: '채널 랭킹', path: '/ranking/subscribers' }, { name: info.label, path: `/ranking/${board}` }, ...(cat ? [{ name: cat.label, path: base }] : [])])}
      <h1>${heading}</h1>
      <div class="hero-meta">
        <span class="meta-chip">기준일 ${dateKo}</span>
        <span class="meta-chip">${fullNumber(result.total)}개 채널</span>
        ${staleBadge(result.snapshotDate)}
      </div>
      <nav class="board-tabs" aria-label="보드 선택">
        ${boardTabs.map((b) => html`<a class="chip" href="${boardPath(b, category)}${qs({ type })}" ${b === board ? raw('aria-current="true"') : ''}>${BOARDS[b].label}</a>`)}
      </nav>
    </section>

    <div class="with-rail">
      <div class="grid">
        <section class="card filter-bar" aria-label="필터">
          <div class="filter-row"><span class="filter-label">카테고리</span>
            <a class="chip" href="${boardPath(board)}${q()}" ${!category ? raw('aria-current="true"') : ''}>전체 <span class="count">(${categoryCounts.all})</span></a>
            ${CATEGORIES.map((c) => html`<a class="chip" href="${boardPath(board, c.key)}${q()}" ${category === c.key ? raw('aria-current="true"') : ''}>${c.label} <span class="count">(${categoryCounts[c.key] ?? 0})</span></a>`)}
          </div>
          <div class="filter-row"><span class="filter-label">유형</span>
            <a class="chip" href="${base}${qs({ period: derived ? period : undefined })}" ${!type ? raw('aria-current="true"') : ''}>전체 채널</a>
            <a class="chip" href="${base}${qs({ type: 'creator', period: derived ? period : undefined })}" ${type === 'creator' ? raw('aria-current="true"') : ''}>크리에이터</a>
            <a class="chip" href="${base}${qs({ type: 'brand', period: derived ? period : undefined })}" ${type === 'brand' ? raw('aria-current="true"') : ''}>브랜드 공식</a>
          </div>
          ${derived ? html`<div class="filter-row"><span class="filter-label">기간</span>
            <a class="chip" href="${base}${qs({ type, period: 7 })}" ${period === 7 ? raw('aria-current="true"') : ''}>7일</a>
            <a class="chip" href="${base}${qs({ type, period: 30 })}" ${period === 30 ? raw('aria-current="true"') : ''}>30일</a></div>` : ''}
          <div class="finder" data-finder>
            <label class="sr-only" for="finder-input">이 표에서 채널 찾기</label>
            <input id="finder-input" type="search" placeholder="이 표에서 채널명·핸들 찾기" autocomplete="off" />
            <p class="sr-only" role="status" aria-live="polite" data-finder-status></p>
          </div>
        </section>

        ${sponsors.board_side ? html`<div class="rail-inline">${adSlot(sponsors.board_side, 'board_side')}</div>` : ''}

        ${
          result.items.length
            ? html`${rankTable({ rows: result.items, board, caption, derived, snapshotDate: result.snapshotDate, finder: true })}
              <div class="table-foot">
                <span>${result.total}개 중 ${(page - 1) * 50 + 1}–${(page - 1) * 50 + result.items.length} 표시${derived && result.pending ? ` · 집계 중인 채널 ${result.pending}개 제외` : ''}</span>
                ${pager}
              </div>`
            : emptyState(derived ? '집계 중입니다. 스냅샷이 더 쌓이면 이 보드가 표시됩니다.' : '아직 등록된 채널이 없어요.', [
                { href: '/ranking/subscribers', label: '전체 보드로' },
                ...CATEGORIES.filter((c) => c.key !== category && categoryCounts[c.key]).slice(0, 3).map((c) => ({ href: boardPath(board, c.key), label: c.label })),
              ])
        }

        <p class="small muted">
          ${board.startsWith('subscribers') ? '구독자 수는 YouTube가 반올림해 제공하므로 오차가 있을 수 있습니다. 구독자 수를 숨긴 채널은 이 보드에서 제외됩니다.' : '누적 조회수는 YouTube가 제공한 값을 그대로 정렬한 것입니다.'}
          동률은 같은 순위로 표시하며 화면 순서는 채널명 순입니다.
        </p>
      </div>

      <div class="rail">
        ${adSlot(sponsors.board_side, 'board_side')}
        ${curated}
      </div>
    </div>`;

  const jsonld = [
    breadcrumbLd([{ name: '홈', path: '/' }, { name: info.label, path: `/ranking/${board}` }, ...(cat ? [{ name: cat.label, path: base }] : [])], cfg.siteUrl),
    itemListLd(result.items.map((r) => ({ name: r.title, path: `/channel/${r.channel_id}` })), cfg.siteUrl),
  ];

  // type 필터 변형은 noindex,follow로 중복을 줄인다
  const canonicalPath = `${base}${page > 1 ? `?page=${page}` : ''}`;
  return layout({ path: canonicalPath, title, description, noindex: Boolean(type), jsonld, body, activeCategory: category });
}
