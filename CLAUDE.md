# windows98 작업 규칙

작업 시작 전 `PROJECT_CONTEXT.md`를 읽고, 파일을 변경한 작업마다 `CHANGELOG_AI.md`에
날짜, 목적, 변경 파일, 검증 결과, 미해결 사항을 기록한다.

## 실행
- `npm install` 후 `npm start` (Express 정적 서버, `server.js`)
- 프레임워크/번들러 없음. 정적 HTML/CSS + 전역 JS 함수 구조를 유지한다.
- 테스트: `tests/*.py` 브라우저 스모크 테스트

## Git 워크플로 (사용자 승인 하에 자동 커밋/푸시)
- 저장소: `nanarinnn/windows98`, 브랜치 `main`
- 작업 단위가 끝나고 검증을 마치면 자동으로 커밋하고 `git push`(일반 push)까지 한다.
- 커밋 메시지는 기존 스타일을 따른다: `feat:`, `fix:`, `tune:` 접두사 + 영어 요약.
- `git add .` / `git add -A` 금지. 변경한 파일을 이름으로 지정해 스테이징한다.
- force push, history rewrite(`reset --hard`, `rebase`, `commit --amend` 후 push) 금지.
- push 전 `git fetch`로 원격 변경(GPT 등 다른 도구의 작업)을 확인하고, 뒤처져 있으면 먼저 `git pull --ff-only`.

## 보존
- 기존 게임 구조, 스토리 진행, Save 데이터와 플레이 진행을 깨뜨리는 변경 금지. 대규모 리팩터링 금지.
- `play.mp4`는 사용자 파일이므로 수정·삭제·스테이징하지 않는다.
- `CODEX_WRITE_TEST.txt`는 테스트용 파일이다.
