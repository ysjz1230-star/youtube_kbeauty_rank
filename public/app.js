// 보조 기능만 담당한다 (JS가 꺼져도 모든 화면과 필터는 링크로 동작한다).
(() => {
  // 1) 랭킹 표 안에서 채널명·핸들 즉시 찾기
  const finder = document.querySelector('[data-finder]');
  const rows = [...document.querySelectorAll('[data-finder-row]')];
  if (finder && rows.length) {
    finder.classList.add('is-ready');
    const input = finder.querySelector('input');
    const status = finder.querySelector('[data-finder-status]');
    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase();
      let shown = 0;
      rows.forEach((tr) => {
        const hit = !q || tr.dataset.finderRow.includes(q);
        tr.hidden = !hit;
        if (hit) shown += 1;
      });
      if (status) status.textContent = q ? `${shown}개 채널이 검색되었습니다` : '';
    });
  }

  // 2) 제외 요청 폼: 가능하면 fetch로 보내고, 실패하면 일반 제출로 처리한다
  const form = document.querySelector('[data-takedown-form]');
  if (form && window.fetch) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const out = document.querySelector('[data-takedown-result]');
      const body = Object.fromEntries(new FormData(form).entries());
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        const json = await res.json();
        if (out) {
          out.hidden = false;
          out.textContent = res.ok
            ? '요청이 접수되었습니다. 접수 후 7일 이내에 처리됩니다.'
            : `접수하지 못했습니다: ${json.error?.message ?? '입력값을 확인해 주세요.'}`;
        }
        if (res.ok) form.reset();
      } catch {
        form.submit();
      }
    });
  }
})();
