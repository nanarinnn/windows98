const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

// vercel.json 의 보안 헤더와 동일하게 유지한다.
const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // app.js 가 onclick="..." 인라인 핸들러를 생성한다
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "font-src 'self' https://cdn.jsdelivr.net",
    "img-src 'self' data: blob:",
    "media-src 'self' blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
};

app.use((req, res, next) => {
  res.set(SECURITY_HEADERS);
  next();
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

// 공개 허용 목록 (vercel.json 의 builds 와 동일한 범위).
// 프로젝트 루트 전체를 서빙하면 .git, server.js, *.md, 소스 원본(.psd) 등이 노출된다.
const PUBLIC_DIRS = new Set(['field', 'image', 'movies']);
const ROOT_FILE = /^[^/\\]+\.(?:html|css|js|mp4|png|jpg|txt)$/i;
const ROOT_DENY = new Set(['server.js']);

function isPublic(urlPath) {
  let p;
  try { p = decodeURIComponent(urlPath); } catch (e) { return false; }
  if (p.includes('\0') || p.includes('\\')) return false;
  const parts = p.split('/').filter(Boolean);
  if (parts.some(seg => seg.startsWith('.') || seg === '..')) return false;
  if (parts.length === 0) return true; // "/"
  if (parts.length === 1) return ROOT_FILE.test(parts[0]) && !ROOT_DENY.has(parts[0].toLowerCase());
  return PUBLIC_DIRS.has(parts[0]);
}

app.use((req, res, next) => {
  if (req.path.includes('.') || req.path === '/') {
    return isPublic(req.path) ? next() : res.status(404).send('Not found');
  }
  if (!isPublic(req.path)) return res.status(404).send('Not found');
  next();
});

app.use(express.static(__dirname, { dotfiles: 'ignore', index: 'index.html' }));

// 확장자 없는 경로만 SPA 폴백으로 index.html 을 돌려준다. 없는 파일은 404.
app.get('*', (req, res) => {
  if (path.extname(req.path)) return res.status(404).send('Not found');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  Windows 98 VTuber Fan Page Dev Server is running`);
  console.log(`  Local URL: http://localhost:${PORT}`);
  console.log(`==================================================`);
});
