// 30일 초과 데이터·제외 채널 삭제 (후속 단계에서 구현). 보관 기준일 계산은 lib/format.js의 retentionCutoff().
export default async function handler(req, res) {
  res.statusCode = 501;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify({ data: null, error: { code: 'SERVER_MISCONFIGURED', message: '정리 작업은 아직 구현되지 않았습니다.' } }));
}
