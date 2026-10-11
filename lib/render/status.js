import { html } from '../escape.js';
import { breadcrumb, layout } from './layout.js';

// 색만으로 구분하지 않도록 기호와 텍스트를 함께 쓴다.
const BADGE = {
  ok: { mark: '✔', text: '정상', cls: 'st-ok' },
  warn: { mark: '▲', text: '주의', cls: 'st-warn' },
  error: { mark: '✖', text: '오류', cls: 'st-error' },
  info: { mark: 'ⓘ', text: '참고', cls: 'st-info' },
};

export function renderStatus({ report }) {
  const body = html`
    <section class="hero">
      ${breadcrumb([{ name: '홈', path: '/' }, { name: '개발용 상태 점검', path: '/dev/status' }])}
      <h1>개발용 상태 점검</h1>
      <p class="lede">배포 전 API 키·데이터베이스·설정값이 정상인지 확인하는 화면입니다. 비밀값은 일부(앞 4자, 길이, 호스트)만 표시합니다.</p>
      <div class="hero-meta">
        <span class="meta-chip">데이터 모드: ${report.mode}</span>
        <span class="meta-chip">점검 시각 ${report.checkedAt}</span>
        <a class="btn btn-secondary" href="/dev/status?refresh=1">다시 점검 (YouTube 1 unit 사용)</a>
      </div>
    </section>
    <div class="notice"><span aria-hidden="true">ⓘ</span><p>이 화면은 로컬 환경에서만 열립니다. 배포 환경(Vercel)에서는 404이며 검색엔진에 노출되지 않습니다.</p></div>
    <div class="grid cols-2">
      ${report.items.map((it) => {
        const b = BADGE[it.status] ?? BADGE.info;
        return html`<section class="card card-pad status-card" aria-labelledby="st-${it.id}">
          <div class="item-top">
            <h2 id="st-${it.id}">${it.label}</h2>
            <span class="status-pill ${b.cls}"><span aria-hidden="true">${b.mark}</span> ${b.text}</span>
          </div>
          <p class="status-summary">${it.summary}</p>
          <ul class="status-detail">${it.detail.map((d) => html`<li>${d}</li>`)}</ul>
        </section>`;
      })}
    </div>`;
  return layout({
    path: '/dev/status',
    title: '개발용 상태 점검',
    description: '배포 전 API 키·DB·설정값 점검 화면',
    noindex: true,
    body,
    showCategories: false,
  });
}
