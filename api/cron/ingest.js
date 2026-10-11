// 일일 수집 (후속 단계에서 구현): channels → uploads(청크) → videos.
// 지금은 목업 데이터로 화면을 먼저 완성하는 단계라 호출되지 않는다.
export default async function handler(req, res) {
  res.statusCode = 501;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ data: null, error: { code: 'SERVER_MISCONFIGURED', message: '수집 기능은 아직 구현되지 않았습니다.' } }));
}
