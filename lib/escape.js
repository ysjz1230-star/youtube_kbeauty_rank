// HTML 조립 도구. `html` 태그 템플릿은 보간된 값을 모두 이스케이프하고,
// raw()/html 결과(Safe)만 그대로 통과시킨다. 템플릿 함수는 이스케이프된 값만 만든다.
const MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => MAP[c]);
}

class Safe {
  constructor(s) {
    this.s = s;
  }
  toString() {
    return this.s;
  }
}

export const raw = (s) => new Safe(String(s));

function render(v) {
  if (v instanceof Safe) return v.s;
  if (Array.isArray(v)) return v.map(render).join('');
  if (v === false || v === null || v === undefined) return '';
  return escapeHtml(v);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((v, i) => {
    out += render(v) + strings[i + 1];
  });
  return new Safe(out);
}

export const toStr = (v) => (v instanceof Safe ? v.s : String(v));

// 외부 링크는 http(s)만 허용한다.
export function safeUrl(url) {
  try {
    const u = new URL(String(url));
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : '#';
  } catch {
    return '#';
  }
}

// <script type="application/ld+json"> 안에 넣을 JSON.
// '<'와 줄 구분자(U+2028/2029)를 \uXXXX 형태로 바꿔 태그 탈출·스크립트 오류를 막는다.
const BACKSLASH = String.fromCharCode(92);
const LINE_SEP = String.fromCharCode(0x2028);
const PARA_SEP = String.fromCharCode(0x2029);

export function jsonForScript(obj) {
  return JSON.stringify(obj)
    .split('<')
    .join(`${BACKSLASH}u003c`)
    .split(LINE_SEP)
    .join(`${BACKSLASH}u2028`)
    .split(PARA_SEP)
    .join(`${BACKSLASH}u2029`);
}
