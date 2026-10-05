# PROJECT_CONTEXT — windows98 프로젝트 인수인계

## 작업 전 필수 확인

앞으로 모든 작업을 시작하기 전에 이 문서를 읽는다. 실제 파일 변경이 발생한 작업마다 `CHANGELOG_AI.md`에 날짜, 목적, 변경 파일, 검증 결과, 미해결 사항을 기록한다. 기존 게임 구조와 스토리 진행을 최대한 보존하며 대규모 리팩터링하지 않는다. 기존 Save 데이터와 플레이 진행을 깨뜨리는 변경을 금지한다.

유일한 작업 저장소는 `nanarinnn/windows98`이며 앞으로 기준 작업환경은 현재 Cloud checkout `/workspace/windows98`이다. Windows `D:\YUYEON\windows98`은 동일 프로젝트의 로컬 경로일 뿐 이번 작업 대상이 아니다. 로컬 임시 문서나 영상을 Cloud 프로젝트에 가져오지 않고 다른 저장소를 작업 대상으로 삼지 않는다.

`play.mp4`는 사용자 파일이다. 수정·삭제·스테이징하지 않는다. 무차별 `git add .`를 사용하지 않는다. `CODEX_WRITE_TEST.txt`는 테스트용이다. 현재 Cloud에는 없으며 로컬 파일은 가져오지 않는다. 향후 기준 체크아웃에 존재하면 삭제 대상으로 취급한다. commit/push는 사용자의 명시적 지시에 따른다. 최종 EP01 Field/AUTHOR checkpoint `4a584574fb3d8479fec248e85b3f35d75a0c32bd`는 사용자 승인에 따라 main에 fast-forward 반영했다. Save Code 통합은 main에 반영했으며 현재 전체 기록 초기화 수정도 최신 main에서 검증 후 commit/normal push까지 승인되었다. force push/history rewrite는 금지하며 향후 작업은 당시 사용자 승인 범위를 따른다.

## 문서 기준과 인수인계 상태

- 분석일: 2026-10-05 (Asia/Seoul).
- 분석 기준: 로컬 브랜치 `work`, 원격 `main`과 동일한 HEAD `619525d269a85896fb74624fafa8137de0ec1cf4`. 읽기 전용 원격 확인에서도 `main`은 동일 SHA였다.
- 작업 시작 시 tracked 변경과 미추적 파일은 없었다. `node_modules/`는 설치된 ignored 의존성이다.
- 사용자 확인: Windows의 기존 `PROJECT_CONTEXT.md`는 Git 미추적 임시 문서이며 전달·통합할 필요가 없다. 사용자 전달 기획과 불변 조건 및 실제 Cloud 분석을 기준으로 두 Markdown을 신규 작성한다.
- `CHANGELOG_AI.md`, `CODEX_WRITE_TEST.txt`, `play.mp4`, `AGENTS.md`도 시작 시 현재 체크아웃에서 발견되지 않았다. 로컬 `CODEX_WRITE_TEST.txt`와 `play.mp4`는 Cloud에 가져오지 않는다. 실제 테스트 파일 삭제는 발생하지 않았고 사용자 영상에 대한 작업도 수행하지 않았다.
- 초기 문서 정착 이후 EP01 Canonical Sync와 중앙 현장 관측 시스템/EP01 Field Vertical Slice를 구현했다. Story 및 기존 Save 포맷은 보존하며, Field 이후 에피소드와 CLASSIFIED는 아직 구현하지 않았으며 AUTHOR는 기반과 두 개의 meta trace만 추가했다.

## Git 기준 버전 확인

요청된 `git remote -v`, `git branch --show-current`, `git rev-parse HEAD`, `git log --oneline --all -20` 및 두 커밋 존재 여부를 확인했다. origin fetch/push는 `https://github.com/nanarinnn/windows98.git`, 현재 브랜치는 `work`다.

- `5702cd0d170cbcfbe03940fd30859b6bcff45901`: 존재. 보고서 최하단 도달 후 4.5초 대기 셧다운 수정(2026-09-27).
- `619525d269a85896fb74624fafa8137de0ec1cf4`: 존재. J 기록 원문, 단서/추리 원문화, 기밀터미널·본부메신저, Save v4, 사건 보드 상태 표시(2026-10-04).
- `git merge-base --is-ancestor`로 **5702cd0이 619525d의 조상**임을 확인했다. 두 커밋 중 최신 구현은 619525d이며 현재 HEAD이자 확인된 원격 main tip이다.
- 그 사이 EP10 원고/영상, EP 번호 재정렬·Save/노트, 모바일/태블릿 대응 등이 추가됐다. 과거 5702cd0으로 되돌려 최신 구현을 누락하지 않는다.
- 619525d의 트리에서 `save.js`, `story-data.js`, `terminal.js`, `notebook.js`, `10화.txt` 존재를 개별 확인했다.
- 조사 및 문서 작성 중 checkout/reset/merge/cherry-pick/staging/commit/push를 수행하지 않았다.

## 현재 구현과 파일 역할

정적 HTML/CSS와 전역 JavaScript 함수로 구성된 Windows 98 테마 게임이다. 프론트엔드 프레임워크나 번들러를 사용하지 않는다. Express 서버는 정적 파일 제공과 알 수 없는 경로의 `index.html` fallback을 담당한다. 계정/데이터베이스/서버 저장 시스템은 없다.

| 파일/경로 | 현재 역할과 보존 주의점 |
| --- | --- |
| `index.html` | 데스크톱, Darkweb, 사건 문서/CCTV, 스마트폰, J 기록, 노트/터미널/메신저 창의 DOM 및 본문. 인라인 스타일도 존재한다. |
| `styles.css` | 기존 데스크톱과 게임 UI 스타일. 새 Field 스타일은 기존 선택자와 충돌하지 않도록 별도 범위를 검토한다. |
| `app.js` | 창/작업 표시줄, Darkweb, EP01~08 CCTV, EP09 스마트폰, EP10 설정 기반 CCTV, J 기록, 블루스크린과 LOOP 02. 기존 코드가 집중되어 있으므로 Field 전체를 여기에 추가하지 않는다. |
| `save.js` | `GameSave`, localStorage 로드/저장, 클리어·사망·단서·추리·업적·비밀·플래그·작업자 번호, Save Code v5 통합 내보내기, v4 Story codec과 구버전 가져오기. |
| `story-data.js` | `EPISODE_TITLES`, `EPISODE_DOCS`, 원본 영상 링크, `CLUES`, `DEDUCTIONS`, `ACHIEVEMENTS`, `SECRETS` 등 조사 데이터. 원문 인용을 보존하고 새 설정을 추측하지 않는다. |
| `notebook.js` | 사건수사노트의 사건 보드/단서/추리/업적/기록 UI, Save Code 입력/출력/초기화, `GameProgress`, 기존 진행 함수 래핑, J 목록 노출 제어, 저장 상태에 따른 재진입 복원. |
| `terminal.js` | 기밀터미널과 본부메신저. 브라우저에서 키워드와 기존 원문/진행 기록에 기반해 응답한다. 실제 AI·백엔드·로그인이 아니다. |
| `1화.txt` ~ `10화.txt` | 각 사건의 기존 수칙 원고. 아래 표의 10개 파일을 모두 보존한다. 검수 상태를 임의로 확정하지 않는다. |
| `server.js` | Express 정적 개발 서버, 기본 포트 3000, `PORT` override. 저장소 루트를 제공하므로 저장소에 비밀 파일을 두지 않는다. |
| `package.json`, `package-lock.json` | Express 의존성과 잠금 파일. 스크립트는 `npm start` 하나이며 별도 build/test 명령은 없다. |
| `vercel.json` | 정적 배포 대상의 명시적 목록. 루트 JS/CSS, `image/**`, `movies/**`, 루트 영상/이미지/텍스트와 새 `field/**`를 정적 배포 대상으로 포함한다. |
| `.gitignore` | `node_modules/`, `.gemini/`, 일부 영상 등 제외. `play.mp4`는 현재 명시적 제외 항목이 아니므로 스테이징 시 특히 주의한다. 이번 작업에서 변경하지 않는다. |
| `image/` | `1.png`~`9.png` 사건 이미지. 현재 `10.png`는 없다. |
| `movies/`, `movies/out/` | 기존 에피소드 idle/event 영상과 EP02 보조 영상. `out/`도 tracked 자산이므로 임의로 생성물 취급해 삭제하지 않는다. |
| 루트 MP4/PNG/JPG/PSD | EP01 등 영상, 배경/인물/로고 이미지 및 디자인 원본. 아래 전체 목록 참조. |

| 원고 | 현재 사건 제목 (`story-data.js` 기준) |
| --- | --- |
| `1화.txt` | 부산 태양해안 |
| `2화.txt` | 서울 심야 2호선 |
| `3화.txt` | 베리 해피 종합병원 |
| `4화.txt` | 13층 엘리베이터 |
| `5화.txt` | 살둔 계곡 아기소 |
| `6화.txt` | 청림고 2-3반 17번 |
| `7화.txt` | 나눔 12 편의점 |
| `8화.txt` | 유성 워터파크 |
| `9화.txt` | 안전 안내 문자 |
| `10화.txt` | 인어왕국 행복 공장 |

`index.html`의 실제 script 로드 순서는 `save.js → story-data.js → app.js → notebook.js → terminal.js`다. ES module이 아닌 일반 script이고 기존 HTML onclick과 전역 함수가 연결된다. `save.js`의 인코딩 함수는 호출 시 story 데이터 배열을 참조한다. 향후 모듈화 시 이 초기화 시점과 전역 의존성을 보존해야 한다.

`app.js`에는 기존 EP별 개별 구현과 `createCCTVEpisode`, `EPISODE_CONFIGS`, `EPISODE_ENGINES` 기반 EP10 구현이 공존한다. 모든 EP가 이미 하나의 공통 엔진으로 통일되어 있다고 가정하지 않는다.

## 가장 중요한 불변 조건: Story와 Field Game 독립

기본 Story 흐름:

`Darkweb → 사건 파일/CCTV/문서 → EP09 스마트폰 → J 기록 → 블루스크린 → LOOP 02`

기존 Story 진행 조건을 Field 진행도로 절대 변경하지 않는다. Field를 한 번도 플레이하지 않아도 기존 조건만 만족하면 위 흐름과 기본 엔딩에 도달할 수 있어야 한다. 업적, 단서 수집, CLASSIFIED, Hidden Anomaly를 기본 스토리/기본 엔딩의 필수 조건으로 만들지 않는다.

별도 Field 흐름:

`Field EP01 → EP02 → ... → EP10`

Field에서 발견한 정보가 LOOP 02 이후 추가 콘텐츠에 영향을 줄 수는 있지만 기본 Story나 LOOP 02 진입 조건이 되어서는 안 된다. `finaleSeen`, `jayUnlocked`, 기존 `eps`의 의미를 Field 진행용으로 재사용하거나 변경하지 않는다.

현재 코드에서 EP09 스마트폰 마지막 성공 처리로 `GameProgress.onClear(9)`와 `unlockJayReport()`가 호출된다. J 기록을 열면 진행 훅이 `jayUnlocked`를 기록한다. J 기록을 닫거나 끝까지 스크롤한 후 대기하면 `triggerLoopShutdown()`이 호출되고, 블루스크린/재부팅/LOOP 02로 이어진다. 진행 훅은 셧다운 시작 시 `finaleSeen`을 저장한다. Darkweb 재진입 시 `finaleSeen`이면 LOOP 데스크톱을 적용하고, 아니면 기존 EP09 클리어 또는 J 해금 기록에 따라 J 아이콘을 복원한다. 이 관찰을 새 조건 설계로 대체하지 않는다.

J 기록은 일반 수집품이 아닌 특수 스토리 계층이다. 기존 J 이벤트 이전에는 일반 조사 목록에 노출하지 않는다. 현재 노트는 `jayUnlocked` 전 J 목록을 숨기며 터미널의 일부 J 관련 조회도 해당 플래그를 확인한다.

## 콘텐츠 시스템의 역할과 계획

Darkweb 본부에 중앙 시스템 **현장 관측 시스템**을 추가했다. 기존 시스템 역할은 보존하며 EP01 Field만 파견 가능하다. EP01 Field 생환 후 EP02는 해금되지만 아직 연결 준비 중이다.

| 시스템 | 역할 |
| --- | --- |
| 사건 파일 / 기존 CCTV | 기존 스토리 및 짧은 규칙 체험 |
| 현장 관측 시스템 | 실제 장시간 Field Game |
| 사건수사노트 | 플레이어가 확보한 조사 정보 |
| 본부메신저 | 현재 본부/인물의 메시지 |
| 기밀터미널 | 능동적인 고급 데이터 조사 |
| 업적 | 선택적인 메타 도전 |
| `[J] 제이의 기록` | 기존 이벤트로 해금하는 특수 스토리 계층 |

## Field EP01 Vertical Slice — 설계와 구현 현황

Field EP01을 첫 Vertical Slice로 제작했다. 기존 EP01 CCTV 미니게임은 삭제하지 않는다. 새 Field EP01은 초기에는 약 15~25분 플레이를 목표로 했으며, 실제 사용자 플레이 피드백으로 현재 기본 근무 시계를 약 12분으로 조정했다. 단순 `이벤트 → 선택지 → 정답` 반복으로 만들지 않는다.

주요 인터랙션은 지속적으로 돌아가는 CCTV, 22:00~06:00 근무 시간, 내선 전화, 수칙집, 조명, 장비함, 순찰 지도, 인벤토리, 시간대별 순찰, 파고/환경 확인, 직접 조작, 시선/눈 감기/한쪽 눈씩 깜빡이기, 아이템 선택 및 사용, 시간 관리다. 수칙을 읽는 동안에도 시간이 진행되는 구조를 기본 방향으로 한다. 현재 공용 `FieldCore.config.realSecondsPerGameMinute = 1.5`를 사용한다. 파견 시 480분 × 설정값으로 근무 길이를 계산하며, 1.25/1.5/2초 등으로 다음 파견의 pacing을 조정할 수 있다. 사건 판정용 `dt`/`elapsed`는 현실 초를 유지한다.

공통 시스템은 기존 `app.js`에 몰아넣지 않고 호환되는 별도 모듈로 분리하는 방향이다. 아래 제안에서 실제로 core/save/ui/css와 ep01 파일을 생성했고 `field-author.js`에 독립 AUTHOR 기반을 추가했다. hidden 모듈은 아직 생성하지 않았다.

```text
field/
  field-core.js
  field-save.js
  field-hidden.js
  field-author.js
  field-ui.js
  field.css
  ep01/
    ep01.js
    ep01-data.js
```

현재 일반 script/전역 함수/DOM 기반 구조와 호환되는 접점부터 설계해야 한다. 위 경로를 채택해도 즉시 ES module 전환이나 기존 전역 함수 제거를 뜻하지 않는다. 별도 상태, UI 선택자, 타이머 생명주기를 기존 창 관리와 연결하되 Story 훅을 Field 클리어 기록에 연결하지 않는다. `vercel.json`에 `field/**` 정적 포함을 추가했고 로컬 서버의 모든 신규 자산 응답을 대조했다. 실제 Vercel 배포는 아직 실행하지 않았다. 구조 충돌이 확인되면 억지로 적용하지 말고 이유와 대안을 이 문서에 기록한다.

## NORMAL / CLASSIFIED / Hidden

- NORMAL: EP01~EP10. 일반 플레이어는 이 경로만으로 완결된 경험을 얻는다.
- CLASSIFIED: H01~H10. 각 Field episode에는 최소 하나의 Hidden Anomaly/CLASSIFIED 요소를 둘 수 있다.
- 충분한 Hidden 발견 시 `10 / 10 CASES`가 `11 / 10 CASES`처럼 변하는 연출을 사용할 수 있다.
- `11/10`은 진엔딩이 아니다. 현재 11번째 사건의 정체를 확정하지 않고 단서와 떡밥만 허용한다.
- Hidden/CLASSIFIED 발견은 기본 엔딩이나 Story/LOOP 02 진입의 필수 조건이 아니다.

## AUTHOR Easter Egg — 기반 구현 및 향후 확장

기존 Save Code 입력 UI를 이용한 제작자 전용 프론트엔드 Easter Egg다. 로그인/관리자 기능이나 보안 권한 시스템이 아니다. 실제 비밀 코드를 JS 또는 GitHub에 평문으로 넣지 않는다.

`입력 normalize → Web Crypto SHA-256 → AUTHOR_SAVE_HASH 비교`

별도 상태 예는 `authorAccessLevel`, `authorTraces`다. NORMAL / CLASSIFIED / AUTHOR 진행을 서로 구분한다. AUTHOR 콘텐츠는 정식 세계관이나 일반 엔딩을 대체하지 않는다. normalize는 trim → NFKC → UTF-8 → SHA-256이며 대소문자와 내부 공백을 구분한다. 사용자가 제공한 SHA-256 hash를 `AUTHOR_SAVE_HASH`에 적용했다. 실제 secret 평문은 제공받거나 저장하지 않았으며 비교에는 hash만 사용한다. `AuthorRoute.setHashOverride(hash)`는 개발/로컬 검수용 64자리 SHA-256 hex만 세션 메모리에 받으며 새로고침하면 사라진다. 평문 secret을 인수인계 문서나 JS/Git에 기록하지 않는다. 기존 Save Code 입력/정상 가져오기 경로는 보존한다. 브라우저 해시 비교는 프론트엔드 Easter Egg로만 취급한다.

현재 `field/field-author.js`는 일반 script이며 Field 완료 상태를 읽지 않고 `AuthorRoute`를 제공한다. 기존 세이브 코드 [불러오기] UI에서 먼저 비동기 AUTHOR hash 검사를 하고, 불일치/미설정/Web Crypto 실패 시 입력 원문을 기존 GameSave parser에 전달한다. 일반 Save의 덮어쓰기 확인/새로고침/export 동작은 유지한다. AUTHOR 성공은 Story save를 교체하지 않고 `[UNKNOWN SAVE FORMAT] → [IDENTITY RECORD FOUND] → [RECORD RESTORED]`를 표시하며 입력 UI를 비운다. HTTPS 또는 localhost의 Web Crypto 사용이 필요하다.

AUTHOR 상태는 독립 localStorage 키 `yuyeon98.author.v1`의 `{v:1, unlocked:false, authorAccessLevel:0, authorTraces:[]}`다. 현재 활성 단계는 1이며 trace ID는 `creator-note`, `ep01-observation` 두 개뿐이다. 신규 브라우저/기존 save에 AUTHOR 기록이 없으면 기본 false이며 구 Save의 Story import는 현재 AUTHOR·Field 기록을 삭제하지 않는다. 명시적인 `GameSave.reset()`/UI 기록 초기화는 Story·Field·AUTHOR 전체 진행을 초기화한다. 새 v5 Save Code는 별도 계층을 명시적으로 복원하며 v4 Story byte 형식 자체에는 AUTHOR 내용을 추가하지 않는다. 이 상태와 hash 비교는 사용자 수정이 가능한 frontend easter egg로서 인증/권한 기능이 아니다.

`[제작자에게.txt]`는 기존 `darkwebReadmeWindow`의 메모장 DOM/inline CSS를 복제해 title bar/메뉴/readonly textarea를 재사용한다. 본문은 monospace 12px/normal, line-height 1.6, letter-spacing normal, padding 10px, 내용 영역 margin 2px와 기존 세로 스크롤을 따른다. 이전 안내 머리말은 제거했고, 마지막 문구는 `영원을 약속하지는 못하겠지만, 지금 이 순간을 너와 함께`이며 앞에 대시는 없다. 앞의 두 문장은 유지한다.

최소 meta 연출은 Darkweb의 `[제작자에게.txt]` 개인 메모(열람 시 첫 trace), AUTHOR 활성 상태에서 EP01 최초 파견의 `[수신 여백]` 한 줄(두 번째 trace)이다. trace는 중복 지급하지 않으며 AUTHOR 없이 모든 기존 콘텐츠를 이용할 수 있다. 기존 J 원문/문서/엔딩을 바꾸지 않고 EP11·11/10·CLASSIFIED·AUTHOR 엔딩은 구현하지 않았다. 메모 창은 본부 창/작업표시줄에 연결하고 본부 연결 종료/셧다운 때 닫는다. 저장 권한 실패는 성공 메시지에 표시하며 그 경우 새로고침 후 보존을 보장하지 않는다.

## Save 호환성: 기존 데이터 의미 보존

현재 localStorage 키는 `yuyeon98.save.v1`이며 state는 다음 구조다.

```text
v: 1
eps: { episode: { clears, deaths, firstClearAt } }
clues, deductions, achievements, secrets: { id: timestamp }
flags: { jayUnlocked, finaleSeen, ... }
workerNo, updatedAt
```

localStorage state 버전 `v: 1`, 기존 Story codec 버전 `4`, 새 통합 Save Code 버전 `5`를 혼동하지 않는다. EP10 클리어 시 4자리 작업자 번호가 발급되고 이미 발급된 번호는 유지된다.

Save Code v4는 버전/EP 수/각 배열 개수 헤더, EP별 클리어·사망 횟수, 단서·추리·업적 비트, J 해금·엔딩 플래그 비트, 비밀 비트, 작업자 번호 2바이트와 체크섬을 포함한다. 현재 decoder는 v2/v3/v4 압축 코드와 이전 JSON 기반 v1 코드, 새 v5 통합 코드를 읽는다. v4 encoder/decoder의 기존 byte 형식은 그대로 유지한다.

`CLUES`, `DEDUCTIONS`, `ACHIEVEMENTS`, `SECRETS`의 배열 인덱스가 비트 위치다. 기존 ID를 변경하거나 기존 항목을 삭제·중간 삽입·재정렬하지 않는다. 필요한 새 항목은 **append**한다. 원문 인용도 임의로 바꾸지 않는다.

Field 전용 상태는 별도 namespace/state로 유지하며 기존 `eps`/플래그/키의 의미는 바꾸지 않는다. 새 `GameSave.exportCode()`는 Story + Field + AUTHOR progression을 이동/백업하는 v5를 출력한다. `exportStoryCode()`는 기존 v4 Story 코드만 출력하며 기존 encoder/decoder를 그대로 사용한다.

v5는 `[5, UTF-8 JSON 바이트, 기존 방식의 1바이트 합산 체크섬]`을 Base64url로 인코딩하고 6자씩 공백으로 구분한다. JSON 구조는 다음과 같다.

```text
{ v: 5,
  story: "기존 v4 압축 Story 코드",
  field: { v: 1, cleared: [], unlocked: ["EP01"], deaths: {}, records: {} },
  author: { v: 1, unlocked: false, authorAccessLevel: 0, authorTraces: [] }
}
```

localStorage는 `yuyeon98.save.v1`, `yuyeon98.field.v1`, `yuyeon98.author.v1` 세 키로 계속 분리한다. Key 통합/migration은 없다. v1/v2/v3/v4 또는 v5에 없는 계층은 현재 브라우저의 해당 진행을 보존한다. v5에 유효한 field/author가 있으면 명시적으로 교체한다. 빈 기본 상태도 복원되므로 새 코드 import는 해당 계층의 진행을 되돌릴 수 있다. 잘못된 root/type/version은 무시하며 객체 내부의 잘못된 값·알 수 없는 ID·중복은 검증 함수로 정리한다. Story/체크섬 검증 실패는 어떤 계층도 변경하지 않는다.

두 모듈의 `exportProgress()`/`importProgress()`는 각 local load와 동일한 whitelist 검증을 재사용한다. Field는 EP01~EP10 clear/unlock/deaths와 완료한 근무의 `records[EPxx]`만 전달한다. 요약에는 `patrols`(0~7시 true), 완료 근무 소요 초 `elapsed`, 완료 시각 `at`, `injuries`가 포함된다. 이는 완료 기록이며 진행 중 근무 시각/event stage/hold/control/선택 inventory/화면 상태는 이동하지 않는다. 외부 손상 기록 방어를 위해 부상 문자열은 최대 10개/각 100자만 보존하며 현재 실제 EP01 기록 범위를 충분히 포함한다. 다음 EP 해금은 Field 내부에만 적용한다.

AUTHOR는 unlocked, 현재 지원 access level(0/1), whitelist trace ID 두 개만 전달한다. AUTHOR secret, `AUTHOR_SAVE_HASH`, override hash, 입력 문자열은 Save Code에 포함되지 않는다. unlock 경로의 trim → NFKC → UTF-8 → SHA-256 비교는 그대로다. AUTHOR는 frontend easter egg이며 코드 payload/체크섬도 보안 인증 기능이 아니다.

사건수사노트 [기록]은 새 코드로 통합 내보내기/불러오기를 제공한다. 복사 시 다시 생성하여 창을 연 뒤 변경된 Field/AUTHOR 기록도 포함하며 일반 import의 확인/새로고침과 AUTHOR 전용 인식 연출을 유지한다. 진행 중 Field 세션은 복원하지 않고 재파견한다. 유효한 Field 계층을 import하면 기존 live 근무 연결을 종료하여 새로고침 전 이전 세션이 복원 기록을 덮어쓰지 않게 한다. 저장 권한 실패 표시는 기존 방식이며 브라우저 저장 권한은 여전히 필요하다.

향후 기능 변경 시 기존 v1~v4 코드, 기존 localStorage 진행, Field 미플레이 상태의 기본 엔딩, J 해금/LOOP 02 복원, 기존 EP01 CCTV 보존을 의미 있게 검증해야 한다. Field 구현에서는 격리된 테스트 브라우저에서 게임 실행과 Save 왕복을 검증한다. 사용자 브라우저의 실제 저장 데이터는 사용하거나 초기화하지 않는다.

## Transcript 관리 — 향후 자료 전달

```text
docs/transcripts/raw/
docs/transcripts/reviewed/
docs/transcripts/partial/
```

상태는 `RAW`, `PARTIALLY_REVIEWED`, `REVIEWED`로 구분한다. 원본 AI 전사본은 덮어쓰지 않는다. 검수본/부분 검수본은 별도 파일로 보관하고 출처, 에피소드, 검수 범위, 불확실한 구간을 기록한다. 사람이 확정하지 않은 애매한 문장을 AI가 추측해 정식 설정으로 만들지 않는다.

2026-10-05에 관리 기반을 생성하고 `transcripts_EP01_EP03_for_codex.zip`의 자료 6개를 배치했다. 관리 원칙은 `docs/transcripts/README.md`를 따른다.

| 에피소드 | 원본 | 검수 자료 | 상태 |
| --- | --- | --- | --- |
| EP01 | `raw/EP01_부산_태양해안_original.txt` | `reviewed/EP01_부산_태양해안.txt` | REVIEWED |
| EP02 | `raw/EP02_서울_심야_2호선_original.txt` | `reviewed/EP02_서울_심야_2호선.txt` | REVIEWED |
| EP03 | `raw/EP03_베리_해피_종합병원_original.txt` | `partial/EP03_베리_해피_종합병원.txt` | PARTIALLY_REVIEWED |

위 경로는 `docs/transcripts/` 기준이다. RAW 3개는 ZIP의 UTF-16 원본 바이트를 인코딩/줄바꿈 변환 없이 보존했다. 검수/부분 검수 자료 역시 ZIP 그대로 배치했다. EP01 검수본의 09:52 전화번호 미확정 표기도 그대로 유지한다.

EP03의 확인 범위는 00:27 `10만원권을~` 시작(전체 문장 미확정), 01:08 `요원이 직접 투입~` 의미(전체 문장 미확정), 02:16 `연회 요원` → `면회 요원`, 문서 번호 `2023-063호`, 03:15 빨간 인식표 부분 `입원실에 있는 설사약~`뿐이다. 다른 STT 문장과 미확정 부분은 추측·교정하지 않는다.

Transcript 배치 시에는 루트 원고/게임 콘텐츠를 변경하지 않았다. 이후 EP01 Canonical Sync에서 `1화.txt`와 EP01 문구/분기를 검수본에 맞췄으며 EP02~EP10 원고는 그대로다. 기존 원고를 임의로 REVIEWED로 선언하지 않는다.

## 현재 Field 계층 인수인계 (2026-10-05)

- 기존 일반 script 순서를 유지하고 끝에 `field-save.js → field-core.js → ep01-data.js → ep01.js → field-author.js → field-ui.js`를 추가했다. ES module, bundler, 프레임워크를 도입하지 않았다.
- `field/field-core.js`: 미션 register/dispatch, 250ms wall-clock pulse, substep 기반 시간 처리, 상태/인벤토리/로그, 종료·사망·생환. `step(seconds)`는 같은 런타임 시계 진입점이며 브라우저 검증에 사용한다. 사용자용 시간 가속 UI는 없다.
- `field/field-author.js`: 독립 AUTHOR hash 인식/저장/두 trace. 일반 save UI에만 연결하고 Story/Field 진입 조건으로 사용하지 않는다.
- `field/field-save.js`: 독립 키 `yuyeon98.field.v1`에 `{v:1, cleared, unlocked, deaths, records}` 저장. 기본 해금은 EP01, 생환하면 다음 Field EP 해금. 기존 `GameSave`/`GameProgress`를 호출하지 않고 `yuyeon98.save.v1`, Save Code v4, Story eps/flags/배열을 읽거나 바꾸지 않는다. Field 기록은 새 v5 Save Code로 이동하며 구 Story code import로 초기화되지 않는다. 전체 기록 초기화는 Field의 clear/unlock/deaths/records를 모두 기본 상태로 되돌린다. 모듈 자체는 Story를 변경하지 않고 검증된 진행 snapshot을 GameSave transport에 제공한다.
- `field/field-ui.js`, `field/field.css`: 본부 목록/창/작업표시줄, 이동/장비/통신/수칙 탭, 관측 영상, 지속 인벤토리/눈감기/이동 controls, 데스크톱·모바일 레이아웃. 기존 `.window` 드래그와 작업표시줄 배열을 사용한다. 창 제목은 `현장 관측 시스템.exe - 특별재난 관리본부`, 목록은 기존 사건 파일의 `[EP.01]` 형식이며 상태는 파견 가능/연결 제한/연결 준비 중이다. 사건수사노트의 [기록] 탭과 근무 기록의 저장 범위를 구분한다. 중앙 창 종료/본부 연결 종료/블루스크린 시 자기 세션만 정리한다. 작업표시줄로 숨겨도 근무 시계는 계속 흐른다. blur/visibilitychange는 held controls를 해제한다. title bar는 기존 사건수사노트 DOM 기준의 padding 3px 6px/12px bold/center alignment와 공통 .win-btn을 적용한다. 기준 창의 실제 font-family가 monospace이므로 이를 유지하며 일반 탭·버튼/상태는 노트의 11px 기준을 따른다. 로그·수칙의 기존 font/line-height는 보존한다.
- `field/ep01/ep01-data.js`: canonical 출처, 장소/아이템/낚시 요구 6종/관측 데이터와 게임 내 사건 발생 시각. 근무 배율은 공용 FieldCore 설정에 둔다.
- `field/ep01/ep01.js`: 미션 tick/action, A/B/D/F 상태 전이, 미션별 contact 버튼과 scene descriptor. 다음 미션은 별도 data/logic을 register해 공용 시계/저장/UI를 재사용한다. 사이드바의 현재 지도·통신·장비 controls는 첫 해안 미션 기준이며 EP02에서 필요하면 descriptor/action을 확장한다.
- A: 조명 소등, 행동 중지, 두 눈 hold. 보호 상태 현실 10초 유지 후 악취 종료(`FieldEP01Data.aProtectionSeconds` 조정값). 이른 release/조명 재점등/행동 또는 보호 지연은 연결 소실.
- B: 인사→망사리 확인→칭찬→사람 머리인 경우 알림→실제 오귀발 여부에 따른 구매 또는 공손한 인사 후 떠남. `observation`과 `actualOgwibal`을 분리한다. 주머니 지폐 3장과 개인 지갑을 별도 인벤토리로 다루고 지폐만 미끼로 교환한다. 관측 변형의 선택은 slice 시나리오 구성이지 사람 머리 자체를 오귀발로 정의하는 새 canon이 아니다.
- D: 시선 전환/지도 도주는 위험. 직접 선택한 미끼를 사용하면 소모되고 조과를 받는다. 미끼가 없으면 canonical 6종 중 요구된 신체를 제공·채취하는 접촉 경로로 해결하고 부상 내용을 근무 기록에 남긴다.
- F: 응시 유지, 좌/우 번갈아 깜빡이기, 뒤로 이동 hold→TV 발견→TV 뒤 이동→웅크림→앞쪽 파손음→앞으로 이동→선택한 순찰봉으로 3회 타격. 파손음은 텍스트와 짧은 합성 소리로 전달한다. 시선 이탈·양안 감기·지연 실패를 처리한다.
- 정각 순찰 알림/지도 관측/내선 1번 보고, 파고 1.5m 이상 해안 접근 제한, 장비·조명 점검/수령, 1번 연결 불가·0번 성명 반응·통화 종료 후 게임 시간 1분 대기 경로가 있다. 순찰 누락은 기록으로만 남기며 기본 Story나 Field 생환을 새 수집 조건으로 막지 않는다.
- 현재 조정값: 22:00~06:00=720초(게임 내 1분당 현실 1.5초), 사건 A/B/D/F는 각각 23:00/01:40/03:10/04:55. 첫 사건 A는 시작 후 현실 90초, A→B 간격은 240초다. 사건 위치는 관측 채널과 함께 전환한다. 대응 grace/deadline, 눈 피로 25초, TV 발견 거리 12보/3회 타격, 파고 변동 시간대는 gameplay tuning이며 원문 설정을 추가로 확정한 것이 아니다.
- 미구현/한계: EP02~EP10 미션, CLASSIFIED/Hidden/11번째 사건/AUTHOR 본편·엔딩, 중간 근무 저장·복원, 실제 부상에 따른 신체 조작 변경, 자유 3D 이동, 신규 전용 영상. 기존 영상 재사용과 버튼/hold 기반 공간 조작의 Vertical Slice이며 사용자가 checkpoint를 직접 플레이한 뒤 난이도 유지와 근무 시간 단축을 요청했다. 현재 12분 배율의 전체 근무 수동 플레이는 아직 검증하지 않았다. 연결 종료/새로고침 후 현재 근무는 처음부터 다시 파견하며 완료·사망 기록만 보존된다.
- 회귀 검증: `tests/field_browser_smoke.py`를 로컬 서버 실행 후 Python Playwright/Chromium 환경에서 실행한다. 격리 저장소와 production step으로 시계를 가속해 A/B/D/F 정상·실패/재시도/06:00/해금/저장 복원/Save v4/기존 CCTV/Field 미클리어 Story 경계를 검증한다. 부트/EP09 마지막 단계 등 일부 Story 진입점을 직접 호출하므로 전체 Story 수동 플레이 검증이라고 보고하지 않는다.

## 개발 및 작업 종료 절차

현재 검증된 개발 환경은 Node.js 24/npm 11이다. 저장소 자체에는 Node 버전 핀이 없다. `/workspace/windows98`에서 `npm ci`로 잠금 파일 기준 설치 후 `npm start`로 실행한다. 기본 포트는 3000이며 `PORT`로 변경 가능하다. 별도 빌드/자동 테스트 명령은 없다. 이전 환경 설정에서는 정적 HTML/JS/CSS/이미지/영상과 영상 Range 응답을 확인했지만 브라우저 게임 상호작용이나 Save 전체 호환성을 검증한 것은 아니다.

작업 종료 시 두 문서를 다시 읽고 `git diff`, `git diff --check`, `git status --short`를 확인한다. 미추적 파일과 기존 사용자 파일을 구분해 보고한다. commit/push는 사용자 지시 범위에 따른다. 기존 checkpoint는 work에 보존하고 main에 fast-forward 반영했다. 현재 통합 Save 변경은 사용자 지시대로 main에 commit하고 origin/main에 normal push한다.
2026-10-05 갱신: 기준 작업환경은 로컬 Windows 체크아웃 `C:\Users\Ahn\windows98`(Claude Code)이다. 위 `/workspace/windows98` 기준을 대체한다. 이 저장소의 commit과 `main` normal push는 사용자가 상시 승인했다. 작업 단위 종료 후 변경 파일만 명시적으로 스테이징해 commit/push하고, force push/history rewrite와 `git add .`는 계속 금지한다. 상세 규칙은 `CLAUDE.md`를 따른다. 이 PC에는 아직 Python이 없어 `tests/*.py`는 설치 전까지 실행할 수 없다.

## 분석 시점의 전체 tracked 파일 목록

의존성 캐시 `node_modules/`와 Git 내부 메타데이터는 프로젝트 소스 목록에서 제외했다. 이 목록은 문서 생성 직전 tracked 파일 전체이며 신규 인수인계 Markdown 두 파일은 별도로 추가된다.

```text
.gitignore
10화.txt
1화.txt
2.psd
2화.txt
3화.txt
4화.txt
5화.txt
6화.txt
7화.txt
8화.txt
9화.txt
BACKGROUND.jpg
YUYEON.png
YUYEON2.png
app.js
catch_short.mp4
disaster_logo.png
event_A_intro.mp4
event_B_intro.mp4
event_D_intro.mp4
event_F_intro.mp4
idle_sea.mp4
image/1.png
image/2.png
image/3.png
image/4.png
image/5.png
image/6.png
image/7.png
image/8.png
image/9.png
index.html
movies/ep10_event_arm.mp4
movies/ep10_event_exit.mp4
movies/ep10_event_head.mp4
movies/ep10_event_locker.mp4
movies/ep10_event_voice.mp4
movies/ep10_idle.mp4
movies/ep2_event_A.mp4
movies/ep2_event_B.mp4
movies/ep2_event_C.mp4
movies/ep2_event_D.mp4
movies/ep2_idle.mp4
movies/ep3_event_doctor.mp4
movies/ep3_event_meal.mp4
movies/ep3_event_night.mp4
movies/ep3_event_rescue.mp4
movies/ep3_idle.mp4
movies/ep4_event_exit.mp4
movies/ep4_event_left.mp4
movies/ep4_event_right.mp4
movies/ep4_event_speaker.mp4
movies/ep4_idle.mp4
movies/ep5_event_cry.mp4
movies/ep5_event_escape.mp4
movies/ep5_event_mirror.mp4
movies/ep5_event_water.mp4
movies/ep5_idle.mp4
movies/ep6_event_call.mp4
movies/ep6_event_dismiss.mp4
movies/ep6_event_door.mp4
movies/ep6_event_freeze.mp4
movies/ep6_idle.mp4
movies/ep7_event_barcode.mp4
movies/ep7_event_dawn.mp4
movies/ep7_event_id.mp4
movies/ep7_event_mirror.mp4
movies/ep7_idle.mp4
movies/ep8_event_exit.mp4
movies/ep8_event_food.mp4
movies/ep8_event_mascot.mp4
movies/ep8_event_slide.mp4
movies/ep8_idle.mp4
movies/ep9_event_video.mp4
movies/out/ep2_event_dark.mp4
movies/out/ep2_event_engine.mp4
movies/out/ep2_event_escape.mp4
notebook.js
package-lock.json
package.json
princess_rule_short.mp4
save.js
server.js
story-data.js
styles.css
terminal.js
tokubetsu.png
tokubetsu.psd
vercel.json
```

## Checkpoint 관리

사용자가 EP01 Field Vertical Slice checkpoint commit을 승인했다. 기준 구현의 부모 commit은 `619525d269a85896fb74624fafa8137de0ec1cf4`이며, 문서·전사 자료·Canonical Sync·Field 구현과 회귀 테스트 소스를 하나의 로컬 commit에 포함한다. 테스트 산출물과 캐시는 포함하지 않는다. `docs/transcripts/**/*.txt`는 `.gitattributes`의 `-text`로 줄바꿈 자동 변환을 방지하며, 원본에 포함된 줄 끝 공백만 검사 예외로 보존한다. 검수 상태나 원문 내용은 변경하지 않는다.

## Darkweb UI 비교 검증

`tests/darkweb_ui_smoke.py`는 노트와 Field를 동시에 열어 title bar의 계산 스타일, 높이, 제목 baseline, 아이콘 뒤 공백, 닫기 버튼 위치를 비교한다. 320px/390px 모바일 overflow와 기존 노트 탭 동작도 확인한다. 선택적 `UI_SCREENSHOT_DIR`은 체크아웃 밖의 경로를 지정한다. 기존 노트와 전역 styles.css를 바꾸지 않고 Field에만 같은 값을 적용한다.

## 통합 Save 검증

`tests/save_progress_smoke.py`는 UTF-8 근무 기록/모든 Story bit·J/엔딩 플래그·작업자 번호·Field/AUTHOR의 fresh browser 왕복과 reload, v2/v3/v4 보존, missing/invalid/empty 계층, 손상 코드의 무변경, hash/secret 제외를 검사한다. `tests/field_browser_smoke.py`는 실제 A/B/D/F→06:00 완료 상태를 새 UI 코드로 다른 fresh browser에 가져와 EP02 해금·사망·AUTHOR trace까지 검증한다. 기존 Story 독립성 검사는 v4 Story snapshot을 비교한다. AUTHOR hash 인식·일반 Save import/UI typography 회귀도 기존 smoke suite를 함께 실행한다.

## 전체 기록 초기화

`GameSave.reset()`와 사건수사노트 [기록 초기화]는 Story + Field + AUTHOR 전체 진행 삭제다. 구 Save import의 missing 계층 보존 정책과 구분한다. `FieldSave.reset()`은 진행 중 `FieldCore` 연결/timer를 먼저 종료한 후 `{v:1, cleared:[], unlocked:["EP01"], deaths:{}, records:{}}`를 기존 키에 저장한다. `AuthorRoute.reset()`은 `{v:1, unlocked:false, authorAccessLevel:0, authorTraces:[]}`를 기존 키에 저장하고 listeners를 즉시 호출한다. 설정된 AUTHOR hash/세션 override는 reset으로 바꾸지 않는다.

AUTHOR 아이콘은 DOM 삽입 전부터 display:none이며 unlocked일 때만 표시한다. reset/locked 상태 변경 시 열린 [제작자에게.txt]도 즉시 닫고 작업표시줄을 갱신한다. 새로고침 없이 아이콘/메모가 사라지며 trace는 다시 해금 후 재획득할 수 있다. UI의 기존 전체 삭제 확인과 새로고침은 유지한다. `tests/record_reset_smoke.py`는 실제 UI 초기화 직후(새로고침 전)와 새로고침 후 상태, Web Crypto 재해금, trace 재획득, icon 삽입 당시 숨김, live session 종료와 세 namespace 기본값을 검증한다. 기존 Field suite에서도 실제 생환/사망/CCTV 기록을 초기화하고 reload를 확인한다.
