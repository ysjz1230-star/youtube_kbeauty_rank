import { html } from '../escape.js';
import { safeUrl } from '../escape.js';
import { getConfig } from '../config.js';
import { formatDateKo, krw } from '../format.js';
import { adSlot, breadcrumb, emptyState, layout } from './layout.js';
import { breadcrumbLd } from '../seo.js';

export const videoLink = (id, sec) => `https://www.youtube.com/watch?v=${encodeURIComponent(id)}${sec ? `&t=${Number(sec)}s` : ''}`;

export function mmss(sec) {
  const s = Number(sec) || 0;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// "언급된 영상" 목록. 영상 제목이 없으면 YouTube 링크만 보여준다.
export function mentionList(videos) {
  if (!videos.length) return html`<p class="muted">아직 연결된 영상이 없어요</p>`;
  return html`<ul class="video-list">${videos.map(
    (v) => html`<li>
      <span class="video-thumb" aria-hidden="true">▶</span>
      <div>
        <a href="${videoLink(v.video_id, v.start_sec)}" rel="noopener noreferrer" target="_blank">${v.video_title ?? 'YouTube에서 보기'}</a>
        <div class="small muted">${
          v.channel_id ? html`<a href="/channel/${v.channel_id}">${v.channel_title}</a> · ` : ''
        }${v.start_sec ? `${mmss(v.start_sec)}부터` : ''}</div>
      </div>
    </li>`,
  )}</ul>`;
}

export function buyButton(p) {
  if (!p.buy_url) return '';
  const rel = p.is_affiliate ? 'sponsored noopener noreferrer' : 'noopener noreferrer';
  return html`<a class="btn btn-primary" href="${safeUrl(p.buy_url)}" rel="${rel}" target="_blank">${p.is_affiliate ? '구매처 보기 (광고·제휴 링크)' : '구매처 보기'}</a>`;
}

const TONES = ['', 'tone-1', 'tone-2'];

export function productCard(p, i = 0) {
  return html`<article class="card item-card">
    <div class="ph ${TONES[i % 3]}" role="img" aria-label="제품 이미지 준비 중">${p.category}</div>
    <div class="item-top">
      <span class="pill pill-neutral">${p.category}</span>
      <span class="small muted">연결된 영상 ${p.mention_count}개</span>
    </div>
    <div>
      <p class="small muted">${p.brand}</p>
      <h3><a href="/product/${p.slug}">${p.name_ko}</a></h3>
    </div>
    <p class="price tnum">${krw(p.price_krw)}<small>${p.price_checked_on} 확인</small></p>
    <p class="small">${p.description}</p>
    <div class="link-row">
      <a class="btn btn-secondary" href="/product/${p.slug}">상세 보기</a>
    </div>
    ${p.is_affiliate ? html`<span class="badge-ad">광고·제휴 링크 포함</span>` : ''}
  </article>`;
}

export function renderProducts({ products, categories, category, sponsor, totalCount = products.length }) {
  const cfg = getConfig();
  const title = `화제의 뷰티템${category ? ` · ${category}` : ''}`;
  const body = html`
    <section class="hero">
      ${breadcrumb([{ name: '홈', path: '/' }, { name: '화제의 뷰티템', path: '/products' }])}
      <h1>화제의 뷰티템</h1>
      <p class="lede">K-beauty 유튜브 영상에서 언급된 제품을 직접 정리했습니다. 가격은 확인일 기준이며 달라질 수 있습니다.</p>
    </section>
    <div class="notice"><span aria-hidden="true">ⓘ</span><p>일부 구매 링크는 제휴 링크이며, 이를 통해 구매가 이루어지면 수수료를 받을 수 있습니다. 제품 설명은 사용 후기가 아닌 영상 속 언급을 정리한 내용입니다.</p></div>
    <nav class="filter-row" aria-label="제품 카테고리">
      <a class="chip" href="/products" ${!category ? html`aria-current="true"` : ''}>전체 <span class="count">(${totalCount})</span></a>
      ${categories.map((c) => html`<a class="chip" href="/products?category=${encodeURIComponent(c)}" ${category === c ? html`aria-current="true"` : ''}>${c}</a>`)}
    </nav>
    ${sponsor ? adSlot(sponsor, 'home_top') : ''}
    ${products.length ? html`<div class="grid cols-3">${products.map(productCard)}</div>` : emptyState('해당 카테고리의 제품이 아직 없어요.', [{ href: '/products', label: '전체 제품' }])}
  `;
  return layout({
    path: category ? `/products?category=${category}` : '/products',
    title,
    description: `K-beauty 유튜브 영상에서 언급된 제품 ${products.length}개를 큐레이션했습니다. 가격과 구매처, 언급된 영상을 확인하세요.`,
    jsonld: [breadcrumbLd([{ name: '홈', path: '/' }, { name: '화제의 뷰티템', path: '/products' }], cfg.siteUrl)],
    body,
    showCategories: false,
  });
}

export function renderProduct({ product, sponsor, today }) {
  const cfg = getConfig();
  const p = product;
  const jsonld = [
    breadcrumbLd([{ name: '홈', path: '/' }, { name: '화제의 뷰티템', path: '/products' }, { name: p.name_ko, path: `/product/${p.slug}` }], cfg.siteUrl),
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name_ko,
      brand: { '@type': 'Brand', name: p.brand },
      description: p.description,
      category: p.category,
    },
  ];
  const body = html`
    <section class="hero">
      ${breadcrumb([{ name: '홈', path: '/' }, { name: '화제의 뷰티템', path: '/products' }, { name: p.name_ko, path: `/product/${p.slug}` }])}
      <p class="small muted">${p.brand} · ${p.category}</p>
      <h1>${p.name_ko}</h1>
    </section>
    <div class="with-rail">
      <div class="grid">
        <section class="card card-pad">
          <p class="price tnum">${krw(p.price_krw)}<small>${p.price_checked_on} 확인 기준</small></p>
          <p class="mt-12">${p.description}</p>
          <div class="link-row mt-16">${buyButton(p)}</div>
          ${p.is_affiliate ? html`<p class="small muted mt-8"><span class="badge-ad">광고·제휴 링크</span> 이 링크로 구매하면 수수료를 받을 수 있습니다.</p>` : ''}
        </section>
        <section class="card card-pad" aria-labelledby="mentioned">
          <div class="section-head"><h2 id="mentioned">언급된 영상</h2></div>
          ${mentionList(p.videos)}
        </section>
      </div>
      <div class="rail">${sponsor ? adSlot(sponsor, 'channel_side') : ''}</div>
    </div>`;
  return layout({
    path: `/product/${p.slug}`,
    title: `${p.brand} ${p.name_ko} — 언급된 영상과 구매처`,
    description: `${p.brand} ${p.name_ko}. 가격 ${krw(p.price_krw)}(${formatDateKo(p.price_checked_on)} 확인). K-beauty 유튜브 영상 ${p.videos.length}개에서 언급되었습니다.`,
    jsonld,
    body,
    showCategories: false,
  });
}
