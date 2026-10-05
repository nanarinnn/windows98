# CHANGELOG_AI

실제 파일 변경이 발생한 작업마다 갱신한다. 작업 전에 `PROJECT_CONTEXT.md`를 읽고 기존 항목을 보존한다. 날짜는 Asia/Seoul 기준이다.

## 2026-10-05 — 로컬 Claude Code 작업환경 전환 및 작업 규칙 문서화

- 목적: Cloud/Codex 중심이던 작업환경을 Windows 로컬 Claude Code로 이어받고, GPT와 동일한 방식(문서 확인 → 구현 → 검증 → 기록 → commit/push)으로 작업하도록 규칙을 정착시킨다. 게임 기능은 변경하지 않았다.
- 환경: 저장소 `nanarinnn/windows98`을 `C:\Users\Ahn\windows98`에 clone했다. 기준 HEAD는 `cf76097`(fix: reset field and author progress with game records)이며 origin/main과 동일했다. `npm install`을 수행했다. 이후 기준 작업환경은 이 로컬 체크아웃이다(기존 `/workspace/windows98` Cloud 기준은 대체).
- 변경 파일: `CLAUDE.md` 신규(작업 규칙, commit `bb0b94c`), `CHANGELOG_AI.md`, `PROJECT_CONTEXT.md`(작업환경/commit 권한 갱신).
- Git 정책: 사용자가 이 저장소의 자동 commit/normal push를 승인했다. 작업 단위가 끝나고 검증하면 변경 파일을 이름으로 스테이징해 commit하고 `main`에 normal push한다. `git add .`, force push, history rewrite는 금지한다. 커밋 작성자는 기존과 같은 `바나나 BANANA <sakuchann00125@gmail.com>`(저장소 로컬 설정)이다.
- 검증: `git push --dry-run` 인증 확인, `CLAUDE.md` push 성공(`cf76097..bb0b94c`). 이 PC에는 Python이 없어 `tests/*.py` 브라우저 smoke test는 아직 실행하지 못했다.
- 미해결: Python + Playwright + Chromium 설치 전까지 smoke test 회귀 검증 불가. EP02 이후 Canonical Sync/Field는 미착수.
## 2026-10-05 — 인수인계 문서 초안 정착

- 목적: 기존 게임과 Save를 보존하면서 향후 Field/CLASSIFIED/AUTHOR 설계 및 작업 규칙을 기록한다. 이번에는 기능 구현을 시작하지 않는다.
- 기준 저장소: `nanarinnn/windows98`, 클라우드 `/workspace/windows98`, 로컬 work/HEAD (확인된 원격 main과 동일) `619525d269a85896fb74624fafa8137de0ec1cf4`. 앞으로 기준 작업환경은 Cloud `/workspace/windows98`이다. Windows `D:\YUYEON\windows98`의 임시 문서와 두 지정 파일은 가져오지 않는다.
- 변경 파일: `PROJECT_CONTEXT.md` 신규 작성, `CHANGELOG_AI.md` 신규 작성. 게임 코드, 원고, 저장 포맷, 자산, 의존성 선언/잠금 파일, 배포 설정은 변경하지 않았다.
- 기록한 핵심: Story/Field 독립, 기본 LOOP 02 조건 보존, J 특수 계층, EP01 Vertical Slice, NORMAL/CLASSIFIED/AUTHOR 구분, 11/10 정체 미확정, Save Code v4 및 배열 append 규칙, transcript 검수 상태/원본 보존.
- 실제 분석: 전체 tracked 파일 목록과 모든 원고 `1화.txt`~`10화.txt`, 주요 JS, script 로드 순서, 기존 진행 훅, 저장 구조를 문서화했다. 향후 `field/**` 배포 설정과 전역 script 호환 검토가 필요하다.
- 파일 보호: 현재 체크아웃에 `play.mp4`가 없어 수정·삭제·스테이징하지 않았다. `CODEX_WRITE_TEST.txt`도 없어 실제 삭제는 발생하지 않았다. 사용자 지시에 따라 두 로컬 파일을 Cloud로 가져오지 않는다.
- 기존 문서 상태: 작업 시작 시 기존 `PROJECT_CONTEXT.md`가 없었다. 사용자가 로컬 문서는 미추적 임시 문서이며 전달받을 필요가 없다고 확인했다. 전달된 기획과 실제 분석을 기준으로 신규 작성했다.
- 검증: 작성 후 두 Markdown 전체 재읽기, 필수 항목 및 tracked 소스 불변 확인, `git diff --check`, `git diff`, `git status --short` 확인. 신규 파일은 untracked이므로 일반 `git diff`에 내용이 표시되지 않는 점도 확인한다.
- 이번에는 문서만 변경하므로 게임 테스트/Save 가져오기·초기화는 실행하지 않는다. commit/push 및 staging은 수행하지 않는다.
- Git 조사: 요청된 원격/현재 브랜치/HEAD/전체 refs 로그 20개 및 커밋 존재 확인을 수행했다. 두 커밋 모두 존재하며 5702cd0은 619525d의 조상이다. 최신 기준은 현재 HEAD 619525d이고 요청된 주요 파일 5개가 모두 존재한다. 결과를 사용자에게 먼저 보고한 뒤 문서에 반영했다.
- 미해결: 이번 문서 작업을 막는 사항은 없다. EP01/EP02 검수본과 EP03 부분 검수본은 향후 전달 예정이다. Field와 AUTHOR 및 transcript 디렉터리는 아직 구현하지 않았다.

## 2026-10-05 — Transcript 관리 기반 생성

- 변경 이유: 원본 AI 전사와 사람의 검수 자료를 기존 게임 원고와 별도로 보관하고 검수 상태별 사용 기준을 정착시킨다.
- 생성: `docs/transcripts/README.md`, 빈 `raw/`, `reviewed/`, `partial/` 디렉터리.
- 검수 상태: RAW / REVIEWED / PARTIALLY_REVIEWED의 의미와 사용 원칙을 기록했다. 아직 자료는 없으며 기존 원고를 임의로 검수 완료로 선언하지 않았다.
- 보존 원칙: RAW 수정·검수본 덮어쓰기 금지, 불명확한 음성의 canon 추측 금지, REVIEWED 우선 기준, 부분 검수 자료의 미확정 내용 정식 설정 반영 금지.
- 갱신: `PROJECT_CONTEXT.md`의 Transcript 현황을 실제 생성 상태로 보강했다. 기존 설계와 불변 조건은 보존했다.
- Git 준비: `PROJECT_CONTEXT.md`, `CHANGELOG_AI.md`, `docs/transcripts/README.md` 세 파일만 명시적으로 스테이징한다. 빈 디렉터리는 Git이 추적하지 않으므로 README에 새 checkout의 재생성 명령을 기록했다.
- 검증: README와 갱신 문서 재읽기, 디렉터리 존재와 비어 있음 확인, 기준 HEAD의 모든 기존 tracked 파일에 대한 내용 동일성 확인, staged 파일 목록 및 `git diff --cached --check`, `git diff`, `git status --short` 확인.
- EP01~EP10 로직, `1화.txt`~`10화.txt`, Save, 사용자 자산은 수정·삭제·이동하지 않았다. HEAD는 `619525d`를 유지하며 commit/push는 수행하지 않는다.

## 2026-10-05 — EP01~EP03 Transcript 자료 배치

- EP01 RAW + REVIEWED 추가: `raw/EP01_부산_태양해안_original.txt`, `reviewed/EP01_부산_태양해안.txt`.
- EP02 RAW + REVIEWED 추가: `raw/EP02_서울_심야_2호선_original.txt`, `reviewed/EP02_서울_심야_2호선.txt`.
- EP03 RAW + PARTIALLY_REVIEWED 추가: `raw/EP03_베리_해피_종합병원_original.txt`, `partial/EP03_베리_해피_종합병원.txt`.
- 위 경로는 `docs/transcripts/` 기준이며 검수 상태는 변경하지 않았다. 첨부 ZIP의 6개 파일 모두 바이트 그대로 배치했다. RAW의 UTF-16 인코딩/줄바꿈도 변환하지 않았다.
- EP03의 00:27/01:08 전체 문장 미확정 및 나머지 STT 문장을 의도적으로 보존했다. 확인된 면회 요원, 2023-063호, 03:15 설사약 부분도 첨부 내용 그대로이며 추가 교정하지 않았다.
- `PROJECT_CONTEXT.md`의 transcript 현황과 `docs/transcripts/README.md`의 자료 목록/검수 범위만 갱신했다. 기존 설계·불변 조건은 보존했다.
- 기존 `1화.txt`~`10화.txt`와 게임 코드/CSS/미디어는 아직 transcript에 맞춰 수정하지 않았다. `README_IMPORT.txt`는 참고 자료로만 읽었고 저장소에 추가하지 않았다.
- 검증: 6개 정확한 경로 및 상태 표기 확인, ZIP CRC 검사, 6개 ZIP/배치 파일 byte comparison 및 SHA-256 일치, HEAD의 기존 tracked 파일 전체 바이트 동일성 확인, `git diff --check`, `git diff --cached --check`, `git status --short` 확인.
- 기존 문서 3개의 staged index를 그대로 보존했다. 이번 문서 갱신은 unstaged, 자료 6개는 untracked 상태로 두며 commit/push하지 않았다. HEAD는 `619525d`다.

## 2026-10-05 — EP01 Canonical Sync

- canonical 근거: `docs/transcripts/reviewed/EP01_부산_태양해안.txt` (REVIEWED). 수정 전에 기준 문서, 검수본, 기존 원고/HTML/EP01 엔진, Save와 조사 데이터 및 진행 훅을 확인하고 전체 검색으로 차이를 분석했다.
- `1화.txt`, `index.html`: 01:01의 문서번호 `해안관리-2019-031` 반영. 비상 대비실 내측, 파고 1.5m, 내선 1번, 선박 출현 여부는 기존 올바른 내용을 보존했다.
- A (03:56~04:30): 장발 중년 남성, 소등·행동 중지·눈 감기, 썩은 어패류+암모니아 악취 소멸 후 눈 뜨기를 보고서/로그/overlay에 맞췄다.
- B (04:47~06:15): 사람 머리 발견 시 '오귀발이 들어 있다'고 알리는 지침과 실제 오귀발이면 공손히 떠나는 지침을 분리했다. 사람 머리 자체를 오귀발로 정의하던 괄호를 제거했다. 기존 CCTV는 구매 장면만 있어 그 구조를 유지하고 인사/칭찬 및 오귀발이 아닌 내용물이라는 전제를 로그로 명시했다. 근무복 오른쪽 가슴 주머니의 1만원권 세 장(30,000원), 개인 지갑의 위조지폐 문제, 약 1m 갯지렁이 미끼를 반영했다. 새 랜덤 조우는 추가하지 않았다.
- D (06:32~07:31): 볼락 요구를 치아 6개로 수정하고 고등어/전갱이/볼락/돌돔/갑오징어/참돔의 6종 요구 목록을 보고서에 기재했다. CCTV는 고등어→손가락 1개의 사례를 사용한다. 미끼 제공 시 조과를 받고 미끼를 소모한다. 미끼가 없는 경우 원문에 없는 분노 사망 대신 요구된 신체 제공 선택으로 진행하도록 바로잡았다. 도주 사망은 유지했다.
- C/E (06:15, 07:52): 삭제된 항목이라는 사실만 표시하며 Hidden 규칙을 추가하지 않았다.
- F (08:01~09:23): 순찰 경로 C, 시선 유지/한쪽 눈씩 깜빡이기/뒷걸음질/아날로그 TV 뒤 숨기를 반영했다. 기존 선택지 엔진 안에서 숨기→파손음→즉시 앞으로 이동·순찰봉으로 완전 파괴의 순서를 적용하고 실패 시 '토막난 채로' 발견 문구를 수정했다.
- `story-data.js`: EP01 문서번호만 수정했다. CLUES/DEDUCTIONS/ACHIEVEMENTS/SECRETS의 기존 항목·ID·순서와 추리 연결은 변경하지 않았다. 09:52 미확정 전화번호 및 transcript 원본은 변경하지 않았다.
- 검증: headless Chromium에서 실제 버튼으로 A/B/D/F 정상 경로→06:00 clear, A/B 사망·재시도, D 도주 사망 및 미끼 없는 신체 제공, F 시선 이탈/파손음 후 대기 사망·재시도, EP01 저장 훅, Save v4 export/import round-trip을 확인했다. 테스트는 격리된 브라우저 저장소에서 수행했고 기존 게임 tick을 수동 진행해 시계만 가속했다. 영상 재생 품질/모든 환경의 수동 플레이 검증은 아니다. 브라우저 JavaScript 오류는 없었다.
- 보존 검증: EP01 시작/사망/재시도/clear 함수 및 이벤트 시각 불변, app.js EP02 이후 바이트 불변, index.html EP02 이후 바이트 불변, Save/진행 훅/Story/J/LOOP 02 조건 불변, story 데이터 배열 전체 불변, transcript 6개 ZIP 대비 바이트 불변. 잘못된 문자열 전체 검색을 재검토했고 RAW 오탈자는 의도적으로 보존했다. 게임에 남은 'TV 앞'은 파손음 이후 올바른 이동 단계다. `git diff --check` 및 JS syntax 검사를 통과했다.
- 이번 변경 파일: `1화.txt`, `story-data.js`, `app.js`, `index.html`, `CHANGELOG_AI.md`. 기존 staged 문서 index는 그대로 보존했다. Field/CLASSIFIED/AUTHOR/EP02 이후 기능을 수정하지 않았으며 commit/push하지 않는다.

## 2026-10-05 — 중앙 현장 관측 시스템 + EP01 Field Vertical Slice

- 구조 분석: 기존 global script/전역 onclick/창 드래그/작업표시줄과 v4 state 교체형 import를 확인했다. ES module/bundler 없이 별도 Field layer를 추가했다. 기존 EP01 CCTV를 교체하거나 삭제하지 않았다.
- 새 파일: `field/field-core.js`, `field/field-save.js`, `field/field-ui.js`, `field/field.css`, `field/ep01/ep01-data.js`, `field/ep01/ep01.js`, `tests/field_browser_smoke.py`.
- 통합 파일: `index.html`에 본부 아이콘/별도 창/CSS/script 연결만 추가, `vercel.json`에 `field/**` 정적 포함 추가. `PROJECT_CONTEXT.md` 현황과 이번 이력을 갱신했다. app.js/save.js/story-data.js/notebook.js/terminal.js 및 기존 원고/CSS/미디어는 이번 작업 시작 시점 그대로 보존했다.
- Story/Field 분리: Field 미션은 FieldCore/FieldSave만 사용한다. 기존 EP09→J→블루스크린→LOOP 조건, `eps`, `jayUnlocked`, `finaleSeen`과 기존 단서/추리/업적/비밀 배열을 변경하지 않는다. Field EP01 생환은 EP02 Field 해금만 기록한다. Story 접근 조건으로 Field 진행을 사용하지 않는다.
- Save 호환: 독립 키 `yuyeon98.field.v1`에 v1/cleared/unlocked/deaths/records 저장. old Story save에 field가 없어도 정상이다. 기존 v4 export/import는 byte 형식을 유지하며 Field 기록을 포함하지 않는다. import/reset과 Field 저장소는 독립이다. 새로고침 시 완료/사망 기록만 복원되고 진행 중 근무는 재파견한다. 저장 권한 실패는 UI에서 알린다.
- canonical 근거: EP01 REVIEWED transcript. A의 소등·행동 중지·눈 hold/악취 종료, B의 인사·관측·칭찬/사람 머리 알림과 실제 오귀발 분리/주머니 지폐 30,000원 및 개인 지갑 실패/미끼, D의 6종 요구/시선 전환·도주 위험/인벤토리 미끼 교환, F의 응시·좌우 깜빡임·뒤로 이동 hold/TV 뒤 숨기·파손음·앞으로 이동·순찰봉 반복 타격을 구현했다. C/E를 복원하지 않았고 미확정 전화번호도 만들지 않았다.
- 운영 조작: 기본 20분의 지속 근무 시계(문서 열람 중에도 흐름), 기존 영상 기반 관측, 지도 이동/매시각 순찰 관측·보고, 파고 확인/접근 제한, 통신 1번·0번/성명 반응·통화 종료/게임 1분 대기, 장비 점검·장비함 수령, 별도 인벤토리, 사망/재파견/06:00 생환.
- 재사용: registry/lifecycle/clock/substeps/save/UI 창/로그/인벤토리/hold controls를 공유한다. EP01 scene/contact 및 데이터는 미션 모듈에 두었다. 향후 EP02는 별도 모듈을 register하며 필요에 따라 지도/통신 등 shell action descriptor를 확장한다. EP02는 해금 상태만 표시하고 파견은 연결 준비 중으로 비활성화한다.
- 조정값/임시 부분: 사건 시각·응답 grace/deadline·눈 피로 25초·TV 발견 12보·3회 타격·기상 시간대/관측 위치 전환은 slice 밸런스 값이며 새 canon이 아니다. 기존 영상은 임시 재사용한다. 자유 이동/신체 손실에 따른 조작 변화/Field code 이동·중간 저장/EP02~EP10/CLASSIFIED/AUTHOR는 미구현이다. 순찰 누락은 기록에 남기되 추가 엔딩 조건을 만들지 않는다.
- 검증: Python Playwright + headless Chromium의 격리 저장소에서 실제 DOM 버튼/pointer hold로 A/B/D/F 정상과 실패, B 3종 관측 분리와 미끼, D 미끼 소모/조과·신체 요구·뒤돌아 도주, F TV 단계·파괴/지연 실패, 재시도, 06:00 Field 생환 및 EP02 해금, reload persistence, old save/v4 왕복을 테스트했다. production `step()`으로 시계를 가속했고 문서 열람 중 자연 시계 진행도 확인했다. 전체 20분 수동 플레이 밸런스 검증은 아니다.
- 회귀: 기존 EP01 CCTV A/B/D/F→06:00 및 사망/재시도 통과. Field 클리어 0인 fresh context에서 old Story load와 EP09 성공 처리→J→블루스크린/LOOP 경계 연동 통과. 기존 Story 전체 수동 플레이를 한 것은 아니다. 모바일 390px 레이아웃/문서·종료 접근과 desktop 관측 화면을 확인했다.
- 배포: 모든 Field 자산 로컬 HTTP 바이트 대조와 Vercel `field/**` 설정 확인. 실제 Vercel build/deploy는 실행하지 않았다.
- 최종 확인: JS syntax, `git diff --check`, staged diff check, 기존 staged index 보존, 기존 게임 파일 시작 시점 대비 바이트 불변, transcript 원본 불변을 확인한다. commit/push 및 추가 staging은 하지 않는다.

## 2026-10-05 — EP01 Field Vertical Slice checkpoint

- 사용자 지시로 프로젝트 문서 3개, transcript 6개, EP01 Canonical Sync, Field 공용 계층/EP01, Vercel 설정, 브라우저 회귀 테스트 소스를 단일 로컬 checkpoint commit 대상으로 선정했다. commit message: `feat: add field observation system and EP01 vertical slice`. remote push 및 main merge는 수행하지 않는다.
- 이전 staged 문서의 최신 작업 트리 내용을 반영했다. `play.mp4`, `CODEX_WRITE_TEST.txt`, 임시 로그, 캐시, `__pycache__`는 체크아웃에서 발견되지 않았으며, ignored `node_modules/`와 체크아웃 외부 ZIP·테스트 산출물은 포함하지 않는다.
- 전사본 원래의 줄 끝 공백으로 staged diff check가 경고한 것을 확인했다. 원문을 교정하지 않고 `.gitattributes`에 transcript TXT만 `-text whitespace=-blank-at-eol`을 지정해 바이트 보존 및 한정된 공백 예외를 명시했다. 다른 파일의 공백 검사는 유지한다.
- 검증: 필수 파일 존재, transcript 6개 ZIP 대비 바이트 동일, EP01/EP02 REVIEWED 및 EP03 PARTIALLY_REVIEWED 유지, EP02~EP10 원고/EP02 이후 app 로직/Save·노트·터미널 원본 불변을 재확인했다. PROJECT_CONTEXT의 Story/J/LOOP 02 독립과 Save v4 불변, 앞선 Canonical Sync/Field 구현·브라우저 테스트 기록을 확인했다. 최종 unstaged/staged `git diff --check` 및 staging 파일 목록을 확인한다. 게임 구현은 이번 checkpoint 정리에서 수정하지 않았다.

## 2026-10-04 — 실제 사용자 플레이 결과에 따른 pacing 조정

- 요청 근거: 사용자가 EP01 Field를 직접 플레이한 결과 기존 난이도는 유지하되 22:00~06:00 시간이 지나치게 느리다고 평가했다. 기본 근무 시계를 게임 내 1분당 현실 1.5초로 조정했다.
- 공용 설정: `field/field-core.js`의 `FieldCore.config.realSecondsPerGameMinute = 1.5`. 파견 시 설정을 읽어 `duration = 480 × 설정값`으로 확정한다. 이후 1.25/1.5/2초를 바꾸면 다음 파견부터 적용된다. EP01 데이터의 1200초 및 미션 등록의 duration 전달을 제거했다.
- 시간 분리: 게임 내 minute 변환만 빨라진다. mission `tick(dt)`, `elapsed`, 사건 age와 hold/눈 피로는 현실 초다. A의 8초 대응/20초 눈 감기, B의 120초, D의 90초, F의 25초 깜빡임/6초 후진/4초 숨기/파손음 후 12초 이동·18초 파괴 제한/3회 타격과 모든 성공·사망 분기는 변경하지 않았다. C/E 및 canonical 규칙도 그대로다. 내선 0번 재통화의 canonical 게임 내 1분 대기는 새 배율에 따라 현실 1.5초가 된다.
- 예상 근무: 480분 × 1.5초 = 720초 = 12분(이전 1200초/20분). 수칙 열람 및 상호작용 중에도 시계가 계속 흐르며 별도의 event pause는 추가하지 않았다. 따라서 정상 근무의 기준 시간은 약 12분이고, 브라우저 스케줄링 지연·재시도는 별개다. 비교 설정: 1.25초 → 10분, 2초 → 16분.
- 사건 순서/시각 유지: A 00:15(135분) → 현실 202.5초, B 01:40(220분) → 330초, D 03:10(310분) → 465초, F 04:55(415분) → 622.5초. 22:00→06:00 표시와 기존 게임 내 파고/매시각 순찰 시각도 변경하지 않았다.
- 검증: `python3 tests/field_browser_smoke.py` 전체 통과. 공용 설정 1.25/1.5/2초의 시간 변환, 사건 스케줄 불변, 수칙 읽기 중 자연 시계, A/B/D/F 정상·실패/재시도/06:00 생환, B/D/F의 현실 초 제한, EP02 Field 해금/persistence, 기존 CCTV, old save 및 v4 왕복, Field 미클리어 Story→J→BSOD/LOOP 경계, 모바일, 정적 자산 응답을 확인했다. 시계는 production step으로 가속했으며 12분 전체 수동 플레이를 새로 수행하지는 않았다. JS syntax 및 `git diff --check` 통과.
- 보존: 기존 Story/CCTV/Save 파일과 transcript는 HEAD 대비 바이트 불변이다. `PROJECT_CONTEXT.md`의 현재 시간 설정만 보강했다. 이번 변경은 unstaged로 유지하며 commit/push하지 않는다.

## 2026-10-04 — 실플레이 피드백: 첫 사건·A hold·Field 용어 조정

- 사용자 실플레이 피드백에 따라 첫 사건 진입 시점을 A minute 135(00:15) → 60(23:00)으로 단축했다. 1분=1.5초를 그대로 유지하므로 시작 후 약 90초에 A를 만난다. B/D/F는 220/310/415분(01:40/03:10/04:55) 그대로다. 발생 시각 간 현실 간격은 A→B 240초, B→D 135초, D→F 157.5초로 첫 간격이 더 길지만 이번에는 재배치하지 않았다. 전체 근무 720초/12분은 유지한다. A와 기존 23:00 정각 순찰·파고 상승이 겹치는 것도 확인했으며 해당 환경 시각은 변경하지 않았다.
- A 보호 성공 hold를 현실 20초 → 10초로 단축하고 `FieldEP01Data.aProtectionSeconds`로 분리해 8/10/12초 조정을 쉽게 했다. canonical은 소등·행동 중지·악취 종료까지 눈 감기이며 특정 현실 hold 길이를 정하지 않는다. 8초 대응 grace, 조기 눈 뜨기/이동/조명 재점등 사망은 그대로다. B 분기, D 요구, F 시선/깜빡임/TV 처리 등은 바꾸지 않았다.
- 기존 UI 조사: 사건수사노트.exe/기밀터미널.exe, 본부 실시간 메신저 - 상황실, [사건 파일] - 탐색기, 노트의 사건 보드/단서/추리/업적/기록, 기존 문서의 특별재난 관리본부 표기를 확인했다. Field 창만 `현장 관측 시스템.exe - 특별재난 관리본부`로 맞췄다. 목록 [EP.nn], LOCKED→연결 제한, 해금→연결 준비 중, 손에 든 장비→손에 든 물건, 現 위치→현재 위치로 정리했다. 사건수사노트 [기록] 탭의 세이브 코드에는 별도 근무 기록이 포함되지 않는다고 명시했다. 기존 창/노트/레이아웃은 변경하지 않았다.
- 검증: `python3 tests/field_browser_smoke.py` 통과. production 시계 89.75초에는 사건 없음/90초에는 23:00 A 진입, 실제 UI의 10.5초 hold 성공, 대응 지연/조기 눈 뜨기/이동/재점등 실패, 재시도, B/D/F 정상·실패/현실 반응 시간, 06:00 생환/EP02 해금, Field persistence, 기존 CCTV, old save/Save v4 왕복, Field 미클리어 Story→J→BSOD/LOOP 경계, 제목/목록/기록 문구와 모바일/정적 자산 응답을 확인했다. 격리 브라우저와 가속 step 검증이며 전체 12분 수동 플레이는 새로 수행하지 않았다.
- JS 문법 및 `git diff --check` 통과. 기존 Story/Save/노트/터미널/원고/transcript, 공용 시계와 Field 저장 코드가 HEAD 대비 그대로인지 확인했다. 수정 파일: `field/ep01/ep01-data.js`, `field/ep01/ep01.js`, `field/field-ui.js`, `index.html`(Field 제목만), `tests/field_browser_smoke.py`, `PROJECT_CONTEXT.md`, `CHANGELOG_AI.md`. commit/push는 수행하지 않는다.

## 2026-10-04 — AUTHOR frontend easter egg 기반

- 먼저 최신 프로젝트 문서/이력, save.js의 v1 state 및 v2/v3/v4 decoder/export, 노트의 불러오기·덮어쓰기·새로고침/초기화 UI와 Darkweb 창/작업표시줄/드래그 구조를 확인했다. 기존 v4 importer는 state를 교체하므로 AUTHOR 정보를 기존 state에 덧붙이지 않았다.
- 인식: 기존 사건수사노트 [기록]의 세이브 코드 불러오기에서 `AuthorRoute.tryImport()`로 먼저 검사한다. normalize는 Unicode NFKC 후 trim, 대소문자·내부 공백 구분. UTF-8 입력을 Web Crypto `crypto.subtle.digest('SHA-256', ...)`로 처리해 hex hash와 비교한다. 불일치/미설정/crypto 실패 시 입력 원문을 기존 parser로 넘겨 일반 save 호환을 유지한다. 입력 처리 중 버튼을 비활성화하고 AUTHOR 성공 입력은 UI에서 비운다.
- 실제 AUTHOR secret/hash는 아직 제공되지 않았다. `AUTHOR_SAVE_HASH = ''`는 명시적인 UNCONFIGURED placeholder이고 아무 secret도 임의 확정하지 않았다. 로컬 `AuthorRoute.setHashOverride()`는 hash만 세션 메모리에 받는다. 실제 secret 평문이 저장소에 없으며 테스트도 매번 격리 브라우저에서 임시 입력/hash를 생성한다. HTTPS/localhost 등 Web Crypto 지원 origin이 필요하다.
- 저장: 별도 `yuyeon98.author.v1`에 `{v:1, unlocked, authorAccessLevel, authorTraces}`. 기본 false/0/[]이며 현재 unlock은 level 1이다. Save v4 byte 포맷·eps/J/엔딩 플래그·기존 배열 ID/순서는 변경하지 않는다. 기존 save import/reset은 AUTHOR와 Field 기록을 옮기거나 지우지 않는다. 저장 불가 시 UI에 경고한다. 이 기능은 frontend easter egg이며 로그인/관리자 인증·보안 기능이 아니다.
- 최소 연출: `[UNKNOWN SAVE FORMAT] → [IDENTITY RECORD FOUND] → [RECORD RESTORED]` 단계 메시지. 독립 meta 개인 메모 `[제작자에게.txt]` 열람 시 `creator-note`, AUTHOR 상태에서 EP01 최초 연결 시 한 줄의 `[수신 여백]` 로그와 `ep01-observation`. allowlist와 중복 검사로 trace는 한 번만 기록한다. Story/J/LOOP·Field unlock/성공 조건에 사용하지 않는다. 메모 창은 기존 드래그/작업표시줄을 사용하며 본부 연결 종료/셧다운 시 닫힌다.
- 테스트: `python3 tests/author_browser_smoke.py` 통과. 일반 Save UI 불러오기/새로고침과 v2/v3/v4 legacy fixture, export round-trip, 잘못된 입력/대소문자/전각 NFKC·trim, 미설정 hash/crypto 실패 후 정상 parser, 올바른 hash 및 단계 메시지/입력 지움, 저장 복원/신규 브라우저 false, 두 trace 중복 방지, Story·Field 데이터 및 v4 byte 불변, AUTHOR 활성 상태의 EP09→J→BSOD/LOOP 경계를 확인했다. `python3 tests/field_browser_smoke.py`도 전부 통과해 AUTHOR 기본 false에서 EP01 A/B/D/F·기존 CCTV·Story·Save v4·Field persistence 회귀를 확인했다. JS syntax와 `git diff --check` 통과. 실제 AUTHOR secret으로 플레이하거나 실배포하지 않았다.
- 변경: 신규 `field/field-author.js`, `tests/author_browser_smoke.py`; `notebook.js` import UI, `index.html` script 한 줄, 두 프로젝트 문서. 기존 save.js/app.js/story-data.js/terminal.js/Field 미션·시계·저장/원고/transcript는 HEAD 대비 불변이다. 기존 `field/**` Vercel static 설정이 새 파일을 포함하므로 배포 설정 수정은 불필요하다. EP11/11/10/CLASSIFIED/전용 엔딩/J 교체는 구현하지 않았다. commit/push하지 않는다.

## 2026-10-04 — 사용자 제공 AUTHOR hash 적용 / normalize 순서 확정

- 사용자 제공 SHA-256 hex 값만 `AUTHOR_SAVE_HASH` 상수에 적용했다. 실제 secret 평문은 제공받거나 저장소에 기록하지 않았으며, AUTHOR 인식은 hash 비교만 한다. 임의 secret 생성/확정은 하지 않았다. 로그인/보안 인증이 아닌 frontend easter egg라는 기존 원칙을 유지한다.
- 사용자가 지정한 정확한 순서인 trim → Unicode NFKC → UTF-8(TextEncoder) → Web Crypto SHA-256로 normalize를 변경했다. 대소문자와 내부 공백은 구분하며 NFKC 후 추가 trim은 하지 않는다. NFKC가 새로 만든 공백을 보존하는 테스트로 순서를 검증했다.
- 단계 연출 `[UNKNOWN SAVE FORMAT] → [IDENTITY RECORD FOUND] → [RECORD RESTORED]`, Darkweb `[제작자에게.txt]`, 별도 AUTHOR persistence/trace 중복 방지는 그대로 유지했다. 기존 Story/J/LOOP 02/Field 진입·해금 조건, Save 포맷/기존 배열은 변경하지 않았다.
- 테스트: `python3 tests/author_browser_smoke.py` 통과. 제공 hash 상수 적용 확인, 실제 Web Crypto의 정상 hash match(매 실행 브라우저 메모리에서 만든 임시 입력/hash override), 오입력/대소문자·전각·정확한 normalize 순서, persistence/신규 브라우저 기본 false, 단계 UI, 중복 trace, v2/v3/v4 일반 import 및 export 회귀, crypto 실패 fallback, AUTHOR 활성 상태의 Story→J→LOOP 경계와 Field 상태 불변을 확인했다. 실제 secret을 모르므로 해당 secret 자체를 입력한 검증은 수행하지 않았다.
- JS syntax 및 `git diff --check` 통과. 기존 AUTHOR 구현과 함께 아직 unstaged 상태이며 commit/push하지 않는다.

## 2026-10-04 — Darkweb UI consistency 개선

- 기존 사건수사노트.exe의 실제 DOM/inline CSS, styles.css의 .window-header/.window-buttons/.win-btn과 노트 탭·버튼 typography를 먼저 조사하고 Chromium computed style을 비교했다. 노트 title bar 26px, 상하 3px/좌우 6px padding, monospace 12px/700, letter-spacing normal/line-height normal, flex space-between/align-items center였다. 제목 span 높이 17px/상단 offset 3.5px, baseline 17.5px, 닫기 28×18px/상단 offset 3px/10px bold line-height 10px였다. 아이콘과 제목은 하나의 span에서 공백 한 칸이며 window-buttons gap은 기존 2px다.
- Field의 기존 title bar는 49px/5px 8px/13px이고 큰 닫기 버튼은 37px 높이라 이질적이었다. Field에만 노트 padding/font-size를 적용하고 .window-header/.window-buttons의 기존 정렬과 .win-btn의 크기/굵기를 재사용했다. 닫기는 같은 ✕ 표시의 semantic button이며 aria-label/title은 연결 종료다. Field 공통 버튼의 큰 padding과 native button의 border-box를 title bar에 한정해 노트의 0px 4px/content-box/1px border/10px line-height 1로 보정했다.
- 기존 노트가 monospace를 선언한 사실을 기준으로 Field/제목·특별재난 관리본부 표시의 동일 font-family를 유지했다. Field 일반 버튼/select는 노트 버튼의 11px, Field 탭은 노트 탭의 11px bold, 상태는 기존 기록 요약의 11px normal로 맞췄다. 로그 11px/1.5 monospace, 수칙 12px/1.65 monospace는 그대로다. 노트 DOM/전역 styles.css·동작, 창 크기/위치 구조, 기존 색상 테마와 Field 게임 로직은 변경하지 않았다.
- 검증: `UI_SCREENSHOT_DIR=/tmp/windows98-ui-check python3 tests/darkweb_ui_smoke.py` 통과. 두 title bar의 높이/모든 font·padding·정렬 값/제목 baseline/아이콘 뒤 공백폭/닫기 위치 일치를 assertion으로 확인했고 동시에 표시한 스크린샷도 육안으로 비교했다. 320px/390px 모바일에서 제목/내용 overflow 없음·종료/수칙 접근, 기존 노트 5개 탭/종료도 확인했다. 스크린샷/측정 보조 스크립트는 /tmp에만 둔다.
- `python3 tests/field_browser_smoke.py`, `python3 tests/author_browser_smoke.py` 모두 통과. Field A/B/D/F·06:00·저장/기존 CCTV/Story/J/LOOP·Save v4 및 AUTHOR hash/trace·Save import 회귀를 확인했다. `git diff --check` 통과.
- 이번 UI 변경 파일: field/field.css, index.html의 Field 닫기 버튼만, tests/darkweb_ui_smoke.py, PROJECT_CONTEXT.md, CHANGELOG_AI.md. 앞선 미커밋 AUTHOR 구현을 보존하며 staging/commit/push하지 않는다.

## 2026-10-04 — AUTHOR/UI checkpoint 검증 및 work 반영

- 로컬과 origin/work는 모두 이전 checkpoint 2dc2bc9였고 AUTHOR 기반/hash/UI 일관화는 작업 트리에만 있었음을 확인했다. 사용자 지시로 해당 구현, 관련 문서와 두 브라우저 테스트를 단일 work checkpoint에 포함한다. commit message: `feat: add AUTHOR easter egg and align Darkweb field UI`. force 없이 work → origin/work만 push하며 main merge/push와 production 작업은 수행하지 않는다.
- AUTHOR·Darkweb UI·Field browser smoke test를 모두 재실행해 통과했다. UI 비교에서는 기존 노트와 동일한 monospace/12px/700, title bar 26px, padding 3px 6px, center 정렬, baseline 17.5px, 닫기 버튼 28×18px 위치 및 320px/390px 모바일을 확인했다. Save v2/v3/v4와 Story/J/LOOP·Field persistence 회귀도 통과했다. JS syntax 및 unstaged/staged `git diff --check`로 확인한다.
- 파일 범위를 프로젝트 문서 2개, field/field-author.js, field/field.css, index.html, notebook.js, tests/author_browser_smoke.py, tests/darkweb_ui_smoke.py로 제한했다. 테스트 산출물/로그/캐시/사용자 영상은 포함하지 않는다. 실제 secret 평문은 제공받거나 저장하지 않았으며 AUTHOR는 제공 hash 비교만 하는 frontend easter egg다.

## 2026-10-04 — 오늘 최종 정리: EP01 Field / AUTHOR easter egg

- 오늘 범위의 AUTHOR easter egg 구현 완료 상태를 유지하며 [제작자에게.txt] UI를 기존 Darkweb readme.txt 메모장과 일관화했다. 실제 secret 평문은 계속 저장소에 없으며 제공 SHA-256 hash/normalize/독립 AUTHOR persistence·trace 로직은 바꾸지 않았다. Story/Field/AUTHOR는 서로 진행 조건이 아니다.
- 기존 문서 창 DOM/inline CSS를 cloneNode로 재사용한다. 기존 title bar·메뉴·window-content/readonly textarea, monospace 12px/400, line-height 1.6, letter-spacing normal, 본문 padding 10px/내용 margin 2px/overflow-y auto를 그대로 따른다. 메모의 기존 위치/폭 제한과 독립 닫기 핸들러는 유지하며 기존 readme 창의 onclick은 제거해 AUTHOR 창만 닫도록 연결했다. 닫기 컨트롤은 키보드 조작도 가능하다. 전역 CSS/기존 문서는 수정하지 않았다.
- 본문의 [별도 기록 / 개인 메모](별도기록/개인메모) 머리말을 제거했다. 마지막 '— 화면 바깥의 여백'은 '영원을 약속하지는 못하겠지만, 지금 이 순간을 너와 함께'로 교체했으며 앞에 대시를 붙이지 않았다. 나머지 두 문장은 그대로 보존했다.
- EP01 Field 현 상태 유지: 1분=1.5초/약 12분 근무, A 23:00·현실 10초 hold, B/D/F와 기존 Story/J/LOOP 02·CCTV·Save v4 로직은 그대로다.
- 검증: AUTHOR/Field/Darkweb UI browser smoke test 모두 통과. AUTHOR hash match(브라우저 메모리에서 만든 임시 입력/hash)/오입력/단계 UI/persistence/trace 중복, 본문 정확한 전체 문자열과 readme 기준 computed typography·padding·margin·overflow 비교, v2/v3/v4 일반 Save, EP01 A/B/D/F·06:00·Field persistence, 기존 CCTV/Story/J/LOOP 경계를 확인했다. 기존 메모장과 AUTHOR 창을 동시에 띄운 스크린샷을 육안 비교했고 390px 모바일 표시/스크롤·닫기도 확인했다. 가속 step을 사용한 격리 브라우저 검증이며 실제 secret 입력이나 전체 12분 수동 재플레이는 하지 않았다. JS 문법 검사와 unstaged/staged git diff --check를 통과한다.
- 최종 commit message: `feat: finalize EP01 field and author easter egg`. 사용자 지시대로 work → origin/work만 일반 push하며 force push/main 수정·merge·push/production 작업은 수행하지 않는다. 스크린샷·측정 보조 스크립트는 /tmp에만 두고 commit에서 제외한다.

## 2026-10-04 — Story + Field + AUTHOR 통합 Save Code

- 사용자 요청: main의 안정 checkpoint 4a584574를 기준으로 Save Code에 세 진행 계층을 함께 포함하고 검증 후 commit/normal push한다. localStorage 키 통합이나 gameplay/Story 조건 변경은 하지 않는다.
- `save.js`: 기존 v4 Story encoder/decoder byte 형식을 유지하고 v5 transport를 추가했다. payload `{v:5, story:<v4 code>, field:<validated snapshot>, author:<validated snapshot>}`를 UTF-8/Base64url와 합산 체크섬으로 전달한다. `exportCode()`는 v5, `exportStoryCode()`는 기존 v4다. 체크섬/Story가 유효한 경우에만 상태를 쓰며 일반 v1/v2/v3/v4 코드는 계속 import한다.
- `field/field-save.js`, `field/field-author.js`: local load와 Save Code export/import에 같은 sanitize helper를 재사용한다. localStorage는 기존 Story/Field/AUTHOR 세 namespace를 분리 유지한다. 구 코드나 missing 계층은 현재 해당 상태를 보존한다. 새 코드에 유효한 계층이 있으면 기본 빈 상태도 명시적으로 복원하며 invalid root/version은 무시, 내부 값은 whitelist로 정리한다.
- Field 포함: EP01~EP10 clear/unlock, episode별 유효한 death count, 생환 기록의 patrols/완료 소요 시간/완료 시각/injuries. 진행 중 근무 시각, event stage, hold/control, UI 선택 인벤토리와 화면 상태는 제외한다. 손상된 외부 부상 배열은 10개/문자열당 100자로 제한한다. EP01 실제 저장 범위와 충분히 호환된다.
- AUTHOR 포함: unlocked, authorAccessLevel(현재 0/1), authorTraces(기존 두 ID/중복 제거)뿐이다. 실제 secret 평문은 저장소에 없고 AUTHOR_SAVE_HASH/override hash/입력 문자열도 Save Code에 포함되지 않는다. 기존 normalize/hash 인식 방식 및 frontend easter egg 성격은 그대로다.
- `notebook.js`, `field/field-ui.js`: 별도 기록도 Save Code로 함께 이동됨을 표시했다. 복사 시 최신 코드를 재생성하고 브라우저에서 확인했다. 유효한 Field 계층 import는 기존 live 연결을 종료하여 새로고침 대기 중 이전 근무가 복원 기록을 덮어쓰지 않게 한다. 진행 중 export의 transient 제외 및 import 시 연결 종료도 검증했다. v1 JSON import도 기존 계층 보존을 확인했다. AUTHOR 입력 연출과 일반 Save 확인/새로고침 UI는 보존했다.
- 테스트: 신규 `tests/save_progress_smoke.py`의 fresh browser v5 Story/Field/AUTHOR Unicode round-trip/reload, 모든 Story 배열 bit/J·엔딩 flags/작업자 번호, legacy v2/v3/v4 계층 보존, missing/invalid/empty field·author, 손상 envelope/invalid Story의 전체 무변경, secret/hash 제외 통과. 기존 Field smoke에 실제 06:00 생환→EP02 해금·death·근무 요약·AUTHOR trace를 새 UI 코드로 fresh browser에 가져오는 왕복을 추가해 통과했다. 기존 isolation assertion은 v4 Story snapshot을 비교하여 독립성과 새 통합 export 목적을 함께 검증한다.
- 회귀: Field/ AUTHOR/Darkweb UI browser smoke 모두 통과. A/B/D/F 정상·실패·재파견, 기존 CCTV, Field 0 clear에서도 EP09→J→BSOD/LOOP 경계, AUTHOR Web Crypto match/오입력/persistence/trace 중복, 구 save UI import 및 모바일 titlebar 비교를 확인했다. JS 12개 문법 검사와 git diff --check 통과. 격리 headless Chromium/production step 가속 검증이며 실제 secret 입력이나 전체 수동 Story/12분 Field 재플레이는 하지 않았다.
- 변경 범위: 프로젝트 문서 2개, save.js, Field save/author/UI, notebook.js, tests 3개(새 통합 suite 포함). app.js/story-data.js/index.html/Field core·EP01 data·logic/CSS/전사·원고·미디어/의존성은 변경하지 않았다. Story/J/블루스크린/LOOP 02 조건, eps/finaleSeen/jayUnlocked 의미, 조사 배열 순서/ID, EP01 gameplay와 AUTHOR 진입은 불변이다.
- Commit: `feat: include field and author progress in save codes`. 사용자 승인에 따라 main → origin/main normal push하며 force push/history rewrite는 하지 않는다. 산출물·캐시·로그·사용자 파일은 제외한다.

## 2026-10-04 — 전체 기록 초기화 및 AUTHOR 노출 방지

- 실제 플레이 버그: 기록 초기화가 Story만 지우고 Field/AUTHOR localStorage를 남겨 AUTHOR 파일이 계속 표시됐다. **기록 초기화의 범위를 Story + Field + AUTHOR 전체 진행으로 통일**했다. legacy Save import에서 없는 계층을 보존하는 정책은 그대로 유지한다.
- `save.js`: `GameSave.reset()`에서 Field/ AUTHOR reset API를 호출한 후 Story 기본 상태를 저장한다. `field/field-save.js`: reset은 기존 live session/timer를 먼저 disconnect하고 clear/unlock/deaths/records를 기본값(EP01만 해금)으로 저장한다. `field/field-author.js`: reset은 unlock false/access level 0/trace empty를 기존 키에 저장하고 listeners를 notify한다. AUTHOR hash 및 세션 override 설정은 건드리지 않는다.
- AUTHOR 아이콘은 DOM 삽입 전에 `display:none`을 적용해 로딩 중 노출을 막는다. unlocked 상태일 때만 표시하고 reset/locked 상태 변경 시 열린 메모 창도 즉시 닫아 작업표시줄을 갱신한다. reload 없이 즉시 반영한다.
- `notebook.js`: 전체 삭제 확인 문구에 사건/현장 근무/별도 기록 범위를 반영했다. 기존 확인 후 새로고침 흐름은 유지했다. `PROJECT_CONTEXT.md`에서 reset과 import 보존 정책을 구분해 인수인계했다.
- 검증: 새 `tests/record_reset_smoke.py`에서 fresh 상태/아이콘 삽입 시 숨김, Web Crypto AUTHOR 입력→파일·메모 표시, standalone reset의 즉시 숨김/메모 닫기 및 hash override 유지, 실제 UI 전체 삭제 직후와 reload 이후 세 계층 기본값·live session 종료, AUTHOR 재입력·trace 재획득과 persistence를 통과했다. 임시 입력/hash는 격리 브라우저 메모리에서 생성했으며 실제 secret은 사용하지 않았다.
- 기존 Field smoke에 실제 A/B/D/F→06:00 생환·사망·CCTV Story 기록 이후 전체 reset/reload 검증을 추가해 통과했다. browser smoke 총 5종(reset/통합 Save/Field/AUTHOR/Darkweb UI), v1/v2/v3/v4 import 및 v5 왕복/missing 계층 보존, Story/J/LOOP 02·CCTV·EP01 정상/실패 흐름 회귀를 통과했다. JS 12개 syntax 및 git diff --check 통과. 전체 근무는 production step을 가속한 격리 browser 검증이다.
- 변경 범위는 save.js, Field save/author, notebook.js, 프로젝트 문서 2개, Field/reset tests다. import codec/정책, AUTHOR 진입, Story 진행 조건·배열 ID·EP01 gameplay·원고/미디어/의존성은 변경하지 않았다.
- 사용자 승인에 따라 main에 `fix: reset field and author progress with game records`로 commit하고 origin/main normal push한다. force push/history rewrite는 하지 않으며 테스트 캐시·로그·사용자 파일은 포함하지 않는다.
