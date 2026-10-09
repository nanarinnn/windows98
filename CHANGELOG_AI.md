# CHANGELOG_AI

실제 파일 변경이 발생한 작업마다 갱신한다. 작업 전에 `PROJECT_CONTEXT.md`를 읽고 기존 항목을 보존한다. 날짜는 Asia/Seoul 기준이다.

## 2026-10-10 — Field EP07 원문 정합: 모든 손님 거울 확인, 자동문 잠금 단계, 계산대 이탈 실패 분리

- 목적: 사용자 지시("원문대로 고쳐줘"). reviewed transcript 03:11 "반드시 모든 손님을 방범 거울로 먼저 확인하십시오", 02:17 "손님이 한 명도 없는 것을 확인한 뒤 자동문을 잠그고 이동 / 잠그지 않고 다녀온 근무자는 … 이름표 … 부위별로 나뉜 채 발견"에 맞춤.
- 변경 파일: `field/ep07/ep07.js`, `field/ep07/ep07-ui.js`, `field/ep07/ep07-data.js`, `tests/ep07_browser_smoke.py`, `PROJECT_CONTEXT.md`. `7화.txt`/Story 문서 창은 이미 원문 문장을 담고 있어 변경 없음.
- 거울: 손님이 있는 모든 방문(N/A/B/C/D)은 `결제기 화면을 보는 척 거울을 확인한다`가 첫 단계이며, 그 전에는 결제·신분증·응대 버튼과 POS 표시가 나오지 않는다. 정상 손님은 `평범한 매장 통로`(`mirrorState='clear'`), A만 끝없는 통로(기존 4초 내 시선 거두기). A 도착 장면은 정상 손님과 동일(품목 포함)해 거울 전에는 구별되지 않는다. D는 거울 확인 후 바코드 스캔 로그(`dScan`)와 함께 POS `[ 코드만 표시 ]`가 뜨고 신고 제한 시간도 그때부터 흐른다. 거울을 건너뛰는 경로는 없으므로(버튼 비노출) 새 실패 코드는 만들지 않았다.
- 자동문: `자동문을 잠근다` 버튼(`lockDoor`) 추가. 손님이 보이면 잠기지 않고 로그만 남는다. 보이지 않는 손님(E 불일치)은 감지하지 않는다(숫자 세기는 플레이어 몫). HUD 자동문 표시에 ` · 잠김`. 이탈 판정 순서: 손님 있음 → `LEAVE_WITH_CUSTOMER`, 알림음≠퇴장 → `E_LEFT_DURING_MISMATCH`, 미잠금 → 새 `DOOR_UNLOCKED`(canon 이름표/부위별 분리 문장), 모두 통과 시 복귀 후 잠금 해제.
- 실패 문구: `LEAVE_WITH_CUSTOMER`는 transcript에 결과가 없으므로 "현장 연결이 끊겼습니다. 기록 중단." 수준으로 바꾸고 canon 목록에서 제외, `canonFailures`에 `DOOR_UNLOCKED` 추가. 기존 실패 코드 id는 삭제하지 않았다.
- 검증: `node --check`(ep07 3개), `git diff --check` 통과. `tests/ep07_browser_smoke.py` ALL PASS(거울 전 결제 불가·정상 통로 확인, A 도착 구별 불가, B/C/D 거울 선행, D 타이머는 스캔 후 시작, 손님 있을 때 잠금 불가, 미잠금 이탈 canon 실패, 잠금 후 안전 복귀, 잠가도 E 불일치 이탈은 실패, 모바일 tap 잠금/이탈 포함). 다른 테스트는 EP07 파일만 바뀌어 재실행하지 않았다.
- 보존: Story/J/블루스크린/LOOP 02, Save Code v5·v4, EP07→EP08 해금만, CLUES 등 id·순서 불변.
- Git: commit/push 하지 않음.
- 미해결: transcript의 "확인하는 모습을 손님에게 들킨 경우"는 별도 분기 없이 A 통로에서 시선을 늦게 거둔 경우로만 표현한다. 사람 실측 플레이 시간(거울 단계 추가로 늘어남) 미측정.

## 2026-10-10 — Field EP07 나눔 12시 편의점 야간 근무 구현

- 목적: 사용자 지시. EP07을 2D 야간 편의점 계산대 근무 시뮬레이션으로 구현(기존 EP01~06 Field 공통 코어/UI/실패·재시도 패턴 재사용, 전역 리팩터링 없음). 개발 서버에만 반영하고 commit/push하지 않았다.
- 변경 파일: 새 `field/ep07/ep07-data.js`(조정값·대기열·문구·실패 문구; 수칙 원문은 두지 않고 `#darkwebReportWindowEP7`에서 읽음), `field/ep07/ep07.js`(상태 머신), `field/ep07/ep07-ui.js`(계산대 화면), `tests/ep07_browser_smoke.py`. 수정 `index.html`(EP07 스크립트 3개 등록, EP07 문서 창 본문을 새 `7화.txt`와 동일하게, 표기 `나눔 12 편의점`→`나눔 12시 편의점`), `7화.txt`(reviewed transcript 기준 재작성), `story-data.js`(`EPISODE_TITLES[7]`=`나눔 12시 편의점`, `EPISODE_DOCS[7]`=`2026-07-19`, `c07-hq` 인용·태그의 `0050-0`→`0050-0200`; CLUES id/순서 불변), `field/field.css`(`.f7-*` 스타일 추가), `tests/ep06_browser_smoke.py`(EP06 clear 후 EP07 버튼 기대값 `연결 준비 중`→`파견 가능`), `docs/transcripts/README.md`.
- 자료 보관: 사용자 업로드본을 바이트 동일하게 추가 — `reviewed/EP07_나눔_12시_편의점.txt`, `reviewed/EP08_유성_워터파크.txt`, `reviewed/EP09_안전_안내_문자.txt`, `reviewed/JAY_요원_제이의_기록.txt`, `raw/EP10_인어왕국_행복_공장_original.txt`. EP07 외 자료는 보관만 했고 콘텐츠에 반영하지 않았다.
- 핵심 구현: 고정 대기열 `N A N B N C N D N E N F` 후 G(06:00). 정상 손님(N)을 사이사이 배치하고 A~F에 canon 시각을 부여하지 않았다(시계는 대기열 진행률로 22:00→06:00 표시). 기본 규칙: 손님이 있을 때 먼저 말 걸기 = 실패(`SPOKE_FIRST`), 손님이 있을 때 계산대 이탈 = 실패(`LEAVE_WITH_CUSTOMER`), 알림음 수≠퇴장 수일 때 이탈 = 실패(`E_LEFT_DURING_MISMATCH`), 손님 0명·숫자 일치 시에만 자동문을 잠그고 이동 가능.
- A 결제기 화면을 보는 척 거울 확인→끝없는 통로→4초 안에 시선을 거둬야 함(`MIRROR_LOCKED`, "여기 알바는 거울을 좋아하나 봐요?"+실종/승강기 측면 거울 목격). B 신분증 사진 깜빡임→같은 손짓·속도로 반환만 성공, 거절(확인 전/후 모두)·놀람·다른 속도·7초 지연은 `ID_FAIL`. C 목소리 겹침→가격표/화면 가리키기만 성공, 입으로 대답 = `VOICE_LOST`(성대 소실). D POS 상단 `[ 코드만 표시 ]`+정상 가격, 8초 안에 본부 연락(0050-0200) 필요, 미신고 시 가격 구간별 canon 신체 손실표(`D_UNREPORTED`). E 알림음만 울리고 사람 없음→HUD `자동문 알림음 불일치 (n/m)`→대기 시 POS 불빛·봉투 연출→퇴장으로 숫자 일치 후에만 진행. F 시작 로그에 `전 근무일 폐기 완료 상품: 삼각김밥(참치마요)`, 후반 진열대 복귀→`SNS-0719` 집게→회수 용기→본부 보고 순서 강제, 맨손 `F_BAREHAND`, 재폐기 `F_REREGISTER`(폐기 목록에 이름과 근무 시작 시각). G 06:00 날이 밝지 않음·교대자 없음, 밖으로 나가기 `G_OUTSIDE`, `알바지옥` 앱→`근무 종료` 3~5회(랜덤) 눌러야 clear.
- 조정값(non-canon): 거울 4초, 신분증 7초, D 신고 8초, E 결제 연출 5초/퇴장 10초, 근무 종료 3~5회, 정상 손님 품목, 전 근무일 폐기 상품명. `canonFailures`에 transcript 결과 문장을 쓰는 코드를 명시했고, `SPOKE_FIRST`/`F_BAREHAND`는 transcript에 결과가 없어 "현장 연결이 끊겼습니다. 기록 중단." 수준이다.
- 이번 세션 수정: ① HQ 연락 버튼이 `hqCall`을 보내는데 로직은 `dReport`/`fReportHQ`만 처리해 D 신고와 F 본부 보고가 불가능했던 문제를 `hqCall`로 통일해 수정. ② B에서 신분증 확인 전 표시되는 `판매를 거절한다` 버튼이 무반응이던 문제 수정(항상 `ID_FAIL`). ③ EP07 테스트의 잘못된 기대값 2곳(다음 손님 입장으로 알림음이 1 더 많은 상태를 불일치로 오판) 및 and/or 우선순위 오류 수정.
- 검증: `node --check`(ep07 3개, story-data.js), `git diff --check` 통과. Playwright(Chromium ARM64, Linux) — `ep07_browser_smoke` ALL PASS(문서 동일성·잠금/해금·A~G 정답/오답·D 코드 표시와 신고·E 불일치 이탈·F 처리/재폐기·G 외출/반복 종료·EP08만 해금·Story 저장 바이트 동일·Save Code v5 round-trip·모바일 tap), `ep06`·`ep05`·`ep04`·`ep03`·`field`·`author`·`classified`·`record_reset_smoke`·`save_progress_smoke` PASS. `darkweb_ui_smoke`(아이콘 폭 metrics)와 `ep02_browser_smoke`(line 192 `carIndex == 2`)는 실패하지만 변경 전 HEAD(637d467) 워크트리에서도 동일하게 실패함을 확인 — 이 환경(ARM Linux 폰트/타이밍) 기존 실패로 판단, EP07 회귀 아님. Windows 기준 환경에서는 재실행하지 못했다. 사람이 실제 속도로 끝까지 플레이한 시간(목표 7~9분)은 측정하지 않았다.
- 보존: Story 진행/J 기록/블루스크린/LOOP 02/`finaleSeen`/`jayUnlocked`/`eps` 불변, CLASSIFIED/AUTHOR는 EP07 조건에 사용하지 않음(AUTHOR 훅은 id만 전달), EP07 clear → Field EP08 해금만(EP09 불변), `yuyeon98.save.v1`/`field.v1`/Save Code v5·v4 형식 불변, CLUES/DEDUCTIONS/ACHIEVEMENTS/SECRETS id·순서 불변(`c07-hq` 인용 문구만 canon 번호로 교정). EP07은 진행 중 스냅샷을 저장하지 않는다(`FieldSave` PROGRESS_IDS 불변).
- Git: commit/push 하지 않음(개발 서버 반영만, 사용자 확인 대기).
- 미해결: ① 거울 확인은 A 손님에서만 요구한다(정상 손님에게 거울 확인을 강제하지 않음). ② 자동문 잠금은 `계산대를 비우고 화장실에 다녀온다` 한 동작 안에서 조건 충족 시 잠금으로 처리하며 별도 잠금 버튼은 없다. ③ Story의 EP7 CCTV 미니게임(`app.js`)은 Story 독립 원칙으로 건드리지 않았다. ④ 효과음 없음, 영상은 기존 `movies/ep7_*.mp4` 재사용. ⑤ darkweb_ui/ep02 기존 실패 원인 미조사.

## 2026-10-08 — PUBLIC CLASSIFIED 시스템과 AUTHOR 메타 반응 추가 (classified-01)

- 목적: 사용자 지시. 플레이어 유형은 일반/AUTHOR 둘뿐이며 CLASSIFIED는 모두에게 공개된 선택적 히든 발견(권한/접근 코드 없음, 서로 독립, Story·Field unlock·J·LOOP·엔딩과 무관). AUTHOR는 CLASSIFIED를 자동 해금하지 않고 특정 발견 후 `[제작자에게.txt]` 재열람 시에만 추가 반응을 본다.
- 구조: 새 `classified.js`(`CLASSIFIED_ENTRIES`, `CLASSIFIED_TOTAL=3`, `Classified` 상태 모듈, 독립 키 `yuyeon98.classified.v1`의 `{v:1, discovered:[], viewed:[]}`; 알려진 id만 허용). `classified-02/03`은 미정이며 만들지 않았다. index-sensitive 배열(`CLUES` 등)은 변경하지 않았다.
- classified-01: EP06(박예림/2019/태양해안)과 EP01(`해안관리-2019-031`)이 같은 장소를 가리킨다는 사실만 표시. 인과·동일 사건·동일 존재·은폐 비확정, 문서 끝 문장 `두 사건의 관계는 확인되지 않았습니다.` 유지. 발견: EP06 clear(→ EP07 unlock 그대로) 후 post-clear free inspection에서 17번 자리를 다시 조사 → contextual `17번 자리를 다시 확인한다` → 기록 대조 로그 → `[자동 연계 실패]` → `[CLASSIFIED TRACE RECOVERED]` 토스트(`CLASSIFIED 1/3`). 재조사 중복 획득 없음. 새 괴이 물건 없음. 변경: `field/ep06/ep06-ui.js`(post-clear 상태), `field/field-core.js`(`FieldCore.refresh()` 추가: 시계를 진행하지 않는 재렌더), `field/field-ui.js`(종료 후에도 `[data-live]` 요소는 비활성화하지 않음).
- 사건수사노트 UI: 첫 발견 전에는 CLASSIFIED 탭/문구가 어디에도 없고, 발견 후에만 `CLASSIFIED` 탭(`[ CLASSIFIED ]`, `복구된 분류 보류 기록 1 / 3`, `■ 01 태양해안 기록 대조`, `□ [미확보]` ×2, 항목 클릭 시 문서). AUTHOR 표시 없음. 변경: `notebook.js`.
- AUTHOR: hash `f7dda4fd…20ae`는 기존 값과 동일해 그대로(입력 처리 trim → NFKC → UTF-8 → SHA-256, 대소문자 구분; 코드 평문은 소스에 두지 않음). 반응: `field/field-author.js`의 `AUTHOR_CLASSIFIED_REACTIONS` 표(`classified-01` → `HIDDEN을 전부 열었을까? 다음 문장은 말이야.`)를 `[제작자에게.txt]`를 열 때 계산해 본문 끝에 한 줄 추가(AUTHOR 해금 AND 발견, 순서 무관). 발견 순간 팝업 없음, 일반 플레이어 비노출.
- Save/Reset: Save Code v5에 additive 계층 `classified` 추가(구 코드는 현재 상태 보존, 구 세이브에 키 없으면 기본값). `GameSave.reset()`이 CLASSIFIED도 초기화하고 AUTHOR reset 의미는 그대로. 변경: `save.js`, `tests/save_progress_smoke.py`(v5 payload 키 기대값에 `classified` 추가). `vercel.json` 정적 빌드 목록에 `classified.js` 추가(누락 시 배포본에서 404).
- 테스트: 새 `tests/classified_browser_smoke.py` ALL PASS(첫 발견 전 UI 없음, EP06 clear → EP07 무관, post-clear 재조사 → 발견·중복 없음, 노트 UI/문서, reload/Save Code/구 세이브/알 수 없는 id, reset, AUTHOR 입력 변형, 잠금 상태 비노출, AUTHOR 먼저/CLASSIFIED 먼저 모두 문구 표시, 팝업 없음, 자동 해금 없음, Story flag 불변). AUTHOR 코드는 저장소에 없으므로 환경변수 `AUTHOR_TEST_SECRET`로 주입해 실행한다(없으면 AUTHOR 케이스는 SKIP으로 표시). 회귀: ep06, ep05, ep04, ep03, ep02, field, author, record_reset, save_progress, darkweb_ui 모두 PASS(Story/J/LOOP 포함).
- 직접 확인: 실제 클릭으로 EP06 clear 화면에서 17번 자리 → 재확인 → 대조 로그 → 토스트 → 노트 CLASSIFIED 탭/문서까지, AUTHOR 해금 후 `[제작자에게.txt]`의 발견 전/후 문구를 스크린샷·테스트로 확인했다. 발견하지 않은 AUTHOR에게 문장이 미리 노출되지 않음을 확인했다.
- 미해결: classified-02/03의 내용·발견 방식과 두 번째 AUTHOR 반응 대상은 미정(EP07~EP10 reviewed canon 확인 후 결정). 문구 자체는 소스(`field-author.js`)에 있으므로 "화면에 보이지 않음"이지 "소스에서 숨김"은 아니다(프론트엔드 이스터에그). 사람이 직접 플레이한 UX 확인은 아직이다.
- 다음: EP07~EP10 reviewed canon 확보 후 classified-02/03 설계, 두 번째 AUTHOR 반응 결정.
- Git: 커밋/푸시는 사용자 지시 시.

## 2026-10-08 — 1~6화 수칙문서를 현장 지침서 형태로 정리

- 목적: 사용자 요청 "원문을 그대로 파싱한 느낌이라 진짜 지침서처럼, 요약하되 게임에 필요한 문구는 남기고 참고용만 남겨 달라". 범위는 사용자 선택에 따라 reviewed 원문이 있는 1~6화(7~10화는 변경 없음).
- 변경 파일: `1화.txt`~`6화.txt`, `index.html`(Story 문서 창 6개를 같은 텍스트로 동기화), `tests/ep02`~`ep06_browser_smoke.py`, `PROJECT_CONTEXT.md`, 메모리 노트.
- 방식: 문서 번호·작성/부착 정보·`[0] 개요 / 현황`·`[1] 기본 수칙`·`[2] 확인된 비정상 상황 및 대응 지침`·`[!] 최종 경고`의 공통 골격은 유지. 배경 서술은 줄이고(예: 3화 본부 조치, 5화 2021년 사고/필수 사항, 6화 버스 사고) 규칙과 상황은 `징후/대응/금지/주의/결과/해제` 라벨의 짧은 항목으로 재구성했다. 게임 규칙 문구와 Story 인용문은 원문 문장 그대로 유지(`[문장 일부 삭제]`, `잠든 환자는 야간, 어...`, 5화 상황 A 삭제 표기, 91번 문장, 6화 `보고 전, 단 한 번이라도…` 포함). 새 사실은 추가하지 않았다.
- 1화: 이미 지침서 형태라 내용 변경 없이 항목 구조만 정리했다. 최종 경고의 구판 문장을 reviewed 원문(`구판 문서 발견 시 즉시 관리소에 반납하십시오. 구판의 수칙을 따르지 마시기 바랍니다.`)에 맞췄고 `MESSENGER_GENERIC`의 1화 인용문과 일치한다(기존에는 불일치).
- 검증: `CLUES`·`MESSENGER_GENERIC`의 1~6화 인용문이 모두 해당 문서에 그대로 있음을 확인했고(누락 0), 2~6화 테스트의 `reviewed 전체 문장 포함` 검사를 `핵심 문구 + Story 인용문` 검사로 바꿔(축약으로 사라진 배경 문구 마커는 목록에서 제외) 전체 회귀(ep06~ep02, field, author, record_reset, save_progress, darkweb_ui)가 PASS했다. Story window == `N화.txt` single source 검사는 그대로다.
- 한계: 규칙·상황 문구는 게임/Story가 의존하므로 요약 폭이 크지 않다(문서 크기 약 5~15% 감소). 더 줄이려면 어떤 규칙 문장을 의역해도 되는지 사용자 결정이 필요하다. Field 로직·영상·저장은 변경하지 않았다.
- Git: 커밋/푸시 안 함.

## 2026-10-08 — Field EP06 「청림고등학교 2학년 3반 17번」 구현 (담임교사 일상 유지 + 절차 대응)

- 목적: 사용자 지시로 EP06 Field Game 구현. 핵심 개념은 "담임교사 일상 유지 + 절차 대응 시뮬레이션"(이상현상이 발생해도 교사는 평소와 같은 행동을 계속해야 한다). canon 순서는 REVIEWED TRANSCRIPT → `6화.txt` → Story → Field Data → Gameplay → UI → Tests → 문서.
- transcript 반영: 사용자 확정본 `D:\YUYEON\windows98\text_original_etc\EP06_청림고등학교_2학년_3반_17번_reviewed.txt`를 `docs/transcripts/reviewed/EP06_청림고등학교_2학년_3반_17번.txt`로 바이트 동일 복사(`cmp`로 확인). `docs/transcripts/README.md`에 EP06 절 추가. RAW 원본은 제공되지 않았다.
- `6화.txt` 교체: 이전 판은 transcript와 충돌(`학급관리-2021-05-20`, 교무행정실, 2025년 개정/시행 일자, 책상 유리 하단, 열람 금지, 옛 상황 A~D)해 전면 교체했다. 새 판은 transcript 문장을 그대로 쓴 공통 골격(문서 번호 `2021-05-20`, 부착 위치 `청림고등학교 교무실. 2학년 3반 담임선생 전용 지정석`, `[0] 개요 / 현황`, `[1] 기본 수칙` 규칙 1~2, `[2]` ■ 상황 A~E(원문 순서), `[!] 최종 경고`)이다. 프롬프트 예시의 `[0] 개요 및 현황`·`[1] 기본 담임 업무 수칙` 대신 EP02~EP05의 공통 제목을 썼다. `보고 전, 단 한 번이라도 17번으로 다른 학생을 호명한 경우`는 원문 그대로이며 `그 전`/`보고 후`/`배정 전`으로 바꾸지 않았다. 학교 주소·교장 이름·박예림 생년월일·정확한 날짜·SNS-0017 제조 정보·학급 인원은 만들지 않았다.
- Story 연쇄 수정: `index.html`의 EP6 문서 창 textarea를 `6화.txt`와 동일하게 교체, 라벨 `청림고 2-3반 17번`→`청림고등학교 2학년 3반 17번`, `story-data.js`(`EPISODE_TITLES[6]`, `EPISODE_DOCS[6]`=`2021-05-20`, 단서 `c06-yerim` 인용을 원문 표기로; 나머지 단서 인용은 원문에 그대로 있어 유지).
- Field data/gameplay/UI(새 파일): `field/ep06/ep06-data.js`, `ep06.js`, `ep06-ui.js`, `tests/ep06_browser_smoke.py`. 변경: `field/field-save.js`(진행 중 스냅샷 대상에 `EP06` 추가), `field/field.css`(EP06 섹션), `index.html`(스크립트 3개).
- 핵심 구현: 교실 하나가 인터페이스(칠판·스피커·시계·교실 문·교탁·학생 좌석·17번 자리가 클릭하는 사물, 출석부는 조회 카드, 교탁 서랍에 SNS-0017/버튼/내선 전화). 일과 압축: 교실 준비 → 조회(출석 ritual) → 수업(판서) → 쉬는 시간 → 영어 듣기 평가 → 오후 수업 → 방과 후 조례 → 종료. 출석: 17번은 항상 박예림, 대답 여부와 무관하게 결석 복창, 고개를 들면(다른 사물 클릭) 실패, 출석 처리는 canon 실패. 17번 자리: 먼지는 닦아야 하고(조례 종료 시 확인), 조례에서 바다 냄새면 SNS-0017, 바닷물·해조류면 모든 학생을 내보낸 뒤 0050-0200. A(전원 응시: 17번 자리 응시·한쪽씩 번갈아 눈 감기·무응답·무이동·물 차오름·45초 뒤 구조), B(17번 배정: 보고→임시 번호, 보고 전 호명→20초 안에 격리실 이동 아니면 canon 실패, 격리실 문 열기 금지), C(젖은 흔적 간접 관찰→교탁 버튼→학생안전부 안내), D(듣기 평가 이상음: 잡담 금지 발언·중단/스피커 끄기 금지·종료 후 SNS-0017 두 번), E(문 밖 목소리: 열면 의미 변경·기록 중단, 판서 지속, 박예림이 스스로 여는 건 실패 아님). NORMALITY: E 중 판서가 25초 멈추면 `ROUTINE_BROKEN`.
- UI 정답 비노출: HUD는 일과 라벨/장소/진행 중뿐, 이상 이름·내부 flag 없음, 시작 행동은 `조회를 시작한다` 하나, 수업 중에는 버튼이 없고, 결석/출석 선택·눈 감기·대답/움직임·이상음 대응·격리 이동 같은 상황 행동은 그 순간에만 등장, 교탁 서랍은 사물 목록이며 사용 시점을 알려 주지 않는다.
- Save/호환: 기존 키 3개와 Save Code v5/v4 의미 그대로. EP06 진행 중 스냅샷(`progress.EP06`)은 reload 후 "이어서 파견"으로 복원, v5 내보내기에 포함, 손상 스냅샷 무시. EP06 clear → Field EP07 해금만.
- AUTHOR: generic hook만(`onEpisodeStart('EP06')`, `onMajorEvent('EP06', id)`, `onEpisodeClear('EP06')`), 콘텐츠 없음. CLASSIFIED/H01-H10/11번째 사건 미구현.
- 영상: 새 asset 없이 `movies/ep6_*.mp4` 5개를 실제 프레임으로 확인해 재사용(빈 교실/출석부/모두가 같은 쪽을 보는 교실/바닥에 퍼지는 물/불투명 유리문 너머의 형체).
- 테스트 변경: `tests/ep05_browser_smoke.py`(EP05 clear 후 EP06이 `파견 가능`).
- 검증(실행함): `tests/ep06_browser_smoke.py` ALL PASS(규칙 문서·해금·교실 UI 비노출·17번 자리·출석 ritual·A·B·E·C·D·조례·전체 일과·저장 복원/v5/손상 스냅샷). 회귀 테스트 전체 실행 결과는 아래 최종 확인 참고. 직접 플레이: 실제 클릭으로 교실 준비→출석부→A/B/C/D/E→조례를 msedge 스크린샷으로 확인하고 정답 버튼 상시 노출 여부를 점검했다(수업 중 버튼 0개). 완전 플레이 봇 300회: 100% clear, soft-lock 0. 못 한 것: 사람이 처음부터 끝까지 실제 속도로 플레이한 시간 측정(목표 10~15분), 소리.
- 보존: 기존 Story(Darkweb → 사건 파일/CCTV/docs → EP09 스마트폰 → J → 블루스크린 → LOOP 02), `GameSave`/`GameProgress`, EP01~EP05 Field 로직 변경 없음. Story EP6 CCTV 미니게임(app.js)은 로직·문구를 손대지 않았다.
- Git: 커밋/푸시 안 함(개발 서버 `http://localhost:3000`에만 반영, CLAUDE.md 규칙). commit hash 없음.
- 미해결: ① Story EP6 CCTV 미니게임이 옛 수칙 구성을 그대로 사용 — 별도 결정 필요. ② transcript가 결과를 말하지 않는 지점(고개를 듦·복창 생략, A 중 시선/눈/대답/이동, 격리실 문, E에서 직접 문을 연 뒤, 수업 중단, C 미완료, D 중단·경고 생략, 조례 처리, 17번 자리 방치, 격리 종료 방식)은 system failure/조정값. ③ 출석부는 15~19번만, 판서 횟수·시간표·마스킹 이름·확률은 implementation 선택. ④ 사람 플레이 시간 미측정.
- 다음: 사용자 직접 플레이로 일과 길이/난이도 확인 후 조정, Story EP6 CCTV 정리 여부 결정, EP07 구현(`reviewed` 자료 필요).

## 2026-10-07 — Field EP05 「애기소」 구현 (10분 제한 구조작전 + 접촉/오염 판별)

- 목적: 사용자 지시로 EP05 Field Game 구현. 핵심 개념은 "10분 제한 구조작전 + 접촉/오염 판별". canon 순서는 REVIEWED TRANSCRIPT → `5화.txt` → Story → Field Data → Gameplay → UI → Tests → 문서.
- transcript 반영: 사용자 확정본 `D:\YUYEON\windows98\text_original_etc\EP05_애기소_reviewed.txt`를 `docs/transcripts/reviewed/EP05_애기소.txt`로 바이트 동일 복사(`cmp`로 확인). `docs/transcripts/README.md`에 EP05 절 추가. RAW 원본은 제공되지 않았다.
- `5화.txt` 교체: 이전 판은 transcript와 충돌(`아기소`, `통제구역-2024-06-02`, 개정/시행 일자/부착 위치/열람 제한, 상황 A 최면성 침수 충동, 상황 D 10분 도달, `수심 수십 cm`, `5m`, `철책`, `스프레이`)해 전면 교체했다. 새 판은 transcript 문장을 그대로 쓴 공통 골격(문서 번호 `2024-06-02`, `[0] 개요 / 현황`, `[1] 기본 수칙` 규칙 1~4, `[2]` `애기소 현장 투입팀 구조 매뉴얼.` + `■ 상황 A: 해당 항목은 삭제되었습니다.` + B~F, `[!] 최종 경고`)이다. 프롬프트 예시의 `[0] 개요 및 현황`·`[1] 기본 접근 / 구조 수칙` 대신 EP02~EP04의 공통 제목을 썼다. 상황 A는 복원/추측하지 않았고 상황 F 문장은 원문 그대로다. 시행 일자·통제 등급·좌표·시설명·개체 91번 설명은 만들지 않았다.
- Story 연쇄 수정: `index.html`의 EP5 문서 창 textarea를 `5화.txt`와 동일하게 교체, 라벨/Story CCTV 표기 `아기소`→`애기소`(`살둔 계곡 애기소`→`살둔계곡 애기소`), `story-data.js`(`EPISODE_TITLES[5]`=`살둔계곡 애기소`, `EPISODE_DOCS[5]`=`2024-06-02`, 단서 `c05-annual` 인용을 원문 표기로), `terminal.js` 검색 정규식에 `애기소` 추가(`아기소`도 유지).
- Field data/gameplay/UI(새 파일): `field/ep05/ep05-data.js`, `ep05.js`, `ep05-ui.js`, `tests/ep05_browser_smoke.py`. 변경: `field/field-save.js`(진행 중 스냅샷 대상에 `EP05` 추가), `field/field.css`(EP05 섹션), `index.html`(스크립트 3개).
- 핵심 구현: 브리핑(타이머 미작동) → 각성제 주입(없이 진입하면 시스템 실패) → 반경 진입 시 정확히 600초(실시간) 타이머 시작, 수칙/기록 열람 중에도 멈추지 않음, 0:00 = canon 실패 → 지역 이동/살피기/수색/질문이 모두 실시간 소요 → 대상자 확보 → 판별 → 경계 이탈. 접촉(옷/신발 포함)은 상태로 관리하며 저림→부종→전신 팽창→사망을 압축 구현, 문지르기/씻기는 가속, 부종 후 압박/얼음찜질은 즉발 파열, 접촉 보고 시 작전 종료(치료법 없음). B(30시간 생존자: 회복 아님→비상 프로토콜 A 완전 격리), C(각성제 후 울음/웃음→빨간 알약), D(통신 장비 파일: 재생 금지, EMP→밀폐→본부 보고 순서), E(체류 시간→저림→접촉 전 후송/접촉자 보고, 초과 체류=접촉자, 부은 곳 묶어 달라는 요구 거절), F(반사 이상→확보 개체 91번 검은 것을 반복 방사해 완전 제거). 상황 A는 이벤트 없음. 충동은 vignette/문구/선택지 꼬리표로만 표현.
- 안전: D의 위험한 소리는 어떤 형태로도 재생하지 않는다(audio asset·AudioContext 없음, `재생 차단` 파형 텍스트만; 테스트가 소스를 검사).
- UI 정답 비노출: HUD는 타이머/반경/상태/TEAM 3뿐, 장비 목록은 점검 후 이름만, 빨간 알약·EMP·밀폐·보고·91번·압박·얼음·판단 버튼은 해당 상황 관찰 후에만 등장, SAFE/INFECTED 라벨 없음, 대상자 종류·젖은 길 쪽 비표시, 접촉 대응 버튼은 정답을 가운데에 둔 순서.
- Save/호환: 기존 키 3개와 Save Code v5/v4 의미 그대로. EP05 진행 중 스냅샷(`progress.EP05`)은 reload 후 "이어서 파견"으로 복원되며 복원 후에도 타이머가 줄어든다. v5 내보내기에 포함, 손상 스냅샷 무시. EP05 clear → Field EP06 해금만.
- AUTHOR: generic hook만(`onEpisodeStart('EP05')`, `onMajorEvent('EP05', id)`, `onEpisodeClear('EP05')`), 콘텐츠 없음. CLASSIFIED/H01-H10/11번째 사건 미구현.
- 영상: 새 asset 없이 `movies/ep5_*.mp4` 5개를 실제 프레임으로 확인해 재사용(계곡/흰 방호복 3인/웅덩이와 손/어두운 숲의 실루엣/웅덩이 표면).
- 테스트 변경: `tests/ep04_browser_smoke.py`(EP04 clear 후 EP05가 `파견 가능`), `tests/ep02_browser_smoke.py`(개발 모드에서 EP05가 `파견 가능`).
- 검증(실행함): `tests/ep05_browser_smoke.py` ALL PASS(규칙 문서·해금·브리핑·정확히 10분 타이머·기본 이동·접촉(진행/문지르기/씻기/압박/얼음/보고/대상자 접촉)·A 삭제·B·C·D·E·규칙 4·F·UI 비노출·전체 플레이·저장 복원/v5/손상 스냅샷). 회귀: ep04, ep03, ep02, field, author, record_reset, save_progress, darkweb_ui 모두 PASS. 직접 플레이: 실제 클릭으로 브리핑→주입→진입→수색→확보→판별→이탈과 접촉/C/D/F 화면을 msedge 스크린샷으로 확인하고 정답 노출 여부를 점검했다. 완전 플레이 봇 300회: 100% clear, soft-lock 0, 남은 시간 중앙값 약 288초. 못 한 것: 사람이 처음부터 끝까지 실제 속도로 플레이한 시간 측정(목표 10~15분), 소리.
- 보존: 기존 Story(Darkweb → 사건 파일/CCTV/docs → EP09 스마트폰 → J → 블루스크린 → LOOP 02), `GameSave`/`GameProgress`, EP01~EP04 Field 로직 변경 없음. Story EP5 CCTV 미니게임(app.js)은 로직·문구를 손대지 않았다.
- Git: 커밋/푸시 안 함(개발 서버 `http://localhost:3000`에만 반영, CLAUDE.md 규칙). commit hash 없음.
- 미해결: ① Story EP5 CCTV 미니게임이 삭제된 상황 A(최면성 침수 충동)와 옛 상황 D 등 옛 규칙을 그대로 사용 — 별도 결정 필요. ② transcript가 결과를 말하지 않는 지점(각성제 없이 진입, 대상자 없이 이탈, 절차를 건너뛴 판단, 오판 결과, D 순서 위반/미격리, 접촉 미보고 이탈, 접촉 보고 후 작전 종료, 대상자 접촉 실패)은 system failure/조정값. ③ 지역·이동 시간·진행 압축 비율·젖은 길·진술 문구·부은 곳 요구는 implementation 선택. ④ 사람 플레이 시간 미측정.
- 다음: 사용자 직접 플레이로 10분 타이머 체감/난이도 확인 후 조정, Story EP5 CCTV 정리 여부 결정, EP06 구현(`reviewed` 자료 필요).

## 2026-10-07 — Field EP04 「불 꺼진 13층 엘리베이터」 구현 (거울 관찰 퍼즐)

- 목적: 사용자 지시로 EP04 Field Game 구현. 핵심 개념은 "거울 관찰 퍼즐"(확인하지 않으면 내려갈 수 없지만 확인할수록 그녀가 가까워진다). canon 순서는 REVIEWED TRANSCRIPT → `4화.txt` → Story → Field Data → Gameplay → UI → Tests → 문서.
- transcript 반영: 사용자 확정본 `D:\YUYEON\windows98\text_original_etc\EP04_엘리베이터_reviewed.txt`를 `docs/transcripts/reviewed/EP04_불_꺼진_13층_엘리베이터.txt`로 바이트 동일 복사(검증: `cmp`). `docs/transcripts/README.md`에 EP04 절 추가. RAW 원본은 제공되지 않았다.
- `4화.txt` 교체: 이전 판은 transcript와 충돌(`승강기관리-2016-0135`, 오피스텔관리국, 시행 일자, 부착 위치, 열람 금지, 옛 A/B/C/D 구성, `내발로`)해 전면 교체했다. 새 판은 transcript 문장을 그대로 쓴 공통 골격(`[ 특별재난관리본부 ]` / 문서 번호 `2026-013호` / `[0] 개요 / 현황` / `[1] 기본 수칙` / `[2] 확인된 비정상 상황 및 대응 지침` ■ 상황 A~E / `[!] 최종 경고`)이다. 프롬프트 예시의 `[0] 개요 및 현황`·`[1] 기본 탈출 수칙` 대신 EP02/EP03에서 확립된 공통 제목을 썼다(전 에피소드 동일 구조 규칙). 시행 일자·부착 위치·보안 등급·담당 부서·주소·층수 범위는 만들지 않았다.
- Story 연쇄 수정: `index.html`의 EP4 문서 창 textarea를 `4화.txt`와 동일하게 교체, 라벨 `불꺼진`→`불 꺼진`(index.html·app.js 주석/로그), `story-data.js`의 `EPISODE_DOCS[4]`=`2026-013호`(단서 인용 4건은 transcript에 그대로 있어 변경 없음). `terminal.js`/`notebook.js`는 점검 결과 수정 불필요.
- Field data/gameplay/UI(새 파일): `field/ep04/ep04-data.js`, `ep04.js`, `ep04-ui.js`, `tests/ep04_browser_smoke.py`. 변경: `field/field-save.js`(진행 중 스냅샷 대상에 `EP04` 추가), `field/field.css`(EP04 섹션), `index.html`(스크립트 3개), `server.js`(`/favicon.ico` 204).
- 핵심 구현: 정면 표시기 항상 13. 실제 층은 후면 거울 관찰에서만 확인(첫 관찰 20), 그녀의 쪽은 측면 거울에서만 확인(측면 관찰은 그녀를 움직이지 않음). 후면 관찰은 그녀를 반대 거울로 옮기고 한 걸음 접근시키며 조명·노이즈 단서가 강해진다. 그녀 좌측=위층 버튼/우측=아래층 버튼이 하강, 반대는 상승, 하강 폭 1~3 무작위, 1층은 반드시 정차하며 하차하면 clear·떠나면 실종. 상황 A~E는 transcript대로 구현(A 얼굴/층 확인 불가/횟수 차감/무작위 상승·하강, B 말 걸 때만 대응·거울 3회·귀·웅크림, C 남성 하차→다음 정차에서 문 열림 hold→방송 흐느낌 때 release, D 양쪽 그녀→반대쪽 촬영/가만히(+2걸음)/잘못된 거울 canon 실패/사진 확인 금지, E 이름·가족 목소리→마지막 확인 층 버튼 3초 hold/대답·스피커 쪽 보기·잘못된 버튼 실패).
- 정답 비노출: HUD는 `13F/문 상태/휴대폰`뿐, 실제 층·그녀 쪽·거리·정답 방향·이벤트 이름·boolean 없음, 정답 버튼 강조 없음(버튼 점등은 무작위 가짜), 상황 행동은 관찰 후에만 등장. 로그는 현장 관찰 문장.
- Save/호환: 기존 `yuyeon98.save.v1`/`yuyeon98.field.v1`/`yuyeon98.author.v1` 의미와 Save Code v5/v4 그대로. EP04 진행 중 스냅샷(`progress.EP04`)은 필드 키의 선택적 항목이며 reload 후 "이어서 파견"으로 복원, v5 내보내기에 포함, 손상된 스냅샷은 무시. 이전 세이브 코드/기록은 영향 없음. EP04 clear → Field EP05 해금만.
- AUTHOR: generic hook만(`onEpisodeStart('EP04')`, `onMajorEvent('EP04', id)`, `onEpisodeClear('EP04')`), 콘텐츠 없음. CLASSIFIED/H01-H10/11번째 사건 미구현.
- 영상: 새 asset 없이 `movies/ep4_*.mp4` 5개를 실제 프레임으로 확인해 용도에 맞게 재사용(복도/반복 거울 통로/그녀/거울 가득 얼굴/버튼 누르는 손).
- 테스트 변경: `tests/ep03_browser_smoke.py`(EP03 clear 후 EP04가 `연결 준비 중`이 아니라 `파견 가능`), `tests/field_browser_smoke.py`·`author_browser_smoke.py`·`record_reset_smoke.py`(페이지 CSP가 Playwright `wait_for_function`의 문자열 평가를 막아 `bypass_csp=True` 컨텍스트 사용; 페이지 CSP 자체는 약화하지 않음).
- 검증(실행함): `tests/ep04_browser_smoke.py` ALL PASS(규칙 문서·해금·UI 비노출·거울 루프·접근 단서·방향 규칙·1층 하차/실종·A·B·C·D·E·페이싱·진행/Story 불변/AUTHOR hook·저장 복원/v5/손상 스냅샷). 회귀: field, author, record_reset, save_progress, darkweb_ui, ep02, ep03 모두 PASS. 직접 플레이: 스크립트로 실제 클릭(거울·층 버튼·누른 채 유지)을 수행하며 msedge 스크린샷으로 시작/관찰/D/E/C hold/A 얼굴/B 발화/1층/clear 화면을 확인했고 정답이 노출되지 않음을 점검, 390px 모바일 레이아웃(가로 스크롤 없음) 확인. 완전 플레이 봇 300회: 97% clear, soft-lock 0, 평균 도착 8.1회·후면 관찰 8.8회(나머지 RECORD_LOST). 못 한 것: 사람이 처음부터 끝까지 실제 속도로 플레이한 시간 측정(목표 10~15분), 소리.
- 보존: 기존 Story(Darkweb → 사건 파일/CCTV/docs → EP09 스마트폰 → J → 블루스크린 → LOOP 02), `GameSave`/`GameProgress`, EP01~EP03 Field 로직 변경 없음. Story EP4 CCTV 미니게임(app.js)은 로직·문구를 손대지 않았다.
- Git: 커밋/푸시 안 함(개발 서버 `http://localhost:3000`에만 반영, CLAUDE.md 규칙). commit hash 없음.
- 미해결: ① Story EP4 CCTV 미니게임이 옛 규칙·원문에 없는 사망 묘사를 사용(수칙문서와 불일치) — 별도 검토 필요. ② transcript가 결과를 말하지 않는 지점을 system failure/조정값으로 처리: 남은 횟수 0, 그녀가 완전히 접근한 뒤(`RECORD_LOST`), 잘못된 거울 두드림·B 절차 순서/시간 초과, C에서 버튼 미입력·조기 release, D 사진 확인, E 스피커 쪽 보기, 1층이 아닌 곳 하차, C가 B에서 이어지는 구조, 문 열림·사건 중 층 버튼 무반응. ③ 층 버튼 1~13/상승 상한 12/시작 11~12층 등 모든 수치는 조정값. ④ 사람 플레이 시간 미측정.
- 다음: 사용자 직접 플레이로 난이도·시간 확인 후 조정, Story EP4 CCTV 정리 여부 결정, EP05 구현(`reviewed` 자료 필요).

## 2026-10-07 — 개발서버 정적 노출 차단 및 보안 헤더 추가

- 목적: 보안 점검에서 `express.static(__dirname)` 이 `.git`, `server.js`, `*.md`, `tests`, `docs`, `*.psd` 등 프로젝트 루트 전체를 노출하는 것을 확인해 수정 요청.
- 변경 파일: `server.js`, `vercel.json`.
- 핵심 구현: server.js 에 공개 허용 목록(루트의 html/css/js/mp4/png/jpg/txt 와 `field/`, `image/`, `movies/`)만 서빙, 점(.)으로 시작하는 경로·`server.js`·역슬래시·NUL·인코딩 우회 경로는 404, 확장자 있는 없는 파일은 SPA 폴백 대신 404, `x-powered-by` 제거. 보안 헤더(CSP, nosniff, X-Frame-Options DENY, Referrer-Policy)를 server.js 와 vercel.json 양쪽에 동일하게 추가하고 vercel.json 의 `Access-Control-Allow-Origin: *` 제거. CSP 는 app.js 의 인라인 onclick 때문에 script-src 에 `unsafe-inline` 유지, mona 폰트용으로 cdn.jsdelivr.net 허용.
- 검증: `node --check server.js`, vercel.json JSON 파싱, curl 로 허용 경로(/, 정적 JS/CSS, field/image/movies, 루트 mp4/txt) 200 및 차단 경로(.git/config, %2e 인코딩, server.js, package.json, CLAUDE.md, node_modules, tests, docs, psd, 없는 파일, ..%2f) 404 확인. 브라우저 스모크 테스트와 CSP 콘솔 위반 확인은 실행하지 못함.
- 보존: 게임 코드·Save 데이터·스토리 진행 변경 없음.
- Git: 커밋/푸시 안 함(개발 서버에만 반영).
- 미해결: 브라우저에서 폰트·영상·이미지 CSP 위반 여부 수동 확인 필요. `innerHTML` 사용처(app.js 약 60곳) 중 변수 삽입부 점검, 세이브 코드 변조 방지(체크섬은 손상 감지용)는 미착수.

## 2026-10-05 — 3화.txt 서식을 EP01/EP02 수칙문서와 통일

- 사용자 지시: EP03 수칙문서 서식이 EP01/EP02와 맞지 않아 다시 확인해 작성. 문장은 reviewed transcript 그대로이며 내용·canon 변경 없음(서식만).
- 변경: 섹션 제목을 공통 골격(`[0] 개요 / 현황`, `[1] 기본 수칙`, `[2] 확인된 비정상 상황 및 대응 지침`)으로 통일, `[1]`의 번호 규칙은 EP01처럼 첫 문장 + `   - ` 하위 항목으로, 나머지는 EP02처럼 한 문장(또는 한 의미 단위)당 한 줄로 분리. `■ 비상 상황 A/B`에 `: 제목` 추가(EP02 `■ 상황 X: 제목`과 동일 패턴). `■ 인식표 대응`·`A-1.`~`A-5.` 표기는 transcript 원문 표기라 유지.
- 연쇄 수정: `3화.txt`, `index.html`(`#darkwebReportWindowEP3 textarea`), `tests/ep03_browser_smoke.py`(섹션 marker), `PROJECT_CONTEXT.md`. 검증: `tests/ep03_browser_smoke.py` 전체 PASS(transcript 문장 포함, `3화.txt` = Story 창 = Field 탭). commit/push 하지 않음.

## 2026-10-05 — EP02 주행 구간 단축

- 사용자 플레이 피드백: 역과 역 사이 주행이 너무 길어(용답까지 3분) 열차가 멈춘 것처럼 느껴진다. 시간표 확인 결과 막힌 구간은 없었고(무입력/자동 플레이 모두 끝까지 진행) 단순히 길었다. `field/ep02/ep02-data.js`의 주행 `dur`만 조정: 성수까지 60→45, 용답까지 180→**100**, 신답(존재하지 않는 역 전) 70→**50**, 신답까지(이후) 110→**70**, 용두까지 180→**100**. 정차 12초, 존재하지 않는 역 40초, 용두 정차 45초, 신설동행 40초는 그대로. 용두 정차까지 약 11분 → **약 7분**.
- 로직/규칙 변경 없음. 취객 추격(거리 9초 단위), 암전 객차 수색, 재인식 12초 등은 그대로이므로 체감 난이도가 올라갈 수 있다(조정은 같은 값만 바꾸면 된다). `PROJECT_CONTEXT.md` 시간표를 갱신했다.
- 검증: `tests/ep02_browser_smoke.py`와 시간표 자동 플레이(무입력/암전 객차~기관실) 확인. 이 변경은 commit/push하지 않고 개발 서버에만 반영했다.

## 2026-10-05 — EP03 「베리 해피 종합병원」 Field Game 구현 (+ 3화 문서 재작성)

- 지시/근거: 사용자 요청 "EP03 Field Game 구현". canon 최상위는 사용자 제공 reviewed `D:\YUYEON\windows98\text_original_etc\EP03_베리_해피_종합병원_reviewed.txt`. 순서: REVIEWED → `3화.txt` → Story 문서/데이터 → Field 데이터 → gameplay → UI → 테스트 → 문서. 이번에는 사용자 지시로 commit/push까지 진행.
- 1) reviewed 반영: `docs/transcripts/reviewed/EP03_베리_해피_종합병원.txt` 추가(요약·재전사 없이 확정 문장 그대로). `docs/transcripts/README.md`에 기록, 기존 `partial/`은 superseded로 보존. "야간, 어..."는 의도된 연출로 보존.
- 2) `3화.txt` 전면 재작성: 공통 골격(`[기관]` → `[0] 개요 및 현황` → `[1] 기본 생존 수칙` → `[2] 확인된 특수 상황 및 대응 지침`(인식표 3종, 비상 상황 A/B) → `[!] 최종 경고`). **제거한 근거 없는 설정**: `병원관리-2023-0635`(→ `2023-063호`), 시행 일자 2024-05-10, 부착 위치, 외부 게시 불가·열람 제한, "메리 정신병원"(→ 베리), 요약으로 바뀐 문장들(상황 A~D 재구성, "7일 차 면실 최종 탈출" 등).
- 3) 연쇄 수정(한 파일만 고치지 않음): `index.html` Story EP03 문서 창, `story-data.js`(`EPISODE_DOCS[3]`, 단서 `c03-rescue`/`c03-meri`/`c03-rounds` 인용문을 원문과 일치하게), `app.js`(Story EP3 CCTV 사망 문구의 "메리 정신병원" 2곳). Field는 `ep03-data.js`에 원문을 복제하지 않고 Story 창의 같은 텍스트를 읽는다(single source).
- 4) Field 인프라(하위 호환): `field/field-core.js` 로그 `tag`와 미션별 진행 중 스냅샷(`persist`/`snapshot`/`restore`, 1.5초 throttle + 행동 직후 + 연결 종료 시 저장, 사망·클리어 시 삭제), `field/field-save.js`의 선택적 `progress`(경계가 있는 plain JSON, EP03 전용, 진행 중에만 존재해 기존 `FieldSave.get()` 모양과 Save Code v5 호환 유지), `field/field-ui.js`의 "이어서 파견/처음부터". `field/field.css`는 `#f3-*` 선택자만 확장.
- 5) EP03 gameplay: Day 1~7 압축 루프(자세한 규칙은 `PROJECT_CONTEXT.md` EP03 섹션) — 인식표 3종(빨강 설사약·간호사·배탈 호소 / 노랑 마취제 부위·망치·낙상 테스트 / 파랑 빨간 알약), 차트·수술 일정(앞당김, 수술 후 +3일), 10만원권 6장, 회진 응답, 호출벨(응급 수술 상태), 21시 소등·바퀴 소리·눈 감기+규칙적 숨소리·간호사에게 1장, 비상 상황 A(자판기 1줄 3번째, 2장, 반출구, 침대 위 음료, 30분 전 복용, 복통, 장기 적출술, +3일), 비상 상황 B(1층 면회실, 녹색 종료 버튼, 정보 요구 거절, 신상 판별, 보고, 수술 예정일 전후 퇴원 불가), 클리어 → EP04 해금. 모든 실수를 즉사로 처리하지 않고 수술일 앞당김·신체 변이·응급 수술 상태·낙상 테스트 대상 등 상태 변화를 먼저 사용했다.
- 6) UI: HUD는 `DAY / 시각 / 장소`뿐, 시작 행동 5개, 나머지는 관찰·사건 후에만 노출(정답 버튼 없음, 내부 boolean/인식표 색/수술일/잔량 상시 표시 없음). 상태 탭은 "확인한 정보"만(확인 당시 값). 영상은 기존 ep3 영상을 용도별 재사용.
- 7) 변경 파일: `3화.txt`, `docs/transcripts/reviewed/EP03_…`, `docs/transcripts/README.md`, `index.html`, `story-data.js`, `app.js`, `field/field-core.js`, `field/field-save.js`, `field/field-ui.js`, `field/field.css`, `field/ep02/ep02-ui.js`(탭 전환 즉시 렌더 보정), `field/ep03/ep03-data.js`/`ep03.js`/`ep03-ui.js`(신규), `tests/ep03_browser_smoke.py`(신규), `tests/ep02_browser_smoke.py`(EP03이 파견 가능해진 기대값), `PROJECT_CONTEXT.md`, `CHANGELOG_AI.md`, `CLAUDE.md`.
- 8) 테스트: `tests/ep03_browser_smoke.py` — 문서 동기화(transcript 문장 전부 포함, 3화.txt = Story 창 = Field 탭, 금지 metadata, "야간, 어...", 단서 인용문), 해금/잠금, UI(스포일러·상태·시작 행동), 인식표 3종과 오용, 차트/회진/호출벨, 소등·야간 간호사·10만원권, 비상 상황 A·B 전체 분기, 진행도·Story 불변, 저장/복원(새로고침·사망 시 삭제·v5 내보내기), AUTHOR hook. 별도로 시간 점프 없이 세 인식표 모두 처음부터 구조까지 자동 플레이(게임 시간 약 667초)해 EP04 해금을 확인했다. 전체 7종 smoke test 통과.
- 9) 호환성: `yuyeon98.save.v1`/`yuyeon98.field.v1`/AUTHOR 키 의미와 Save Code v5 유지, Story/J/블루스크린/LOOP 02/finale와 연결 없음, EP01·EP02 회귀 없음.
- 10) 미해결/확인 필요(원문이 정하지 않아 추측하지 않은 부분): ① 파란 인식표가 알약을 올바르게 먹은 뒤의 결과(치사량 표기와 "복용하십시오" 지시가 함께 있어 "수칙대로 복용했다"만 기록하고 진행) ② 가짜 면회자의 구체적 요구/외형(최소 대사만, 외형·정체 없음), 틀린 정보형은 조정값 ③ 진짜를 돌려보낸 뒤의 재방문, 정보를 말한 뒤 보고하지 않았을 때의 결과(보호자의 지시를 따르기 전에 보고를 요구하도록만 구현) ④ 수술 예정일/전날의 보호자 도착 처리 외 일반 예정 수술의 결과(준비 없이 수술을 받으면 실패로 처리) ⑤ 낙상 테스트와 체위 변경의 정확한 시점·횟수 ⑥ 다른 환자의 호출벨(선택 요소, 구현 안 함) ⑦ Story의 EP03 CCTV 미니게임(`app.js` EP3)은 문서·표기만 맞췄고 로직은 재검수하지 않음.
- 다음 단계 추천: 직접 플레이해 시간·확률 조정, ①~⑥ 결정, Story EP02/EP03 CCTV 미니게임 재검수, EP04 reviewed transcript 확정 후 Field EP04, 수칙문서 공통 골격 동기화 테스트를 EP01에도 적용.

## 2026-10-05 — EP02 암전 객차 터널 조명 시간 연장

- 사용자 플레이 피드백: 암전 객차의 터널 조명(전등 깜빡임)이 너무 빨라 장면을 읽고 수색하기 어렵다. `field/ep02/ep02-data.js`의 tuning만 조정: 조명 지속 `flashVisible` 1.4초 → **3.2초**, 간격 `flashMin/flashMax` 2~4초 → **3~6초**. 규칙(조명이 비추는 순간에만 수색, 암흑·정차 중 움직임 금지)과 로직은 변경 없음.
- 검증: `tests/ep02_browser_smoke.py`, `field_browser_smoke.py`, `darkweb_ui_smoke.py` 통과. 체감 속도는 직접 플레이로 확인 필요(추가 조정은 같은 값만 바꾸면 된다).

## 2026-10-05 — EP02 「서울 심야 2호선」 전면 재검수 / 수정

- 배경/지시: 사용자가 EP02를 전면 재검수하도록 요청. 문제: reviewed transcript의 교정 미반영, `2화.txt`가 EP01과 다른 요약본이며 근거 없는 내용 포함, C-1/C-2 미구현, 수칙을 해석하는 구조가 아니라 상태 토글/공략 버튼 UI, 문서·Field 데이터·UI·로직 불일치. canon 순서: **transcript → 수칙문서(2화.txt) → Story/Field 데이터 → gameplay → UI → 테스트**.
- 1) reviewed transcript(`docs/transcripts/reviewed/EP02_서울_심야_2호선.txt`): 사용자 제공 `D:YUYEONwindows98	ext_original_etcEP02_서울_심야_2호선_reviewed.txt`로 교체. 확정 교정 12건(심야 승객, 생환자 및 이탈 실패자·사망자의 유해, 절단·압착·원인 불명의 실종, 조명과 조명 사이 구간, 봉합, 얇은 것의 진입, 오른손 전두엽 원문 보존, 다음 칸, 천장까지, 객차 진입 통로 등)과 STT 정리(객체→객차, 신설동력→신설동역 등)가 모두 반영돼 있음을 확인했다. 05:31은 `신설동행이라고 말한 승객은 [문장 일부 삭제] 사례가 확인되었습니다.`로 보존(의도된 삭제, 안전 규칙 아님). `docs/transcripts/README.md`에 갱신 기록.
- 2) `2화.txt` 전면 재작성: EP01과 같은 골격(`[기관]` / 문서 번호·개정 → `[0] 개요 / 현황` → `[1] 기본 수칙` → `[2] 확인된 비정상 상황 및 대응 지침`(상황 A/B/C/C-1/C-2/D) → `[!] 최종 경고`)으로 transcript 문장을 보존해 재구성. 현황 보고 항목(CCTV 감시 체계, 회수반, C급 응급 의료, 유가족 통보, 문서 번호 순환관리-2021-014호, 2024년 3차 개정, 증언·현장 기록 취합, 본부 면책, 작성 및 갱신 특별재난관리본부)을 모두 포함. **제거한 근거 없는 설정**: `서울교통공사`, `시행 일자: 2024-03-15`, `부착 위치: 신설동행 열차 편입 승객 전용 객차 내측`, `외부 게시 불가·편입 승객 외 열람 금지`, 문서 번호 `-0145`(→ `-014호`), 요약으로 빠졌던 C-1/C-2·발작·빨간 알약·얇은 것·먹이 상태 설명.
- 3) 연관 파일 동기화(한 파일만 고치지 않음): `index.html`의 Story EP02 문서 창 텍스트(= `2화.txt`), `story-data.js`의 `EPISODE_DOCS[2]`와 단서 인용문(변경 없이 유효 확인), Field 수칙 문서는 `ep02-data.js`의 복제 원문을 삭제하고 Story 창의 같은 텍스트를 읽도록(`reportSelector`) 변경 — **single source**.
- 4) Field gameplay 변경: 사건별 상태 토글/정답 노출 구조를 상황형 행동으로 교체. 객차 방문 전에는 내용을 알 수 없고(스트립은 번호만) 장면은 관찰 문구 + 기존 EP02 영상 재사용. **C-1 구현**: 수색 중 발작(접촉 시 확률 상승, 접촉 없이도 발생) 또는 특수 카드 위치(검은 정장 가슴 주머니/노숙자 배 위/유모차 한가운데/눈이 합쳐진 먹이) → 10초 안에 빨간 알약(`C_THIN_ENTRY`, 상황이 아닐 때 `C1_PILL_MISUSE`). **C-2 구현**: 광대 가면 남성 조우 시 `오른손 전두엽의 일부 그리고 빨간 알약` 지불로 카드 확보, 이후 얇은 것 미등장, 선택·확률 분기(강제 아님). 암전 객차의 분기(기본/C-1 특수/C-2)는 첫 진입 시 난수 `mode`로 결정하고 `FieldEP02Data.random(name)` 주입으로 결정적 테스트.
- 5) UI 변경(전/후): 전: 상시 상태 칩(신발·웅크림·눈·카드·기름·취객 거리), 상시 버튼(신발 벗기/웅크리기/눈 감기/휴대폰 라이트), 객차 제목 노출("6번 객차 / 통로에 드러누운 취객" 등), 디버그식 상태 탭. 후: 상시 HUD는 `N번 객차 / 다음(현재) 역 / 열차 이동·정차`뿐, 상태 탭은 위치·열차·실제 소지품만, 기본 행동은 `앞쪽 객차로 이동·주변을 살핀다·소지품을 확인한다`이며 나머지는 상황에서만 노출. 수칙 문서 탭은 2화.txt 전체.
- 변경 파일: `docs/transcripts/reviewed/EP02_서울_심야_2호선.txt`, `docs/transcripts/README.md`, `2화.txt`, `index.html`(EP02 문서 창), `story-data.js`(문서 번호), `field/ep02/ep02-data.js`, `ep02.js`, `ep02-ui.js`, `field/field.css`, `tests/ep02_browser_smoke.py`, `PROJECT_CONTEXT.md`(수칙문서 공통 형식·동기화 규칙·UI 스포일러 금지·EP02 개정), `CHANGELOG_AI.md`.
- 테스트: `tests/ep02_browser_smoke.py` 전면 확장 — 문서 동기화(transcript 문장이 2화.txt에 모두 존재, 2화.txt = Story 창 = Field 탭, 확정 교정/STT 정리, 금지 metadata 부재, 단서 인용문), UI(상시 칩/미래 객차 스포일러/상황형 버튼), 정차·주행 이동, 취객 신발·추적, 여자아이(노선도 지목, 말하기 실패, 가위바위보 보-보-바위-보, 승리 시 부모 확률 상승), 존재하지 않는 역, 암전 객차(광원·정차·암흑 수색·4개 후보), C-1(발작·접촉 없는 발작·특수 위치·알약 정상/오용/시간 초과), C-2(지불·얇은 것 미등장·선택 분기), D(탈의·기름·밀치기), 기관실·용두 탈출 성공/실패 3종, EP03 해금, Story 저장 불변, 저장/새로고침, AUTHOR hook, 개발 모드. 기존 5종 smoke test 전부 통과. 가속 시계(`FieldCore.step`)와 주입 난수 검증이며 12분 전체 수동 플레이는 하지 않았다.
- 호환성: `yuyeon98.save.v1`/`yuyeon98.field.v1`/AUTHOR 키와 Save Code v5 의미 불변, Story/J/블루스크린/LOOP 02/finale와 연결 없음, EP01 회귀 없음.
- 미해결/확인 필요: ① 올바른 알약 사용 이후의 결과는 transcript에 없어 "지시대로 섭취했다"만 기록하고 진행(EP05 Story의 생존 선택 처리와 같은 방향) — 사용자 결정 필요. ② 광대를 지불하지 않을 때의 결과는 없음(transcript 근거 없음). ③ 객차 수 7·사건 배치·모든 확률/시간 값·용답/신답 역명·추가 실패 코드 4종은 구현 선택. ④ Story의 EP02 CCTV 미니게임(`app.js` EP2)은 문서만 맞췄고 로직/문구는 재검수하지 않음(C-1/C-2 없음). ⑤ `movies/out/ep2_event_dark|engine|escape.mp4`는 미압축 원본이라 사용·배포하지 않음. ⑥ 이 작업은 사용자 지시에 따라 commit/push하지 않았다(개발 서버에만 반영).
- 다음 단계 추천: 직접 플레이해 시간/확률 조정, 알약 사용 후 결과와 광대 미지불 결과 결정, Story EP02 CCTV 미니게임 재검수, EP01·EP03 수칙문서도 같은 공통 골격/동기화 테스트로 점검.

## 2026-10-05 — 개발 모드: localhost에서 모든 Field 에피소드 개방

- 목적: 테스트할 때 EP01을 매번 클리어하지 않아도 되도록 개발 환경에서는 모든 Field 에피소드를 파견 가능하게 한다. 사용자 요청.
- 구현: `field/field-save.js`의 `FieldSave.unlocked()`가 호스트가 `localhost`/`127.0.0.1`이고 URL에 `?devunlock=0`이 없을 때만 true를 반환한다(`FieldSave.devUnlock`). **표시/파견 가능 여부만 바꾸는 보기 전용 override**이며 저장된 해금·클리어 기록, Save Code, Story 저장에는 아무것도 쓰지 않는다. 배포(Vercel) 도메인에서는 동작하지 않는다. 개방 중에는 Field 목록 하단에 `[개발 모드]` 안내가 표시된다. 아직 구현되지 않은 에피소드(EP03~)는 해금되어도 "연결 준비 중"으로 비활성이다.
- 실제 잠금 검증: `?devunlock=0`을 붙이면 원래 잠금 규칙으로 동작한다. 기존 smoke test 5종과 `ep02_browser_smoke.py`는 `/?devunlock=0`으로 접속하도록 수정했다.
- 변경 파일: `field/field-save.js`, `field/field-ui.js`(안내 문구), `tests/*.py`(접속 주소), `tests/ep02_browser_smoke.py`(개발 모드 검증 추가), `CLAUDE.md`.
- 검증: 6종 smoke test 모두 통과(개발 모드에서 EP02 파견 가능·EP05 준비 중·저장된 `unlocked`가 `["EP01"]` 그대로임을 포함).

## 2026-10-05 — EP02 Field Game (서울 심야 2호선) 구현

- 목적/근거: 사용자 요청 "EP02 Field Game 구현". canonical 근거는 `docs/transcripts/reviewed/EP02_서울_심야_2호선.txt`(REVIEWED) 한 가지이며 문서 번호 순환관리-2021-014호. EP01 구조를 복사하지 않고 **이동/정차/은신/탐색** 중심의 별도 상태 머신으로 구현했다.
- 새 파일: `field/ep02/ep02-data.js`, `field/ep02/ep02.js`, `field/ep02/ep02-ui.js`, `tests/ep02_browser_smoke.py`.
- 공용 코드(하위 호환): `field/field-core.js` — `manualClock`(06:00 자동 클리어 없음), `startLog`, `win(message, record)`, `die(reason, code)`, 로그 `t`(경과초), 미션별 `release`(토글형 조작은 포커스 이탈로 풀리지 않음), AUTHOR hook(`FieldCore.hooks.add`, `majorEvent`). `field/field-ui.js` — 미션 전용 뷰(`mission.ui`)·로그 스탬프·클리어 문구를 미션 데이터에서 받도록 분리(EP01 문구는 `ep01-data.js`의 `clearText`로 이동). `field/field.css` — 객차 스트립/칩/암전·플래시 장면 스타일(기존 Field 클래스 재사용). `index.html` — script 3줄.
- 구현한 메커닉: 열차 시간표(주행/정차/존재하지 않는 역), 정차 중 연결문 잠금, 취객 추적(거리 게이지), 여자아이(시선 거두기·노선도 가리키기·가위바위보 보-보-바위-보·울음/부모 위험), 존재하지 않는 역 웅크리기+눈 감기 18초(원문 3분 압축), 암전 객차 터널 플래시 수색(4개 후보 중 무작위 카드), 탈의+기름+밀치기, 기관실·현실 재인식 버튼·용두역 창문 탈출. 실패 코드: A_DRUNK_CAUGHT, B_DESTINATION_ANSWER, B_WRONG_RPS, VOID_STATION_MOVE/OPEN_EYES, C_ARTIFICIAL_LIGHT/MOVE_WHILE_STOPPED/WRONG_SEARCH, D_NO_OIL/NO_UNDRESS, FINAL_WRONG_STATION/NO_RECOGNITION/TOO_LATE. A_DRUNK_WAKE는 사망이 아니라 추격 시작 이벤트다.
- 이렇게 구현한 이유: EP01은 06:00까지 타이머로 사건이 오지만, EP02는 "지금 열차가 달리는가/서 있는가"가 행동 가능 여부를 결정하므로 시계 대신 시간표 상태 머신을 사용했다. 원문 안내는 수칙 문서에 그대로 노출하고 게임은 그 규칙대로 반응하게 했다.
- 진행도/호환: EP01 clear → EP02 해금, EP02 clear → EP03 해금(Field 내부만). `FieldSave`/`yuyeon98.field.v1`/Save Code v5 구조는 변경 없이 재사용. Story/J/블루스크린/LOOP 02/`eps`·`finaleSeen`·`jayUnlocked` 의미와 `yuyeon98.save.v1`은 변경하지 않았다(테스트에서 Story 저장 바이트 동일 확인). 카탈로그에서 EP02 버튼이 "연결 준비 중"에서 "파견 가능"으로 바뀌어 `tests/field_browser_smoke.py`의 해당 기대값만 수정했다.
- canon 밖의 구현 선택(조정값): 객차 7개와 사건 배치(6=취객, 5=여자아이, 3=암전, 2=기름 통로, 1=승객), 모든 시간/확률 값, 부모 조우·존재하지 않는 역 무응답 실패 코드, 취객 추적의 일시 정지 규칙, 정차 역 이름(용답·신답은 실제 성수지선 역명이며 원문에 없음), 존재하지 않는 역명은 `■■■`. 모두 `ep02-data.js`의 `tuning/schedule`에 모여 있어 조정이 쉽다.
- 미확정/TODO: **C-1(발작·빨간 알약)**, **C-2(광대 가면 거래)** 는 전사 표현이 불완전해 구현하지 않았다(수칙 문서에는 원문 노출). 원문 "좌석과 손잡이 1000장까지"는 STT 의심으로 장면 문구에 쓰지 않았다. 객차 수/사건 배치와 EP02 Story 원고·문서의 Canonical Sync도 미진행. 영상/음향은 추가하지 않았다(텍스트 장면).
- 검증: `tests/ep02_browser_smoke.py` 20개 항목(해금/잠금, 정차 이동 차단/주행 이동, 취객 추적·사망·신발, 여자아이 답변/지목/가위바위보/울음, 존재하지 않는 역 성공·3종 실패, 암전 객차 광원·정차·암흑 수색·카드, 탈의+기름, 용두 탈출 성공·3종 실패, EP03 해금, Story 불변, 새로고침 복원, AUTHOR hook 무영향) 통과. 기존 5종 smoke test 전부 통과. 가속 시계(`FieldCore.step`)와 고정 난수로 검증한 것이며 12분 전체 수동 플레이/영상 재생은 확인하지 않았다.
- 다음 작업 추천: (1) 사용자가 직접 EP02를 플레이해 시간값(주행/정차 길이, 추격 속도, 재인식 12초)을 조정, (2) C-1/C-2 전사 재검수 후 메커닉 결정, (3) EP02 Story 원고/문서 Canonical Sync, (4) EP03 reviewed transcript 확정 후 Field EP03.

## 2026-10-05 — Darkweb UI 일관화 + 현장 관측 시스템을 Darkweb 스타일로 통일

- 목적: Darkweb 전반의 글꼴 크기/굵기/버튼 간 불일치를 정리하고, 실제 게임인 `현장 관측 시스템.exe`를 Darkweb(CCTV/사건수사노트) 창과 같은 시각 언어로 맞춘다. 게임 로직은 변경하지 않았다.
- 기준값(실측): 창 `#1a1a1a` + 2px bevel(#555/#000), 제목줄 `#333`/빨강 `#f00` 12px bold/하단 2px #555, 내용 `#050505`, 패널 `#111`+1px #333, 로그 `#000` 11px/1.4 초록, 버튼 `#111`/빨강 텍스트/1px 빨강 테두리/monospace 11px/padding 4px 12px, 탭 11px bold(활성: 빨강 배경 검정 글자), 보조 텍스트 `#888`.
- Field(`field/field.css` 전면 교체): 회색/올리브 베벨 테마와 16px 제목을 위 기준값으로 교체했다. 제목줄 빨강 `#f00`, 닫기 버튼 Darkweb `.win-btn`과 동일, HUD/카메라/로그/인벤토리 패널을 CCTV 창 구성(스캔라인·녹화 점·초록 피드 라벨)에 맞췄다. 창 위치를 아이콘 열 오른쪽(left 140px)으로 이동해 아이콘이 가려지지 않게 했다.
- `field/field-ui.js`: 탭에 `aria-pressed`로 활성 상태를 표시(활성 탭 빨강). 영상 재생 실패 콜백의 null 참조(간헐 오류, 창이 닫힌 뒤 `field-scene` 접근)를 방지했다.
- Darkweb 정리: 바탕화면 아이콘 폭 92→104px(라벨이 확장자 중간에서 줄바꿈되던 문제), 탐색기 파일 아이콘 폭 90→110px, 현장 관측 시스템/제작자에게.txt 아이콘을 다른 아이콘과 같은 크기·필터·굵기·그림자로 통일, `연결 종료.exe` 라벨 굵기 통일(회색은 종료 표시로 유지), 터미널/메신저/노트 버튼 padding을 `4px 12px`로 통일.
- 변경 파일: `field/field.css`, `field/field-ui.js`, `field/field-author.js`(아이콘 스타일만), `index.html`(아이콘/버튼 스타일만), `notebook.js`(버튼 padding), `styles.css`.
- 검증: 5종 브라우저 smoke test 전부 통과(제목줄·닫기 버튼 메트릭이 노트와 동일함을 포함). 변경 전후 스크린샷을 비교했다. 영상 재생·실제 플레이는 확인하지 않았다.
- 미해결: `요원_제이의_기록.txt`·`신규_근무자` 창의 제목줄이 흰색으로 다른 창과 다르지만 의도된 특수 창으로 보여 변경하지 않았다. 기밀터미널/메신저의 본문 색(메신저 `#ff5555`)도 의도된 구분으로 보고 유지했다.

## 2026-10-05 — Vercel 배포 스토리지 정리 및 "최신 배포만 보관" 규칙

- 목적: Vercel Hobby의 Deployment Storage가 10.26GB를 차지해 무료 한도를 초과한 문제를 해소하고, 이후 배포에서도 최신 버전만 유지한다. 사용자 승인에 따라 `windows98` 구버전과 다른 4개 프로젝트의 구버전을 정리했다.
- 정리: `windows98` 구배포 3개(395e65e, bb0b94c, cf76097)와 `yuyeononly`·`yuyeon-special`·`yuyeon`·`output` 각 2개를 삭제했다. 총 11개. 각 프로젝트는 최신 Ready 프로덕션 1개만 남았고 5개 사이트 모두 200 응답을 확인했다. 정확한 감소량은 CLI로 조회할 수 없어 대시보드 확인이 필요하다.
- 규칙: `windows98`은 push 후 Ready가 되면 최신 프로덕션 배포만 남기고 이전 배포를 삭제한다. 신규 `tools/vercel-prune.js`(기본 dry run, `--yes`로 삭제)를 사용하며 `windows98` 프로젝트에만 동작한다. 다른 프로젝트 배포는 사용자 승인 없이 삭제하지 않는다. `CLAUDE.md`에 절차를 기록했다.
- 변경 파일: `tools/vercel-prune.js` 신규, `.vercelignore`(`tools/` 제외 추가), `CLAUDE.md`, `CHANGELOG_AI.md`. 게임 코드/영상/Save는 변경하지 않았다.
- 검증: 스크립트 dry run으로 최신 배포 1개를 keep, 삭제 대상 없음으로 확인. 삭제 실행은 이번 push의 배포 완료 후 수행한다.
- 미해결: 남은 4개 프로젝트의 최신 배포에 대용량 영상이 있으면 스토리지를 계속 차지할 수 있다(사용자 판단 대기).

## 2026-10-05 — Vercel 무료 한도 대응: 영상 용량 축소

- 목적: Vercel(Hobby) 무료 한도를 넘는 전송량/배포 용량을 줄인다. 사용자 보고: 프로덕션 `windows98-yuyeon.vercel.app` 사용량이 10GB를 넘음. 프로젝트 `test11-6dcd/windows98`, 최신 배포는 Ready로 정상이며 도메인/배포 자체 문제는 아니었다. 저장소의 `homepage`에 적힌 `windows98-mocha.vercel.app`은 연결이 끊긴 옛 주소다.
- 원인 분석: 저장소 미디어 약 700MB 중 mp4가 636MB(1080p, 9~17Mbps, 오디오 320kbps). 영상은 재생 시 스트리밍되므로 한 번의 플레이스루가 수백 MB를 전송한다. 코드는 영상을 미리 로드하지 않는다(preload 없음).
- 조치: `*.mp4` 49개(`movies/out/` 제외)를 H.264 main/CRF 28, 최대 1280px 폭, 30fps 상한, AAC 80kbps, faststart로 재인코딩해 **같은 파일명으로 교체**했다. 636MB → 47MB(약 13배 감소). 코드 수정은 없다. 원본은 git 이력(`cf76097` 이전 커밋)에 보존된다.
- `vercel.json`: mp4/png/jpg에 `Cache-Control: public, max-age=86400` 라우트를 추가했다(재방문 시 재전송 감소). 기존 builds/라우트는 보존.
- `.vercelignore` 신규: `*.psd`, `movies/out/`, `docs/`, `tests/`, 작업 문서(`CHANGELOG_AI.md`, `PROJECT_CONTEXT.md`, `CLAUDE.md`)를 배포에서 제외. `movies/out/`의 3개 파일은 코드에서 참조되지 않는다(삭제하지 않고 이력/저장소에 유지).
- 검증: 인코딩본 49개 전부 ffmpeg 전체 디코드 오류 0. 대표 프레임(ep8_event_slide, ep10_event_head) 원본/신규 육안 비교에서 차이 없음. 5종 브라우저 smoke test 모두 통과(Windows, Playwright Chromium; 이 Chromium은 H.264를 재생하지 못해 실제 영상 재생 확인은 아님). `vercel.json` JSON 유효성 확인.
- 보존: 파일명/경로, Story/Field/Save/AUTHOR 코드와 원고는 변경하지 않았다. 영상 길이는 원본과 최대 0.02초 차이다.
- 미해결: 배포 후 프로덕션에서 영상 재생을 직접 확인하지 못했다. 정확히 어떤 지표(대역폭/배포 크기)가 한도를 넘었는지 Hobby 플랜은 CLI 사용량 조회를 제공하지 않아 대시보드 확인이 필요하다. 그래도 부족하면 영상 호스팅을 Cloudflare R2 등으로 분리하는 방안이 있다.
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
