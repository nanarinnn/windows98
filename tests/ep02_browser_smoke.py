"""EP02 (train) Field browser smoke test. Requires Python Playwright and Chromium plus the Express server:
    npm start   then   python tests/ep02_browser_smoke.py
Uses isolated browser storage and the production FieldCore.step clock. FieldEP02Data.random(name) is pinned so
branches (wake / dark-car mode / seizure / card holder / parent) are deterministic. No real save is read or changed.
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')
STORY_KEY = 'yuyeon98.save.v1'


def norm(text):
    return re.sub(r'[\s\-·\.\,:\[\]■※\(\)]|가\.', '', text)


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                    headless=True, args=['--no-sandbox'])
        page = browser.new_context(viewport={'width': 1280, 'height': 900}).new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/?devunlock=0', wait_until='load')
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")

        def click(id): page.locator('#' + id).click()
        def has(id): return page.locator('#' + id).count() > 0
        def state(): return page.evaluate('FieldCore.get()')
        def data(): return state()['data']
        def log_text(): return page.locator('#field-log').inner_text()
        def buttons(): return [b.inner_text() for b in page.locator('#f2-actions button').all()]
        def button_ids(): return [b.get_attribute('id') for b in page.locator('#f2-actions button').all()]
        def to_seg(i):
            page.evaluate("(i) => { const s = FieldCore.get(); while (s.status === 'active' && s.data.sys.seg < i) FieldCore.step(0.5); }", i)
        def step(seconds): page.evaluate('(n) => { const s = FieldCore.get(); let left = n; while (left > 0 && s.status === "active") { FieldCore.step(Math.min(.5, left)); left -= .5; } }', seconds)
        def fresh(force=None):
            page.evaluate("(force) => { window.__force = force || {}; FieldEP02Data.random = name => (name in window.__force ? window.__force[name] : 0.5); FieldUI.close(); FieldUI.open(); }", force or {})
            click('field-dispatch-EP02')
            assert state()['status'] == 'active' and data()['carIndex'] == 7
        def force(**values): page.evaluate("(v) => Object.assign(window.__force, v)", values)
        def dead(code):
            s = state(); assert s['status'] == 'dead' and data()['failCode'] == code and s['reason'].startswith(code), (code, s['status'], data()['failCode'], s['reason'])
        def forward(): click('f2-forward')
        def to_girl(): forward(); click('f2-shoes'); forward(); assert data()['carIndex'] == 5
        def ask_girl(): to_girl(); forward(); assert data()['sys']['girl'] == 'asked' and data()['girlAsked']
        def to_dark(): to_girl(); click('f2-lookaway'); forward(); forward(); assert data()['carIndex'] == 3 and data()['darkCarEntered']
        def wait_flash():
            assert page.evaluate("() => { const s = FieldCore.get(); for (let i = 0; i < 120 && !s.data.sys.flash; i++) FieldCore.step(.25); return s.data.sys.flash; }")
        def find_card(card_id='kids'):
            wait_flash(); click(f'f2-search-{card_id}'); assert data()['engineCardFound']
        def to_car2(): to_dark(); find_card(); forward(); assert data()['carIndex'] == 2
        def to_engine():
            to_car2(); click('f2-undress'); click('f2-oil'); forward(); assert data()['carIndex'] == 1
            for _ in range(6): click('f2-push')
            click('f2-card'); assert data()['carIndex'] == 0 and data()['engineRoomEntered']
        def survive_void():
            to_seg(5); assert data()['voidStationActive']
            click('f2-crouch'); click('f2-eyes'); step(19)
            assert state()['status'] == 'active' and not data()['voidStationActive'] and state()['data']['sys']['seg'] == 6
            click('f2-eyes'); click('f2-crouch')
        def at_yongdu():
            to_engine(); survive_void(); to_seg(9)
            d = data(); assert d['currentStation'] == '용두' and not d['trainMoving'] and state()['status'] == 'active'

        story_before = page.evaluate(f"localStorage.getItem('{STORY_KEY}')")
        # --- 0. Rule document: one canon (transcript -> 2화.txt -> Story window -> Field tab) -------------------------------
        story_doc = page.evaluate("document.querySelector('#darkwebReportWindowEP2 textarea').value").replace('\r\n', '\n').strip()
        txt = (ROOT / '2화.txt').read_text(encoding='utf-8').replace('\r\n', '\n').strip()
        assert story_doc == txt, 'index.html Story window must equal 2화.txt'
        transcript = (ROOT / 'docs/transcripts/reviewed/EP02_서울_심야_2호선.txt').read_text(encoding='utf-8-sig')
        body = '\n'.join(line for line in transcript.splitlines() if line.strip() and not re.match(r'^\d\d:\d\d$', line.strip()) and not line.startswith('[') and 'generated by AI' not in line)
        missing = [c.strip() for c in re.split(r'\.\s|\n', body) if len(norm(c)) >= 8 and not c.strip().startswith('확인된 비정상 상황') and norm(c) not in norm(txt)]
        assert not missing, missing
        for marker in ['[0] 개요', '[1] 기본 수칙', '[2] 확인된 비정상 상황 및 대응 지침', '■ 상황 A', '■ 상황 B', '■ 상황 C:', '■ 상황 C-1', '■ 상황 C-2', '■ 상황 D', '[!] 최종 경고', '순환관리-2021-014호', '2024년 3차 개정', '[문장 일부 삭제]', '광대 가면', '빨간 알약']:
            assert marker in txt, marker
        for forbidden in ['0145', '서울교통공사', '시행 일자', '부착 위치', '외부 게시 불가', '1000장']:
            assert forbidden not in txt, forbidden
        assert page.evaluate("EPISODE_DOCS[2]") == '순환관리-2021-014호'
        assert page.evaluate("CLUES.filter(c => c.ep === 2).every(c => document.querySelector('#darkwebReportWindowEP2 textarea').value.includes(c.quote))")
        for fixed in ['심야 승객', '생환자 및 이탈 실패자, 사망자의 유해', '절단, 압착, 원인 불명의 실종', '조명과 조명 사이 구간', '봉합되어 있습니다', '얇은 것의 진입은 확정', '오른손 전두엽의 일부', '다음 칸으로 이동', '천장까지', '객차 진입 통로', '정규 운행', '노선도', '신설동역', '기관실', '역과 역 사이', '허공', '반팔', '수색', '즉발적', '조우', '소지하고', '귀환']:
            assert fixed in txt, fixed
        for stt in ['심리학', '정규 은행', '누손도', '신솔동', '귀관실', '객체', '허궁', '단팔', '직발적', '가멘', '주우', '수지하고', '붕합']:
            assert stt not in txt and stt not in transcript, stt
        print('PASS 0 rule document: transcript sentences all present in 2화.txt; Story window == 2화.txt; fixed STT/confirmed corrections; no unsourced metadata; clue quotes valid')

        # --- 1-2. Unlock ------------------------------------------------------------------------------------------------
        click('field-open')
        assert page.locator('#field-dispatch-EP02').is_disabled() and page.locator('#field-dispatch-EP02').inner_text() == '연결 제한'
        page.evaluate("FieldSave.clear('EP01', { patrols: {}, elapsed: 720, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP02').inner_text() == '파견 가능' and not page.locator('#field-dispatch-EP02').is_disabled()
        assert page.locator('#field-dispatch-EP03').inner_text() == '연결 제한'
        fresh()
        print('PASS 1-2 EP02 locked until EP01 clear, then dispatchable')

        # --- UI: minimal HUD, no always-on state chips, no spoilers, situational buttons ------------------------------------
        hud = page.locator('.field-hud').inner_text()
        assert '7번 객차' in hud and '다음 역: 성수' in hud and '이동 중' in hud
        assert not has('f2-chips') and not has('f2-eyes') and not has('f2-crouch') and not has('f2-phone') and not has('f2-shoes') and not has('f2-pill')
        assert buttons() == ['앞쪽 객차로 이동', '주변을 살핀다', '소지품을 확인한다'], buttons()
        visible = page.locator('#f2-scene').inner_text() + page.locator('#f2-status').inner_text() + hud
        for secret in ['취객', '술', '여자아이', '가위바위보', '소등', '암전', '기름', '광대', '알약', '승객으로 가득', '신발', '웅크', '눈을 감']:
            assert secret not in visible, secret
        assert page.locator('#f2-status').inner_text().count('\n') == 2 and '확인한 것 없음' in page.locator('#f2-status').inner_text()
        for n in range(0, 8): assert re.fullmatch(r'\d|기관실', page.locator(f'#f2-car-{n}').inner_text())
        click('f2-look'); assert '비정상 개체' in log_text()
        forward(); assert '6번 객차' in page.locator('.field-hud').inner_text() and '술 냄새' in page.locator('#f2-scene').inner_text()
        assert buttons() == ['조용히 지나간다', '조심스럽게 살핀다', '소지품을 확인한다', '신발을 벗는다'], buttons()
        print('PASS UI: HUD shows only car/station/train; no state chips or future-car labels; buttons appear only in situation')

        # --- 3-4. Stopped / running ------------------------------------------------------------------------------------
        fresh(); to_seg(1); assert not data()['trainMoving'] and data()['currentStation'] == '성수'
        forward(); assert data()['carIndex'] == 7 and '[정차 중] 연결문 잠금 유지' in log_text() and '정차 중' in page.locator('.field-hud').inner_text()
        to_seg(2); assert data()['trainMoving']; forward(); assert data()['carIndex'] == 6
        print('PASS 3-4 stopped door lock message only; running allows car movement')

        # --- 5-6. Drunk ------------------------------------------------------------------------------------------------
        fresh(); forward(); forward(); d = data()
        assert d['drunkAwake'] and d['drunkTracking'] and d['carIndex'] == 5 and d['sys']['drunkGap'] == 7 and state()['status'] == 'active'
        step(70); dead('A_DRUNK_CAUGHT')
        fresh(); forward(); click('f2-shoes'); forward(); assert not data()['drunkAwake'] and data()['carIndex'] == 5
        print('PASS 5-6 shoes-on pass wakes the drunk into a slow chase (not instant death); caught = A_DRUNK_CAUGHT; shoes off stays asleep')

        # --- 7-9. Girl -------------------------------------------------------------------------------------------------
        fresh(); ask_girl(); assert {'노선도를 가리킨다', '대답한다'} <= set(buttons()); click('f2-speak'); dead('B_DESTINATION_ANSWER')
        fresh(); ask_girl(); click('f2-stepback'); assert data()['sys']['girl'] == 'asked'
        click('f2-map'); assert '노선도' in log_text()
        click('f2-point'); assert data()['sys']['girl'] == 'rps' and state()['status'] == 'active' and 'f2-speak' not in button_ids()
        for hand in ['paper', 'paper', 'rock', 'paper']: click(f'f2-rps-{hand}')
        d = data(); assert d['sys']['girl'] == 'done' and not d['girlCrying'] and d['parentRisk'] == 0
        forward(); assert data()['carIndex'] == 4
        fresh(); ask_girl(); click('f2-point'); click('f2-rps-paper'); click('f2-rps-rock'); dead('B_WRONG_RPS')
        fresh(); ask_girl(); click('f2-point'); click('f2-rps-scissors')
        d = data(); assert d['girlCrying'] and d['parentRisk'] == 1 and state()['status'] == 'active'
        force(parent=0.99); forward(); assert state()['status'] == 'active' and data()['carIndex'] == 4   # probability, not certainty
        fresh(); ask_girl(); click('f2-point'); click('f2-rps-scissors'); force(parent=0); forward(); dead('B_PARENT_ENCOUNTER')
        fresh(); to_girl(); click('f2-lookaway'); forward(); assert data()['carIndex'] == 4 and not data()['girlAsked']
        assert '[문장 일부 삭제]' in txt and not any('신설동' in b for b in buttons())
        print('PASS 7-9 no answer: point at the map; spoken answers (incl. the deleted-sentence "신설동행") fail; RPS order; winning raises parent probability only')

        # --- 10-11. Void station ---------------------------------------------------------------------------------------
        fresh(); to_seg(5); assert data()['voidStationActive'] and data()['currentStation'] == '■■■'
        assert 'f2-crouch' in button_ids() and not has('f2-eyes')
        click('f2-crouch'); assert has('f2-eyes'); click('f2-eyes'); step(1)
        assert data()['sys']['voidHolding'] and data()['crouching'] and data()['eyesClosed']
        step(19); assert state()['status'] == 'active' and not data()['voidStationActive'] and data()['trainMoving']
        fresh(); to_seg(5); click('f2-crouch'); click('f2-eyes'); step(1); click('f2-eyes'); dead('VOID_STATION_OPEN_EYES')
        fresh(); to_seg(5); forward(); dead('VOID_STATION_MOVE')
        fresh(); to_seg(5); click('f2-crouch'); click('f2-eyes'); step(1); click('f2-crouch'); dead('VOID_STATION_MOVE')
        fresh(); to_seg(5); step(9); dead('VOID_STATION_NO_RESPONSE')
        print('PASS 10-11 void station: crouch then close eyes for the compressed 3 minutes; opening eyes / moving / ignoring fail')

        # --- 12-14. Dark car basics ------------------------------------------------------------------------------------
        fresh(); to_dark(); assert '휴대폰 라이트를 켠다' in buttons(); click('f2-phone'); dead('C_ARTIFICIAL_LIGHT')
        fresh(); to_dark(); to_seg(1); assert not data()['trainMoving']; forward(); dead('C_MOVE_WHILE_STOPPED')
        fresh(); to_dark(); assert not data()['sys']['flash']; click('f2-grope'); dead('C_WRONG_SEARCH')
        fresh(); to_dark(); forward(); assert data()['carIndex'] == 3 and '수색을 요한다' in log_text()
        wait_flash()
        base_ids = [i for i in button_ids() if i.startswith('f2-search-')]
        assert base_ids == ['f2-search-blueCheck', 'f2-search-whiteBag', 'f2-search-kids', 'f2-search-cap'], base_ids
        click('f2-search-kids'); assert data()['engineCardFound'] and state()['status'] == 'active'
        forward(); assert data()['carIndex'] == 2
        print('PASS 12-14 dark car: light / stopped move / groping in darkness fail; the 4 document holders are searched only in tunnel light')

        # --- C-1: seizure, special card positions, red pill ------------------------------------------------------------
        fresh({'seizureSearch': 0.01}); to_dark(); wait_flash(); click('f2-search-blueCheck')
        d = data(); assert d['c1Active'] and not d['engineCardFound'] and has('f2-pill') and '[발작]' in log_text()
        click('f2-pill'); d = data(); assert state()['status'] == 'active' and not d['c1Active'] and d['pillTaken'] and not d['hasPill'] and not has('f2-pill')
        wait_flash(); click('f2-search-kids'); assert data()['engineCardFound']
        fresh({'seizureSearch': 0.01}); to_dark(); wait_flash(); click('f2-search-blueCheck'); assert data()['c1Active']; step(11); dead('C_THIN_ENTRY')
        fresh({'seizureIdle': 0.001}); to_dark(); wait_flash(); assert data()['c1Active'] and has('f2-pill') and not data()['sys']['searched']   # no contact needed
        step(11); dead('C_THIN_ENTRY')
        fresh({'mode': 0.3}); to_dark(); wait_flash()
        ids = [i for i in button_ids() if i.startswith('f2-search-')]
        assert {'f2-search-blackSuit', 'f2-search-homeless', 'f2-search-stroller', 'f2-search-oneEye'} <= set(ids) and len(ids) == 8, ids
        click('f2-search-stroller'); d = data(); assert d['engineCardFound'] and d['c1Active'] and has('f2-pill') and '유모차' in log_text()
        click('f2-pill'); assert state()['status'] == 'active' and data()['pillTaken'] and not data()['c1Active']
        forward(); assert data()['carIndex'] == 2
        fresh({'mode': 0.3}); to_dark(); wait_flash(); click('f2-search-stroller'); step(11); dead('C_THIN_ENTRY')
        fresh(); to_dark(); assert not has('f2-pill'); click('f2-inventory'); assert has('f2-pill') and '빨간 알약' in log_text()
        click('f2-pill'); dead('C1_PILL_MISUSE')
        fresh(); forward(); click('f2-inventory'); assert not has('f2-pill')
        print('PASS C-1: seizure (with or without contact) and special card positions require the red pill at once; wrong use fails; pill is never an always-on button')

        # --- C-2: clown encounter --------------------------------------------------------------------------------------
        fresh({'mode': 0.1, 'thin': 0}); to_dark(); wait_flash()
        assert '광대 가면' in log_text() and has('f2-pay') and not data()['engineCardFound']
        click('f2-pay'); d = data()
        assert d['engineCardFound'] and d['clownPaid'] and not d['hasPill'] and '오른손 전두엽 일부' in d['injuries'] and '오른손 전두엽의 일부 그리고 빨간 알약' in log_text()
        step(40); assert state()['status'] == 'active' and '가늘고 긴' not in log_text() and '[발작]' not in log_text()   # thin one never appears
        forward(); assert data()['carIndex'] == 2
        fresh({'thin': 0}); to_dark(); wait_flash(); assert not has('f2-pay') and '광대' not in page.locator('#f2-scene').inner_text()   # branch is not forced
        print('PASS C-2: clown branch pays right-hand frontal lobe + red pill for the card; no thin one afterwards; branch is optional')

        # --- 15. Crowd car ---------------------------------------------------------------------------------------------
        fresh(); to_car2(); assert {'옷을 벗는다', '진입 통로의 기름을 바른다'} <= set(buttons()); forward(); dead('D_NO_UNDRESS')
        fresh(); to_car2(); click('f2-undress'); forward(); dead('D_NO_OIL')
        fresh(); to_car2(); click('f2-oil'); assert not data()['oiled'] and '탈의한 뒤' in log_text()
        fresh(); to_engine(); assert data()['undressed'] and data()['oiled'] and not data()['realityButtonPressed']
        fresh(); page.evaluate("FieldCore.action('card')"); assert data()['carIndex'] == 7   # no card / no crowd: cannot enter the engine room
        print('PASS 15 crowd car in car 1: undress + oil both required; engine room only through the crowd with the card')

        # --- 16-17. Final escape ---------------------------------------------------------------------------------------
        fresh(); to_engine(); click('f2-window'); click('f2-jump'); dead('FINAL_WRONG_STATION')
        fresh(); to_engine(); click('f2-recognize'); dead('FINAL_WRONG_STATION')
        fresh(); at_yongdu(); click('f2-window'); click('f2-jump'); dead('FINAL_NO_RECOGNITION')
        fresh(); at_yongdu(); click('f2-recognize'); assert data()['realityButtonPressed']; step(13); dead('FINAL_TOO_LATE')
        fresh(); at_yongdu(); to_seg(10); step(41); dead('FINAL_TOO_LATE')
        page.evaluate('''() => { window.__hooks = []; const add = FieldCore.hooks.add;
            add('onEpisodeStart', id => window.__hooks.push('start:' + id)); add('onMajorEvent', (id, e) => window.__hooks.push(id + ':' + e));
            add('onEpisodeClear', id => window.__hooks.push('clear:' + id)); add('onMajorEvent', () => { throw new Error('hooks must never break play'); }); }''')
        fresh(); at_yongdu()
        click('f2-recognize'); click('f2-window'); click('f2-jump')
        s = state(); assert s['status'] == 'cleared' and data()['escaped'], s['status']
        seen = page.evaluate('window.__hooks')
        for event in ['start:EP02', 'clear:EP02', 'EP02:ENGINE_ROOM', 'EP02:C_CARD_FOUND', 'EP02:REALITY_BUTTON', 'EP02:VOID_STATION']: assert event in seen, (event, seen)
        print('PASS 16-17 wrong station / no recognition / too late fail; reality button then window at Yongdu clears; AUTHOR hooks fire (no content)')

        # --- 18-20. Progression, Story isolation and persistence -------------------------------------------------------
        assert page.evaluate("FieldSave.get().cleared.includes('EP02') && FieldSave.unlocked('EP03')")
        assert page.evaluate("FieldSave.get().records.EP02.elapsed") > 0
        click('field-list'); assert page.locator('#field-dispatch-EP03').inner_text() == '연결 준비 중' and page.locator('#field-dispatch-EP03').is_disabled()
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before, 'Story save must be untouched'
        assert page.evaluate("!FieldSave.get().cleared.includes('EP03') && AuthorRoute.get().unlocked === false")
        deaths = page.evaluate("FieldSave.get().deaths.EP02")
        assert deaths and deaths >= 20, deaths
        page.reload(wait_until='load')
        assert page.evaluate("FieldSave.get().cleared.includes('EP02') && FieldSave.unlocked('EP03') && FieldSave.get().deaths.EP02") == deaths
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before
        assert 'EP02' in page.evaluate('FieldSave.exportProgress().cleared.join()') and page.evaluate('GameSave.exportCode().length') > 0
        print('PASS 18-20 EP03 unlocks only in Field; Story save byte-identical; EP02 clear/deaths/EP03 unlock survive reload')

        # --- Dev unlock (localhost only) -------------------------------------------------------------------------------
        dev = browser.new_context().new_page(); dev.goto(BASE, wait_until='load')
        dev.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); FieldUI.open();")
        assert dev.evaluate('FieldSave.devUnlock') and dev.locator('#field-dispatch-EP02').inner_text() == '파견 가능'
        assert dev.locator('#field-dispatch-EP05').inner_text() == '연결 준비 중' and '[개발 모드]' in dev.locator('#field-content').inner_text()
        assert dev.evaluate("FieldSave.get().unlocked.join() === 'EP01' && FieldSave.exportProgress().unlocked.join() === 'EP01'")
        dev.locator('#field-dispatch-EP02').click(); assert dev.evaluate("FieldCore.get().id === 'EP02' && FieldCore.get().status === 'active'")
        dev.locator('#f2-tab-rules').click()
        assert dev.locator('#field-tools').inner_text().replace('\r', '').strip() == txt, 'Field rules tab must show the Story rule document verbatim'
        print('PASS dev unlock + Field rules tab shows the same single-source document')
        assert not errors, errors
        browser.close()


if __name__ == '__main__':
    run()
