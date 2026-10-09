"""EP06 (청림고등학교 2학년 3반 17번 / homeroom routine) Field browser smoke test. Requires Python Playwright and Chromium plus the Express server:
    npm start   then   python tests/ep06_browser_smoke.py
Uses isolated browser storage and the production FieldCore.step clock (the wall clock FieldCore reads is frozen, so only step() advances time).
FieldEP06Data.random(name) is pinned: a string returned for call17 ('quiet'|'reply'|'A') or seat ('clean'|'smell'|'water') forces that branch.
No real save is read or changed.
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')
STORY_KEY = 'yuyeon98.save.v1'


def norm(text):
    return re.sub(r'[\s\-·\.\,:\[\]■※\(\)“”"]', '', text)


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                    headless=True, args=['--no-sandbox'])
        page = browser.new_context(viewport={'width': 1280, 'height': 900}).new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))

        def boot():
            page.goto(BASE + '/?devunlock=0', wait_until='load')
            page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")
            page.evaluate("window.__pn = performance.now(); performance.now = () => window.__pn")

        boot()

        def click(id): page.locator('#' + id).click()
        def has(id): return page.locator('#' + id).count() > 0
        def state(): return page.evaluate('FieldCore.get()')
        def data(): return state()['data']
        def log_text(): return page.locator('#field-log').inner_text()
        def action(name, value=None): page.evaluate('([n, v]) => FieldCore.action(n, v)', [name, value])
        def step(seconds): page.evaluate('(n) => { let left = n; while (left > 0 && FieldCore.get().status === "active") { FieldCore.step(Math.min(.5, left)); left -= .5; } }', seconds)
        def setd(**values): page.evaluate("(v) => Object.assign(FieldCore.get().data, v)", values)
        def labels(): return set(b.inner_text() for b in page.locator('#f6-actions button').all())
        def fresh(force=None):
            page.evaluate("""(force) => { window.__force = force || {};
                const defaults = { deskDirty: 0.99, b: 0.99, cOn: 0.99, eOn: 0.99, dOn: 0.99, call17: 'quiet', seat: 'clean', eIn: 0.5, eAt: 0.0, cSeat: 0.5, selfOpen: 0.99, dAt: 0.0 };
                FieldEP06Data.random = name => (name in window.__force ? window.__force[name] : defaults[name] !== undefined ? defaults[name] : 0.5);
                FieldUI.close(); FieldUI.open(); }""", force or {})
            click('field-dispatch-new-EP06' if has('field-dispatch-new-EP06') else 'field-dispatch-EP06')
            assert state()['status'] == 'active' and data()['phase'] == 'prep'
        def dead(code):
            s = state(); assert s['status'] == 'dead' and data()['failCode'] == code and s['reason'].startswith(code), (code, s['status'], data()['failCode'], s['reason'])
        def homeroom(**force):
            fresh(force); click('f6-start-homeroom'); assert data()['phase'] == 'homeroom'
        def call(n=1):
            for _ in range(n): click('f6-call')
        def to17(**force):
            homeroom(**force); call(2); assert data()['next'] == 17
        def finish_roll():
            """Attendance done (17 already handled)."""
            while data()['att'] != 'done': click('f6-call')
        def chalk_all():
            while data()['phase'] in ('class1', 'class2') and data()['lesson'] < data()['need']:
                click('f6-board'); step(5.2)
        def into_class1(**force):
            to17(**force); call(); click('f6-absent'); finish_roll(); click('f6-end-homeroom'); assert data()['phase'] == 'class1'
        def into_break(**force):
            into_class1(**force); chalk_all(); step(.5); assert data()['phase'] == 'break'
        def into_listening(**force):
            into_break(**force)
            if data()['cOn'] and data()['c'] != 'done':
                click('f6-podium'); click('f6-item-button'); click(f"f6-escort-{data()['cSeat']}")
            step(41); assert data()['phase'] == 'listening'
        def into_class2(**force):
            into_listening(**force); step(62)
            if data()['dAnom']:
                click('f6-spray'); click('f6-spray')
            else: step(5)
            step(.5); assert data()['phase'] == 'class2', data()['phase']
        def into_closing(**force):
            into_class2(**force); chalk_all(); step(.5); assert data()['phase'] == 'closing'

        story_before = page.evaluate(f"localStorage.getItem('{STORY_KEY}')")
        # --- 0. Rule document: one canon (transcript -> 6화.txt -> Story window -> Field panel) -----------------------------
        story_doc = page.evaluate("document.querySelector('#darkwebReportWindowEP6 textarea').value").replace('\r\n', '\n').strip()
        txt = (ROOT / '6화.txt').read_text(encoding='utf-8').replace('\r\n', '\n').strip()
        assert story_doc == txt, 'index.html Story window must equal 6화.txt'
        transcript = (ROOT / 'docs/transcripts/reviewed/EP06_청림고등학교_2학년_3반_17번.txt').read_text(encoding='utf-8-sig')
        body = '\n'.join(line for line in transcript.splitlines() if line.strip() and not re.match(r'^\d\d:\d\d$', line.strip()) and not line.startswith('[') and 'generated by AI' not in line)
        for marker in ['[0] 개요 / 현황', '[1] 기본 수칙', '[2] 확인된 비정상 상황 및 대응 지침', '■ 상황 A', '■ 상황 B', '■ 상황 C', '■ 상황 D', '■ 상황 E', '[!] 최종 경고', '문서 번호: 2021-05-20', '부착 위치: 청림고등학교 교무실. 2학년 3반 담임선생 전용 지정석', '2학년 3반 17번 박예림', '부산광역시 기장군 태양해안', '탑승객 26명', '13명만이', '“17번의 몫을 대신 바치겠습니다.”', '바닷물과 기장군 해안 일대의 해조류, 다량의 검은 머리카락', '가상 학생 박예림을 전산상 영구 배정', '교실 내 CCTV 배치 엄금', '방향제 SNS-0017', '특별재난관리본부 0050-0200', '“17번 박예림 결석”이라고 복창한 뒤', '고개를 옆으로 꺾은 채', '한쪽씩 번갈아 감으십시오', '현장 대응팀이 3분 안에 구조하도록', '보고 전, 단 한 번이라도 17번으로 다른 학생을 호명한 경우', '2학년 3반 맞은편에 위치한 격리실', '학생안전부', '“시험 중에는 잡담 금지”', '두 번씩 뿌려 주십시오', '그 의미가 달라집니다', '방과 후 조례 시간', '바닷물이나 젖은 해조류가 발견될 시 그 즉시 모든 학생을 내보낸 뒤']:
            assert marker in txt, marker
        for forbidden in ['학급관리-', '개정', '시행 일자', '교무행정실', '외부 게시 불가', '열람 금지', '책상 유리 하단', '소금기', '맨손', '판서를 이어', '학교 주소', '교장', '생년월일', '결번 처리 이후 첫 수학여행에서 버스가 내륙의 터널 구간에서 사고로']:
            assert forbidden not in txt, forbidden
        assert page.evaluate("EPISODE_DOCS[6]") == '2021-05-20' and page.evaluate("EPISODE_TITLES[6]") == '청림고등학교 2학년 3반 17번'
        assert page.evaluate("CLUES.filter(c => c.ep === 6).every(c => document.querySelector('#darkwebReportWindowEP6 textarea').value.includes(c.quote))")
        assert page.evaluate("MESSENGER_GENERIC.hq.filter(m => m.ep === 6).every(m => document.querySelector('#darkwebReportWindowEP6 textarea').value.includes(m.quote))")
        print('PASS 0 rule document: the manual keeps its game-critical phrases and every Story quote from 6화.txt; Story window == 6화.txt; "보고 전, 단 한 번이라도" kept; doc no. 2021-05-20; no unsourced metadata; clue quotes valid')

        # --- 1. Unlock ------------------------------------------------------------------------------------------------
        click('field-open')
        assert page.locator('#field-dispatch-EP06').is_disabled() and page.locator('#field-dispatch-EP06').inner_text() == '연결 제한'
        page.evaluate("for (const id of ['EP01', 'EP02', 'EP03', 'EP04']) FieldSave.clear(id, { patrols: {}, elapsed: 700, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP06').inner_text() == '연결 제한', 'EP06 stays locked until EP05 is cleared'
        page.evaluate("FieldSave.clear('EP05', { patrols: {}, elapsed: 300, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP06').inner_text() == '파견 가능' and not page.locator('#field-dispatch-EP06').is_disabled()
        assert page.locator('#field-dispatch-EP07').inner_text() == '연결 제한'
        print('PASS 1 EP06 locked until EP05 clear, then dispatchable; EP07 still locked')

        # --- 2. The room is the interface; no answers on screen -----------------------------------------------------------
        page.evaluate("""(() => { window.__hooks = []; const add = (kind, fn) => FieldCore.hooks.add(kind, fn);
            add('onEpisodeStart', id => window.__hooks.push(['onEpisodeStart', id]));
            add('onMajorEvent', (id, event) => window.__hooks.push(['onMajorEvent', id, event]));
            add('onEpisodeClear', id => window.__hooks.push(['onEpisodeClear', id])); })()""")
        fresh()
        assert page.locator('.field-hud > *').count() == 3 and '08:10 교실 준비' in page.locator('#f6-phase').inner_text()
        assert labels() == {'조회를 시작한다'}, labels()
        for obj in ['f6-board', 'f6-speaker', 'f6-clock', 'f6-door', 'f6-podium', 'f6-seat-15', 'f6-seat-16', 'f6-seat-17', 'f6-seat-18', 'f6-seat-19']:
            assert has(obj), obj
        visible = page.locator('#f6-room').inner_text() + page.locator('.field-hud').inner_text() + page.locator('#f6-actions').inner_text()
        for secret in ['A_', 'B_', 'PARK', 'ACTIVE', 'FOLLOWER', 'true', 'false', '결석', 'SNS', '격리', '현장 대응', '버튼', '보고', '박예림']:
            assert secret not in visible, secret
        assert not page.locator('#f6-card').is_visible(), 'the podium is closed until it is used'
        click('f6-podium'); assert page.locator('#f6-card').is_visible() and has('f6-item-sns') and has('f6-item-button') and has('f6-item-roll'); click('f6-card-close')
        print('PASS UI: HUD = schedule / place / progress; the room objects are the interface; no answer, anomaly name or flag on screen; the podium items are physical objects')

        # --- 3. Preparation: desk 17 -----------------------------------------------------------------------------------------
        fresh({'deskDirty': 0.1}); click('f6-seat-17')
        assert '먼지가 앉아 있다' in log_text() and has('f6-clean') and data()['deskDirty']
        click('f6-clean'); click('f6-seat-17'); assert '깨끗하게 정돈되어 있다' in log_text() and not has('f6-clean')
        fresh({'deskDirty': 0.99}); click('f6-seat-17'); assert '깨끗하게 정돈되어 있다' in log_text() and not has('f6-clean')
        fresh({'deskDirty': 0.1, 'seat': 'clean'}); step(0)
        click('f6-start-homeroom'); assert not has('f6-clean'), 'cleaning is offered only once the desk has been looked at'
        print('PASS desk 17: dust seen only when looked at; cleaning appears afterwards')

        # --- 4. Attendance ritual --------------------------------------------------------------------------------------------
        homeroom(); assert '17번  박예림' in page.locator('#f6-roll').inner_text(), 'the roll book opens at the start of the homeroom'
        click('f6-podium'); click('f6-item-roll'); assert '17번  박예림' in page.locator('#f6-roll').inner_text()
        click('f6-call'); click('f6-call'); assert '15번' in log_text() and '16번' in log_text()
        click('f6-call'); assert '[호명] 17번 박예림.' in log_text() and data()['att'] == 'await' and {'“17번 박예림 결석”이라고 복창하며 결석 처리한다', '17번 박예림 출석 처리한다'} <= labels()
        assert '아무 대답이 없다' in log_text()
        click('f6-absent'); assert data()['absent'] and '“17번 박예림 결석”이라고 복창했다' in log_text() and data()['next'] == 18 and state()['status'] == 'active'
        click('f6-call'); click('f6-call'); assert data()['att'] == 'done' and has('f6-end-homeroom')
        click('f6-end-homeroom'); assert data()['phase'] == 'class1'
        to17(call17='reply'); click('f6-call'); assert '“네.” 하는 소리가 들렸다' in log_text() and data()['att'] == 'await'
        click('f6-absent'); assert state()['status'] == 'active' and data()['absent'], 'an answer changes nothing: absent all the same'
        to17(call17='reply'); click('f6-call'); click('f6-seat-17'); dead('ATTEND_LOOKED_UP')
        to17(call17='reply'); click('f6-call'); click('f6-door'); dead('ATTEND_LOOKED_UP')
        to17(call17='quiet'); click('f6-call'); click('f6-present'); dead('ATTEND_PRESENT'); assert '젖은 채 흐느끼는 긴 머리의 여성' in state()['reason'] and '전자 기기 화면 앞에서 자취를 감춘' in state()['reason']
        to17(call17='quiet'); click('f6-call'); click('f6-call'); dead('ATTEND_SKIPPED')
        print('PASS attendance: 17번 = 박예림 called exactly; absent whether or not she answers; no looking up; marking present = canon failure; skipping the declaration fails')

        # --- 5. A: the whole class turns and stares -------------------------------------------------------------------------
        def start_A(**force):
            to17(call17='A', **force); click('f6-call')
            assert data()['a'] == 'active' and '고개를 옆으로 꺾은 채 응시한다' in log_text() and not has('f6-call') and not has('f6-absent')
        start_A(); step(5.5); assert state()['status'] == 'active'; step(1); dead('A_LOOKAWAY')      # never looked at desk 17
        start_A(); click('f6-board'); dead('A_LOOKAWAY')
        start_A(); click('f6-seat-17'); assert data()['aFocused'] and '17번 자리에 시선을 두었다' in log_text()
        click('f6-seat-18'); dead('A_LOOKAWAY')
        start_A(); click('f6-seat-17'); step(8.5); assert not has('f6-eye-left'); step(1); assert has('f6-eye-left') and has('f6-eye-right') and '눈이 시려 온다' in log_text()
        assert not any('양쪽' in l or '두 눈' in l for l in labels()), 'only one eye at a time is ever offered'
        click('f6-eye-left'); assert not has('f6-eye-left') and state()['status'] == 'active'
        step(9.2); assert has('f6-eye-right'); click('f6-eye-left'); dead('A_EYES')                  # the same eye twice
        start_A(); click('f6-seat-17'); step(9.2); click('f6-eye-left'); step(9.2); click('f6-eye-right'); step(9.2); click('f6-eye-left')
        assert state()['status'] == 'active' and data()['eye'] == 'L'
        start_A(); click('f6-seat-17'); step(9.2); step(5.5); dead('A_LOOKAWAY')                           # strain ignored: sight lost
        start_A(); click('f6-seat-17'); step(12.5); assert has('f6-answer') and '학생들이 말을 걸어온다' in log_text()
        click('f6-answer'); dead('A_ANSWERED')
        def a_advance(seconds):
            """Advance situation A while doing it right: close one eye at a time, alternating, whenever the eyes strain."""
            for _ in range(int(seconds)):
                step(1)
                if state()['status'] != 'active': return
                if has('f6-eye-left'): click('f6-eye-left' if data()['eye'] != 'L' else 'f6-eye-right')
            step(seconds - int(seconds))
        start_A(); click('f6-seat-17'); a_advance(20.5); assert has('f6-move') and '물이 차오르고 있다' in log_text(); click('f6-move'); dead('A_MOVED')
        start_A(); click('f6-seat-17'); w0 = page.locator('#f6-water').evaluate('e => e.style.height'); step(8); assert page.locator('#f6-water').evaluate('e => e.style.height') != w0, 'the water keeps rising'
        start_A(); click('f6-seat-17')
        for i in range(60):
            if data()['a'] != 'active' or state()['status'] != 'active': break
            step(1)
            if has('f6-eye-left'): click('f6-eye-left' if data()['eye'] != 'L' else 'f6-eye-right')
        assert state()['status'] == 'active' and data()['a'] == 'done' and '현장 대응팀이 도착했다' in log_text() and data()['att'] == 'await'
        click('f6-absent'); assert data()['absent'] and state()['status'] == 'active', 'after the rescue the roll still ends with the absent declaration'
        print('PASS A: everyone freezes toward the podium; the eyes stay on desk 17; eyes close one at a time alternately; no answering; no moving; the water rises; the team arrives (compressed 45 s)')

        # --- 6. B: 17 is assigned to a real student ---------------------------------------------------------------------------------
        homeroom(b=0.1); click('f6-podium'); click('f6-item-roll'); roll = page.locator('#f6-roll').inner_text()
        assert '17번  강○○' in roll and '박예림' not in roll
        call(2); assert data()['next'] == 17
        click('f6-podium'); click('f6-item-team'); assert data()['reported'] and '정정 처리가 완료되기 전까지 해당 학생을 다른 임시 번호로 부른다' in log_text()
        click('f6-call'); assert '임시 번호로 호명했다' in log_text() and data()['next'] == 18 and state()['status'] == 'active' and data()['iso'] == ''
        finish_roll(); assert data()['att'] == 'done'
        homeroom(b=0.1); call(2); click('f6-call')
        assert data()['iso'] == 'pending' and '17번 강○○' in log_text() and '17번으로 다른 학생을 호명했다' in log_text() and has('f6-go-iso') and not has('f6-call')
        step(19.5); assert state()['status'] == 'active'; step(1); dead('B_VANISHED'); assert '호명된 학생과 교사 모두 실종되었습니다' in state()['reason']
        homeroom(b=0.1); call(2); click('f6-call'); click('f6-go-iso'); assert data()['iso'] == 'inside' and '맞은편 격리실로 이동했다' in log_text() and page.locator('#f6-room.f6-iso').count() == 1
        step(12); assert '문 밖에서 무슨 소리가 들린다' in log_text(); step(20); assert '오랜 시간이 지난 것 같다' in log_text() and state()['status'] == 'active'
        click('f6-door'); dead('ISO_OPENED')
        homeroom(b=0.1); call(2); click('f6-call'); click('f6-go-iso'); step(49); assert data()['iso'] == 'inside' and state()['status'] == 'active'; step(2)
        assert data()['iso'] == 'done' and '정정 처리가 완료되었다는 통보' in log_text() and not page.locator('#f6-room.f6-iso').count()
        click('f6-call'); assert '임시 번호로 호명했다' in log_text() and data()['next'] == 18
        print('PASS B: a student on 17 is visible in the roll; report first, then call by a temporary number; calling 17 before reporting -> go to the isolation room at once (else both vanish); never open the door by yourself')

        # --- 7. Lessons and E: a voice outside the door ----------------------------------------------------------------------------
        E = {'eOn': 0.1, 'eIn': 0.1, 'eAt': 0.0}
        into_class1(**E)
        assert labels() == set() and page.locator('#f6-actions button').count() == 0, 'no buttons during a plain lesson: the board is the interface'
        click('f6-board'); assert data()['lesson'] == 1 and '판서를 이어간다' in log_text()
        click('f6-board'); assert data()['lesson'] == 1, 'writing has a pace'
        step(8.5); assert data()['e'] == 'active' and '열어 달라는 목소리가 들린다' in log_text() and page.locator('#f6-video').evaluate('v => v.src').endswith('ep6_event_door.mp4')
        click('f6-door'); dead('E_DOOR_OPENED'); assert '그 의미가 달라집니다' in state()['reason']
        into_class1(**E); step(8.5); step(12); assert '문을 두드리는 소리가 난다' in log_text() and '문손잡이가 움직인다' in log_text(); step(13); dead('ROUTINE_BROKEN')
        into_class1(**E, selfOpen=0.0); step(8.5)
        for _ in range(7):
            click('f6-board'); step(5.1)
            if data()['e'] != 'active': break
        step(30)
        assert state()['status'] == 'active' and data()['e'] == 'done' and '문이 저절로 열린다' in log_text(), 'her opening the door herself is not a failure'
        assert data()['phase'] in ('break', 'listening'), 'the lesson went on to its end'
        into_class1(**E, selfOpen=0.99); step(8.5); click('f6-board'); click('f6-seat-16'); click('f6-clock'); click('f6-speaker'); assert state()['status'] == 'active', 'other objects are harmless during E'
        print('PASS E: a voice asking to open the door; never open it (opening = changed meaning, record interrupted); keep teaching (stalling = routine broken); her own opening is not a failure')

        # --- 8. C: she follows a student ----------------------------------------------------------------------------------------------------
        C = {'cOn': 0.1, 'cSeat': 0.5}
        into_break(**C)
        assert data()['cSeat'] == 18 and not has('f6-escort-18')
        click('f6-seat-16'); assert '쉬는 시간을 보내고 있다' in log_text() and '발자국' not in log_text()
        click('f6-seat-18'); assert '젖은 발자국 같은 흔적' in log_text() and 'f6-escort-18' not in [b.get_attribute('id') for b in page.locator('#f6-actions button').all()]
        click('f6-podium'); click('f6-item-button'); assert data()['c'] == 'pressed' and '버튼을 눌렀다' in log_text()
        assert has('f6-escort-16') and has('f6-escort-18') and has('f6-escort-19')
        click('f6-escort-16'); dead('C_WRONG_STUDENT')
        into_break(**C); click('f6-podium'); click('f6-item-button'); click('f6-escort-18')
        assert data()['c'] == 'done' and '학생안전부로 직접 안내했다' in log_text() and state()['status'] == 'active'
        step(41); assert data()['phase'] == 'listening'
        into_break(**C); click('f6-podium'); click('f6-item-button'); step(41); dead('C_INCOMPLETE')          # pressed the button but left the student
        into_break(**C); step(41); dead('C_INCOMPLETE')
        into_break(cOn=0.99); click('f6-podium'); click('f6-item-button'); assert '아무 일도 일어나지 않는다' in log_text() and not has('f6-escort-18'); step(41)
        assert state()['status'] == 'active' and data()['phase'] == 'listening'
        print('PASS C: the following is only seen indirectly at the student; podium button then escort that student; button alone / wrong student / nothing = incomplete')

        # --- 9. D: the listening test -----------------------------------------------------------------------------------------------------------
        D = {'dOn': 0.1, 'dAt': 0.0}
        def to_lt(x): step(max(0, x - data()['ltT']))
        into_listening(**D)
        assert '영어 듣기 능력 평가가 시작되었다' in log_text() and 'f6-say' not in [b.get_attribute('id') for b in page.locator('#f6-actions button').all()]
        to_lt(9.5); assert not has('f6-say'); step(1)
        assert data()['d'] == 'noise' and '파도 소리, 물 떨어지는 소리, 노이즈' in log_text() and {'“시험 중에는 잡담 금지”라고 크게 말한다', '시험을 중단시킨다'} <= labels()
        click('f6-say'); assert data()['d'] == 'said' and '“시험 중에는 잡담 금지”라고 크게 말했다' in log_text() and '시험은 계속된다' in log_text() and state()['status'] == 'active'
        to_lt(59.5); assert not data()['ltEnd']; step(1); assert data()['ltEnd'] and '종료 방송이 나왔다' in log_text() and has('f6-spray')
        click('f6-spray'); assert data()['sprays'] == 1 and '(1회)' in log_text() and data()['phase'] == 'listening'
        click('f6-spray'); step(.5); assert data()['phase'] == 'class2' and state()['status'] == 'active'
        into_listening(**D); to_lt(11); click('f6-stop-exam'); dead('D_STOPPED')
        into_listening(**D); to_lt(11); click('f6-speaker'); dead('D_STOPPED')
        into_listening(**D); to_lt(29.5); assert state()['status'] == 'active' and data()['d'] == 'noise'; step(1); dead('D_NO_WARNING')
        into_listening(**D); to_lt(11); click('f6-say'); to_lt(60.5); assert data()['ltEnd']; step(23.5); assert state()['status'] == 'active'; step(2); dead('D_UNSPRAYED')
        into_listening(**D); to_lt(11); click('f6-say'); to_lt(61); click('f6-podium'); click('f6-item-sns'); click('f6-item-sns'); step(.5); assert data()['phase'] == 'class2', 'the podium spray counts as well'
        into_listening(dOn=0.99); to_lt(61); assert not has('f6-spray') and data()['phase'] == 'listening'; step(4); assert data()['phase'] == 'class2' and state()['status'] == 'active', 'a quiet test needs no spraying'
        print('PASS D: strange sounds in the listening test; say "시험 중에는 잡담 금지" aloud; never stop the exam or switch the speaker off; after the end broadcast spray SNS-0017 twice')

        # --- 10. Closing: desk 17 after school ------------------------------------------------------------------------------------------------
        into_closing(seat='smell'); assert '방과 후 조례 시간이다' in log_text() and labels() == {'조례를 마친다'}
        click('f6-end-closing'); dead('CLOSING_UNCHECKED')
        into_closing(seat='smell'); click('f6-seat-17'); assert '바다 냄새가 난다' in log_text() and not has('f6-dismiss'); click('f6-end-closing'); dead('CLOSING_UNRESOLVED')
        into_closing(seat='smell'); click('f6-seat-17'); click('f6-podium'); click('f6-item-sns'); click('f6-end-closing'); assert state()['status'] == 'cleared'
        into_closing(seat='water'); click('f6-seat-17'); assert '바닷물과 젖은 해조류가 발견된다' in log_text() and has('f6-dismiss') and page.locator('#f6-video').evaluate('v => v.src').endswith('ep6_event_dismiss.mp4')
        click('f6-podium'); click('f6-item-hq'); dead('CLOSING_ORDER')
        into_closing(seat='water'); click('f6-seat-17'); click('f6-end-closing'); dead('CLOSING_UNRESOLVED')
        into_closing(seat='water'); click('f6-seat-17'); click('f6-dismiss'); assert '모든 학생을 교실 밖으로 내보냈다' in log_text(); click('f6-end-closing'); dead('CLOSING_UNRESOLVED')
        into_closing(seat='water'); click('f6-seat-17'); click('f6-dismiss'); click('f6-podium'); click('f6-item-hq'); assert data()['called'] and '0050-0200' in log_text()
        click('f6-end-closing'); assert state()['status'] == 'cleared'
        into_closing(seat='clean', deskDirty=0.1); click('f6-seat-17'); assert '깨끗하게 정돈' not in log_text(); click('f6-end-closing'); dead('DESK_NEGLECTED')
        into_closing(seat='clean', deskDirty=0.1); click('f6-seat-17'); click('f6-clean'); click('f6-end-closing'); assert state()['status'] == 'cleared'
        print('PASS closing: sea smell -> SNS-0017; seawater or wet seaweed -> everyone out first, then 0050-0200; dust on desk 17 is a failure; everything else ends the day')

        # --- 11. Whole day with everything that can happen -------------------------------------------------------------------------------------
        fresh({'b': 0.99, 'call17': 'reply', 'eOn': 0.1, 'eIn': 0.9, 'eAt': 0.0, 'cOn': 0.1, 'cSeat': 0.9, 'dOn': 0.1, 'dAt': 0.5, 'seat': 'water', 'deskDirty': 0.1})
        click('f6-seat-17'); click('f6-clean'); click('f6-start-homeroom'); call(2); click('f6-call'); assert '“네.”' in log_text(); click('f6-absent'); finish_roll(); click('f6-end-homeroom')
        chalk_all(); step(.5)
        assert data()['phase'] == 'break'; click('f6-seat-19'); click('f6-podium'); click('f6-item-button'); click('f6-escort-19'); step(41)
        to_lt(21); click('f6-say'); to_lt(61); assert data()['ltEnd']; click('f6-spray'); click('f6-spray'); step(.5)
        assert data()['phase'] == 'class2'; step(8.5); assert data()['e'] == 'active'
        for _ in range(8):
            click('f6-board'); step(5.1)
            if data()['phase'] != 'class2': break
        assert data()['phase'] == 'closing', data()['phase']
        click('f6-seat-17'); click('f6-dismiss'); click('f6-podium'); click('f6-item-hq'); click('f6-end-closing')
        s = state(); assert s['status'] == 'cleared', (s['status'], s.get('reason'), data())
        assert page.evaluate("FieldSave.get().cleared.includes('EP06') && FieldSave.unlocked('EP07')") and page.evaluate("FieldSave.get().records.EP06.elapsed") > 0
        click('field-list'); assert page.locator('#field-dispatch-EP07').inner_text() == '파견 가능' and not page.locator('#field-dispatch-EP07').is_disabled()  # EP07 is implemented now
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before, 'Story save must be untouched'
        assert page.evaluate("!FieldSave.get().cleared.includes('EP07') && AuthorRoute.get().unlocked === false && !FieldSave.get().progress?.EP06")
        hooks = page.evaluate('window.__hooks')
        assert ['onEpisodeStart', 'EP06'] in hooks and ['onEpisodeClear', 'EP06'] in hooks and any(h[0] == 'onMajorEvent' and h[1] == 'EP06' for h in hooks) and all(len(h) <= 3 for h in hooks)
        print('PASS full day: prep -> roll -> A-free homeroom -> lesson + door voice -> break + escort -> listening test + sprays -> lesson -> closing -> EP07 unlock only in Field; Story save byte-identical; AUTHOR hooks (ids only)')

        # --- 12. Save: mid-run snapshot, v5 transport ---------------------------------------------------------------------------------------
        to17(call17='reply', b=0.99); click('f6-call'); click('f6-absent'); step(3)
        snap = {k: data()[k] for k in ['phase', 'att', 'next', 'absent', 'seat', 'deskDirty', 'cSeat']}
        page.evaluate("FieldCore.disconnect()")
        progress = page.evaluate("FieldSave.get().progress?.EP06")
        assert progress and progress['v'] == 1 and progress['phase'] == 'homeroom' and progress['absent'] is True
        page.reload(wait_until='load'); boot(); click('field-open')
        assert page.locator('#field-dispatch-EP06').inner_text() == '이어서 파견' and has('field-dispatch-new-EP06')
        click('field-dispatch-EP06')
        assert state()['status'] == 'active' and {k: data()[k] for k in snap} == snap and '[복원]' in log_text()
        click('f6-call'); assert data()['next'] == 19
        code = page.evaluate("GameSave.exportCode()"); story_code = page.evaluate("GameSave.exportStoryCode()")
        page.evaluate("FieldSave.reset()"); assert page.evaluate("!FieldSave.get().progress")
        assert page.evaluate("(c) => GameSave.importCode(c)", code)
        assert page.evaluate("FieldSave.get().progress?.EP06?.phase") == 'homeroom' and page.evaluate("FieldSave.get().cleared.includes('EP06')")
        assert page.evaluate("GameSave.exportStoryCode()") == story_code, 'v4 Story codec unchanged'
        page.evaluate("FieldSave.saveProgress('EP06', { v: 1, phase: 'bogus', att: 'x', next: 99, seat: 'lava', cSeat: 3 })")
        fresh(); assert data()['phase'] == 'prep', 'a corrupt snapshot is ignored'
        print('PASS save: phase/attendance/seat state restore after reload; v5 export carries it; corrupt snapshots ignored; v4 Story code unchanged')

        assert not errors, errors
        browser.close()
        print('ALL EP06 CHECKS PASSED')


if __name__ == '__main__':
    run()
