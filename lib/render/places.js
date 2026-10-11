import { html } from '../escape.js';
import { safeUrl } from '../escape.js';
import { getConfig } from '../config.js';
import { adSlot, breadcrumb, emptyState, layout } from './layout.js';
import { mentionList } from './products.js';
import { breadcrumbLd } from '../seo.js';

export const PLACE_TYPES = {
  drugstore: 'H&B 스토어',
  popup: '팝업스토어',
  brand_store: '브랜드 매장',
  salon: '살롱·숍',
  cafe: '카페',
};
export const placeTypeLabel = (t) => PLACE_TYPES[t] ?? t;

// 지도 SDK는 쓰지 않고 지도 검색 링크만 둔다.
export function mapLinks(p) {
  const q = encodeURIComponent(`${p.name_ko} ${p.district}`);
  return [
    { label: '네이버 지도', href: `https://map.naver.com/p/search/${q}` },
    { label: '카카오맵', href: `https://map.kakao.com/?q=${q}` },
    { label: 'Google 지도', href: `https://www.google.com/maps/search/?api=1&query=${q}` },
  ];
}

export function placeCard(p, i = 0) {
  return html`<article class="card item-card">
    <div class="ph ${['', 'tone-1', 'tone-2'][i % 3]}" role="img" aria-label="장소 이미지 준비 중">${p.district}</div>
    <div class="item-top">
      <span class="pill pill-makeup">${placeTypeLabel(p.place_type)}</span>
      <span class="small muted">연결된 영상 ${p.mention_count}개</span>
    </div>
    <div>
      <h3><a href="/place/${p.slug}">${p.name_ko}</a></h3>
      <p class="small muted">${p.address}</p>
    </div>
    <p class="small">${p.description}</p>
    <div class="link-row">${mapLinks(p).map((l) => html`<a class="btn btn-secondary" href="${l.href}" rel="noopener noreferrer" target="_blank">${l.label}</a>`)}</div>
  </article>`;
}

export function renderPlaces({ places, facets, district, type, sponsor }) {
  const cfg = getConfig();
  const qs = (o) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(o)) if (v) sp.set(k, v);
    const s = sp.toString();
    return `/places${s ? `?${s}` : ''}`;
  };
  const body = html`
    <section class="hero">
      ${breadcrumb([{ name: '홈', path: '/' }, { name: '성지 뷰티스팟', path: '/places' }])}
      <h1>성지 뷰티스팟</h1>
      <p class="lede">K-beauty 크리에이터 영상에 등장한 매장·팝업·살롱을 직접 정리했습니다. 방문 전 운영 여부는 공식 채널에서 확인해 주세요.</p>
    </section>
    <section class="card filter-bar" aria-label="필터">
      <div class="filter-row"><span class="filter-label">지역</span>
        <a class="chip" href="${qs({ type })}" ${!district ? html`aria-current="true"` : ''}>전체</a>
        ${facets.districts.map((d) => html`<a class="chip" href="${qs({ district: d, type })}" ${district === d ? html`aria-current="true"` : ''}>${d}</a>`)}
      </div>
      <div class="filter-row"><span class="filter-label">유형</span>
        <a class="chip" href="${qs({ district })}" ${!type ? html`aria-current="true"` : ''}>전체</a>
        ${facets.types.map((t) => html`<a class="chip" href="${qs({ district, type: t })}" ${type === t ? html`aria-current="true"` : ''}>${placeTypeLabel(t)}</a>`)}
      </div>
    </section>
    ${sponsor ? adSlot(sponsor, 'home_top') : ''}
    ${places.length ? html`<div class="grid cols-3">${places.map(placeCard)}</div>` : emptyState('조건에 맞는 장소가 아직 없어요.', [{ href: '/places', label: '전체 장소' }])}
  `;
  return layout({
    path: '/places',
    title: '성지 뷰티스팟 — K-beauty 영상 속 매장·팝업',
    description: `K-beauty 유튜브 영상에 등장한 장소 ${places.length}곳을 지역·유형별로 정리했습니다.`,
    jsonld: [breadcrumbLd([{ name: '홈', path: '/' }, { name: '성지 뷰티스팟', path: '/places' }], cfg.siteUrl)],
    noindex: Boolean(district || type),
    body,
    showCategories: false,
  });
}

export function renderPlace({ place, sponsor }) {
  const cfg = getConfig();
  const p = place;
  const jsonld = [
    breadcrumbLd([{ name: '홈', path: '/' }, { name: '성지 뷰티스팟', path: '/places' }, { name: p.name_ko, path: `/place/${p.slug}` }], cfg.siteUrl),
    {
      '@context': 'https://schema.org',
      '@type': 'Place',
      name: p.name_ko,
      description: p.description,
      address: { '@type': 'PostalAddress', streetAddress: p.address, addressCountry: 'KR' },
    },
  ];
  const body = html`
    <section class="hero">
      ${breadcrumb([{ name: '홈', path: '/' }, { name: '성지 뷰티스팟', path: '/places' }, { name: p.name_ko, path: `/place/${p.slug}` }])}
      <p class="small muted">${p.district} · ${placeTypeLabel(p.place_type)}</p>
      <h1>${p.name_ko}</h1>
    </section>
    <div class="with-rail">
      <div class="grid">
        <section class="card card-pad">
          <p>${p.description}</p>
          <dl class="kv mt-16">
            <div><dt>주소</dt><dd>${p.address}</dd></div>
            ${p.website_url ? html`<div><dt>웹사이트</dt><dd><a href="${safeUrl(p.website_url)}" rel="noopener noreferrer" target="_blank">공식 페이지</a></dd></div>` : ''}
          </dl>
          <div class="link-row mt-16">${mapLinks(p).map((l) => html`<a class="btn btn-secondary" href="${l.href}" rel="noopener noreferrer" target="_blank">${l.label}</a>`)}</div>
        </section>
        <section class="card card-pad" aria-labelledby="mentioned">
          <div class="section-head"><h2 id="mentioned">언급된 영상</h2></div>
          ${mentionList(p.videos)}
        </section>
      </div>
      <div class="rail">${sponsor ? adSlot(sponsor, 'channel_side') : ''}</div>
    </div>`;
  return layout({
    path: `/place/${p.slug}`,
    title: `${p.name_ko} — ${p.district} ${placeTypeLabel(p.place_type)}`,
    description: `${p.district} ${p.name_ko}. ${p.description} K-beauty 유튜브 영상 ${p.videos.length}개에서 언급되었습니다.`,
    jsonld,
    body,
    showCategories: false,
  });
}
