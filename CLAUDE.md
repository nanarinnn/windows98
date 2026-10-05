# windows98 작업 규칙

작업 시작 전 `PROJECT_CONTEXT.md`를 읽고, 파일을 변경한 작업마다 `CHANGELOG_AI.md`에
날짜, 목적, 변경 파일, 검증 결과, 미해결 사항을 기록한다.

## 작업 절차 (GPT/Codex가 하던 방식 그대로)
1. 시작 전: `PROJECT_CONTEXT.md`와 `CHANGELOG_AI.md` 최신 항목을 읽고 관련 코드를 먼저 조사한다.
2. 구현: 기존 구조 최대 보존. 근거 자료는 `docs/transcripts/reviewed`(REVIEWED) 우선, 부분 검수/RAW의 미확정 내용은 canon으로 확정하지 않는다.
3. 검증: JS 문법 검사, `git diff --check`, 가능하면 `tests/*.py` 스모크 테스트. 실행하지 못한 검증은 못 했다고 기록한다.
4. 기록: 파일을 바꾼 작업마다 `CHANGELOG_AI.md` **맨 위(소개문 바로 아래)** 에 항목을 추가한다.
5. 종료: `git diff`, `git diff --check`, `git status --short` 확인 후 commit/push.

## CHANGELOG_AI.md 항목 형식
제목은 `## YYYY-MM-DD — 작업 제목` (Asia/Seoul 날짜, 최신이 위). 본문은 한국어 `- 항목: 내용` 불릿:
- 목적(요청 근거), 변경 파일(새 파일 포함), 핵심 구현/조정값, canonical 근거,
- 검증(실행한 테스트와 못 한 것을 구분), 보존(불변을 확인한 영역), Git(commit 메시지/push 여부), 미해결.
구조나 불변 조건이 바뀌면 `PROJECT_CONTEXT.md`의 해당 섹션도 함께 갱신한다. 기존 항목은 수정하지 않고 보존한다.
두 문서는 CRLF 줄바꿈이므로 편집 후에도 유지한다.

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
