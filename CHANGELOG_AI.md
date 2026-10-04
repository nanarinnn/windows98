# CHANGELOG_AI

실제 파일 변경이 발생한 작업마다 갱신한다. 작업 전에 `PROJECT_CONTEXT.md`를 읽고 기존 항목을 보존한다. 날짜는 Asia/Seoul 기준이다.

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
