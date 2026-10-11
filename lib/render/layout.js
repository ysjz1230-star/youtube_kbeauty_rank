// 공통 레이아웃과 재사용 컴포넌트. 모든 값은 html 태그 템플릿을 거쳐 이스케이프된다.
import { html, raw, safeUrl } from '../escape.js';
import { CATEGORIES, SITE_NAME, categoryByKey, getConfig } from '../config.js';
import { headTags } from '../seo.js';
import { compactKo, fullNumber } from '../format.js';
import { diagnosticsEnabled } from '../diagnostics.js';
import { dataMode } from '../data/mock.js';

const NAV = [
  { href: '/', label: '홈', match: (p) => p === '/' },
  { href: '/ranking/subscribers', label: '채널 랭킹', match: (p) => p.startsWith('/ranking') || p.startsWith('/channel') },
  { href: '/products', label: '화제의 뷰티템', match: (p) => p.startsWith('/product') },
  { href: '/places', label: '성지 뷰티스팟', match: (p) => p.startsWith('/place') },
  { href: '/about', label: '서비스 소개', match: (p) => p === '/about' },
];

export function layout({ path, title, description, noindex, jsonld, body, showCategories = true, activeCategory }) {
  const cfg = getConfig();
  return html`<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light dark" />
  ${headTags({ title, description, path, noindex, jsonld, siteUrl: cfg.siteUrl })}
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/styles.css" />
  <script src="/app.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">본문으로 건너뛰기</a>
  <header class="site-header">
    <div class="container header-row">
      <a class="brand" href="/"><span class="brand-mark" aria-hidden="true"></span>K-Beauty <b>Rank</b></a>
      <nav class="main-nav" aria-label="주요 메뉴">
        <ul>
          ${NAV.map((n) => html`<li><a href="${n.href}" ${n.match(path) ? raw('aria-current="page"') : ''}>${n.label}</a></li>`)}
        </ul>
      </nav>
      <div class="header-aux"><a href="/takedown">채널 제외 요청</a></div>
    </div>
    ${showCategories ? categoryBar(activeCategory) : ''}
  </header>
  <main id="main" class="container page">${body}</main>
  ${footer()}
</body>
</html>`;
}

function categoryBar(active) {
  return html`<nav class="cat-bar" aria-label="카테고리 바로가기">
    <div class="container">
      <a class="chip" href="/ranking/subscribers" ${!active ? raw('aria-current="true"') : ''}>전체</a>
      ${CATEGORIES.map(
        (c) => html`<a class="chip" href="/ranking/subscribers/${c.key}" ${active === c.key ? raw('aria-current="true"') : ''}>${c.label}</a>`,
      )}
    </div>
  </nav>`;
}

function footer() {
  return html`<footer class="site-footer">
    <div class="container">
      <div class="api-notice">
        <p><span class="pill pill-neutral">API 준수</span> 이 서비스는 YouTube API 서비스를 사용합니다. 순위는 YouTube가 제공한 원본 수치를 일 단위로 정렬한 것입니다.</p>
        <p>
          <a href="https://www.youtube.com/t/terms" rel="noopener noreferrer" target="_blank">YouTube 서비스 약관</a> ·
          <a href="https://policies.google.com/privacy" rel="noopener noreferrer" target="_blank">Google 개인정보처리방침</a>
        </p>
      </div>
      <nav class="footer-links" aria-label="푸터 메뉴">
        <a href="/about">서비스 소개</a>
        <a href="/takedown">채널 제외 요청</a>
        <a href="/about#ads">광고 및 제휴 안내</a>
        ${diagnosticsEnabled() ? html`<a href="/dev/status">개발용 상태 점검</a>` : ''}
      </nav>
      <p class="copy">© 2026 ${SITE_NAME}. ${dataMode() === 'youtube' ? 'YouTube API에서 수집한 데이터 기준입니다.' : '목업 데이터로 구성된 화면입니다.'}</p>
    </div>
  </footer>`;
}

// ── 컴포넌트 ──

export function breadcrumb(items) {
  return html`<nav class="breadcrumb" aria-label="현재 위치"><ol>
    ${items.map((it, i) =>
      i === items.length - 1 ? html`<li aria-current="page">${it.name}</li>` : html`<li><a href="${it.path}">${it.name}</a></li>`,
    )}
  </ol></nav>`;
}

export function categoryPill(key) {
  const c = categoryByKey(key);
  if (!c) return '';
  return html`<span class="pill pill-${c.tone}">${c.label}</span>`;
}

// 구독자·조회수: 축약 표기 + 정확한 값은 title과 스크린리더 텍스트로 제공
export function metricNumber(n, unit = '') {
  if (n === null || n === undefined) return html`<span class="muted">비공개</span>`;
  return html`<span class="metric tnum" title="${fullNumber(n)}${unit}">${compactKo(n)}${unit}</span><span class="sr-only">${fullNumber(n)}${unit}</span>`;
}

const AVATAR_TONES = 8; // 색은 styles.css의 .av-0 ~ .av-7 (인라인 style은 CSP로 막혀 있다)
// YouTube가 제공한 이미지 주소만 허용한다 (CSP img-src와 같은 목록)
const IMG_HOSTS = new Set(['i.ytimg.com', 'yt3.ggpht.com', 'yt3.googleusercontent.com']);
export function ytImage(url) {
  try {
    const u = new URL(String(url));
    return u.protocol === 'https:' && IMG_HOSTS.has(u.hostname) ? u.toString() : null;
  } catch {
    return null;
  }
}

export function avatar(title, id, large = false, imageUrl = null) {
  const img = ytImage(imageUrl);
  const size = large ? 72 : 44;
  if (img) {
    return html`<img class="avatar avatar-img ${large ? 'avatar-lg' : ''}" src="${img}" alt="" width="${size}" height="${size}" loading="lazy" referrerpolicy="no-referrer" />`;
  }
  const i = [...String(id)].reduce((a, ch) => (a + ch.charCodeAt(0)) % AVATAR_TONES, 0);
  const initial = [...String(title)][0] ?? '?';
  return html`<span class="avatar av-${i} ${large ? 'avatar-lg' : ''}" aria-hidden="true">${initial}</span>`;
}

// 스폰서 배너. 영상 플레이어 밖의 별도 영역에서만 쓴다.
export function adSlot(sponsor, placement) {
  if (!sponsor) return '';
  return html`<aside class="ad-slot ${placement}" aria-label="광고">
    <div class="ad-top"><span class="badge-ad">광고</span><span>${sponsor.name}</span></div>
    <div>
      <h3>${sponsor.headline}</h3>
      <p class="small muted">${sponsor.body}</p>
    </div>
    <a class="btn btn-primary" href="${safeUrl(sponsor.link_url)}" rel="sponsored noopener" target="_blank">자세히 보기</a>
  </aside>`;
}

// 광고가 있는 페이지에 반드시 함께 들어가는 자체 큐레이션 블록 (III.G.1.d)
export function curatedBlock({ products, places }) {
  return html`<section aria-labelledby="curated-h" class="card card-pad">
    <div class="section-head"><h2 id="curated-h">큐레이션: 제품·장소</h2><a class="more" href="/products">전체 보기</a></div>
    <div class="grid cols-2">
      <div>
        <h3 class="small muted">화제의 뷰티템</h3>
        <ul>${products.map((p) => html`<li><a href="/product/${p.slug}">${p.brand} · ${p.name_ko}</a></li>`)}</ul>
      </div>
      <div>
        <h3 class="small muted">성지 뷰티스팟</h3>
        <ul>${places.map((p) => html`<li><a href="/place/${p.slug}">${p.name_ko}</a> <span class="muted small">${p.district}</span></li>`)}</ul>
      </div>
    </div>
  </section>`;
}

export function emptyState(message, links = []) {
  return html`<div class="empty card"><p>${message}</p>${
    links.length ? html`<div class="filter-row">${links.map((l) => html`<a class="chip" href="${l.href}">${l.label}</a>`)}</div>` : ''
  }</div>`;
}
