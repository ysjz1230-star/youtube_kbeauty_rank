import { describe, it, expect } from 'vitest';
import { escapeHtml, html, raw, jsonForScript, safeUrl } from '../lib/escape.js';
import { compactKo, parseVideoId, retentionCutoff, addDays, todayKst } from '../lib/format.js';
import { assignRanks } from '../lib/ranking.js';
import { parseCsv } from '../lib/data/csv.js';
import { channelSeedRow, takedownSchema } from '../lib/validate.js';

describe('escape', () => {
  it('이스케이프한다', () => {
    expect(escapeHtml('<script>alert("x")</script>')).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  });
  it('html 태그는 보간 값을 이스케이프하고 raw만 통과시킨다', () => {
    expect(String(html`<p>${'<b>'}</p>`)).toBe('<p>&lt;b&gt;</p>');
    expect(String(html`<p>${raw('<b>')}</p>`)).toBe('<p><b></p>');
  });
  it('JSON-LD에서 < 를 막는다', () => {
    expect(jsonForScript({ a: '</script>' })).not.toContain('<');
  });
  it('http(s) 외 스킴을 막는다', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('#');
    expect(safeUrl('https://example.com/a')).toBe('https://example.com/a');
  });
});

describe('format', () => {
  it('큰 수를 줄여 쓴다', () => {
    expect(compactKo(9999)).toBe('9,999');
    expect(compactKo(123456)).toBe('12.3만');
    expect(compactKo(5920000)).toBe('592만');
    expect(compactKo(420000000)).toBe('4.2억');
  });
  it('영상 ID를 뽑는다', () => {
    expect(parseVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10')).toBe('dQw4w9WgXcQ');
    expect(parseVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(parseVideoId('https://example.com/x')).toBeNull();
  });
  it('보관 기준일은 오늘 포함 30개 날짜', () => {
    expect(retentionCutoff('2026-10-11', 30)).toBe('2026-09-12');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });
  it('KST 날짜 경계', () => {
    expect(todayKst(new Date('2026-10-10T15:30:00Z'))).toBe('2026-10-11');
  });
});

describe('ranking', () => {
  it('동률은 같은 순위, 순서는 제목순', () => {
    const rows = [
      { title: '다', v: 10 },
      { title: '가', v: 10 },
      { title: '나', v: 5 },
    ];
    const r = assignRanks(rows, (x) => x.v);
    expect(r.map((x) => [x.title, x.rank])).toEqual([['가', 1], ['다', 1], ['나', 3]]);
  });
});

describe('csv·validate', () => {
  it('따옴표 안 쉼표를 처리한다', () => {
    expect(parseCsv('a,b\n1,"x,y"\n')).toEqual([{ a: '1', b: 'x,y' }]);
  });
  it('시드 행을 검증한다', () => {
    const ok = { channel_id: `UC${'a'.repeat(22)}`, category: 'makeup', is_brand: 'false' };
    expect(channelSeedRow.safeParse(ok).success).toBe(true);
    expect(channelSeedRow.safeParse({ ...ok, channel_id: 'UCshort' }).success).toBe(false);
    expect(channelSeedRow.safeParse({ ...ok, category: 'x' }).success).toBe(false);
  });
  it('제외 요청: 허니팟과 길이를 막는다', () => {
    expect(takedownSchema.safeParse({ email: 'a@b.co', website: 'spam' }).success).toBe(false);
    expect(takedownSchema.safeParse({ email: 'a@b.co', message: 'x'.repeat(501) }).success).toBe(false);
    expect(takedownSchema.safeParse({ email: 'a@b.co' }).success).toBe(true);
  });
});
