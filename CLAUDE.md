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
- 테스트: `tests/*.py` 브라우저 스모크 테스트(Express 서버를 켠 뒤 실행). 이 PC에서는 `CHROMIUM_PATH`(Playwright chromium의 chrome.exe)와 `PYTHONUTF8=1`을 설정하고 Python 3.12(`%LOCALAPPDATA%/Programs/Python/Python312/python.exe`)로 실행한다. 현재 16종: author, classified, darkweb_ui, ep02~ep10, field, jay_viewer, record_reset, save_progress. classified의 AUTHOR 반응 검사는 `AUTHOR_TEST_SECRET` 환경변수가 있을 때만 실행한다. 테스트는 `/?devunlock=0`으로 접속해 실제 잠금 규칙을 검증한다.
- 개발 모드: localhost에서는 모든 Field 에피소드가 자동 개방된다(보기 전용, 저장 기록 불변). 실제 잠금을 보려면 URL에 `?devunlock=0`.

## Git 워크플로 (개발 중에는 커밋/푸시하지 않는다)
- 저장소: `nanarinnn/windows98`, 브랜치 `main`
- **개발 중에는 자동으로 commit/push하지 않는다.** 변경은 로컬 작업 트리(개발 서버 `http://localhost:3000`)에만 반영하고, 문서(`PROJECT_CONTEXT.md`/`CHANGELOG_AI.md`)는 작업과 함께 계속 갱신한다.
- 사용자가 최종 확인을 마치고 푸시하자고 하면 그때 한꺼번에 commit하고 `git push`(일반 push)한다. 이 지시 없이는 push하지 않는다.
- 커밋 메시지는 기존 스타일을 따른다: `feat:`, `fix:`, `tune:` 접두사 + 영어 요약. 여러 작업을 한 번에 묶을 때는 성격별로 나눠 커밋한다.
- `git add .` / `git add -A` 금지. 변경한 파일을 이름으로 지정해 스테이징한다.
- force push, history rewrite(`reset --hard`, `rebase`, `commit --amend` 후 push) 금지.
- push 전 `git fetch`로 원격 변경(GPT 등 다른 도구의 작업)을 확인하고, 뒤처져 있으면 먼저 `git pull --ff-only`.

## 수칙문서 / Canon 일관성 규칙
- 수칙문서는 **모든 에피소드에서 동일한 문서 구조와 표기 형식**을 유지한다(EP01의 `[기관명] / 문서 번호 / 개정 / 부착 위치 / [0] 개요…` 형식이 기준).
- reviewed transcript(`docs/transcripts/reviewed/`)가 canon의 최상위 기준이다. transcript에 없는 canon은 임의로 추가하지 않는다.
- 수칙문서 내용이 바뀌면 그 규칙을 참조하는 **Story(`N화.txt`, `index.html`의 문서 창, `story-data.js`) / Field(`field/epNN/*`) / UI / 테스트 / 문서(`PROJECT_CONTEXT.md`, `CHANGELOG_AI.md`)를 모두 검색해 함께 수정**한다. 한 파일만 고치고 연관 파일을 방치하지 않는다.

## Vercel 배포 (무료 한도 유지: 최신 배포만 보관)
- 프로덕션 `https://windows98-yuyeon.vercel.app`, 프로젝트 `test11-6dcd/windows98`. `main` push마다 자동 배포된다.
- (사용자 승인으로 push한 뒤) 배포가 Ready가 되면 `node tools/vercel-prune.js`(dry run)로 확인하고 `node tools/vercel-prune.js --yes`로 **최신 Ready 프로덕션 배포만 남기고 이전 배포를 삭제**한다. 이 프로젝트(windows98)만 대상이다.
- 사전에 `npx vercel login`이 되어 있어야 한다. 새 영상/대용량 자산은 추가 전에 압축한다(H.264, 최대 720p, CRF 28 기준 약 13배 감소 확인됨).
- 다른 프로젝트(yuyeononly, yuyeon-special, yuyeon, output)의 배포는 사용자 승인 없이 삭제하지 않는다.

## 보존
- 기존 게임 구조, 스토리 진행, Save 데이터와 플레이 진행을 깨뜨리는 변경 금지. 대규모 리팩터링 금지.
- `play.mp4`는 사용자 파일이므로 수정·삭제·스테이징하지 않는다.
- `CODEX_WRITE_TEST.txt`는 테스트용 파일이다.
