"""EP02 (train) Field browser smoke test. Requires Python Playwright and Chromium plus the Express server:
    npm start   then   python tests/ep02_browser_smoke.py
Uses isolated browser storage and the production FieldCore.step clock; FieldEP02Data.random is pinned
(0.5) so wake / card position / flashes are deterministic. No real save is read or changed.
"""
import os
from playwright.sync_api import sync_playwright

BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')
STORY_KEY = 'yuyeon98.save.v1'


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
        def state(): return page.evaluate('FieldCore.get()')
        def data(): return state()['data']
        def log_text(): return page.locator('#field-log').inner_text()
        def to_seg(i):
            page.evaluate("(i) => { const s = FieldCore.get(); while (s.status === 'active' && s.data.sys.seg < i) FieldCore.step(0.5); }", i)
        def step(seconds): page.evaluate('(n) => { const s = FieldCore.get(); let left = n; while (left > 0 && s.status === "active") { FieldCore.step(Math.min(.5, left)); left -= .5; } }', seconds)
        def fresh():
            page.evaluate("FieldEP02Data.random = () => 0.5; FieldUI.close(); FieldUI.open()")
            click('field-dispatch-EP02')
            assert state()['status'] == 'active' and data()['carIndex'] == 7
        def dead(code):
            s = state(); assert s['status'] == 'dead' and data()['failCode'] == code and s['reason'].startswith(code), (code, s['status'], data()['failCode'], s['reason'])
        def forward(): click('f2-forward')
        def to_girl():           # shoes off, car 7 -> 6 -> 5
            click('f2-shoes'); forward(); forward(); assert data()['carIndex'] == 5
        def ask_girl():
            to_girl(); forward(); assert data()['sys']['girl'] == 'asked' and data()['girlAsked']
        def to_dark():           # past drunk (shoes) and girl (looked away) into the dark car
            to_girl(); click('f2-lookaway'); forward(); forward(); assert data()['carIndex'] == 3 and data()['darkCarEntered']
        def wait_flash():
            assert page.evaluate("() => { const s = FieldCore.get(); for (let i = 0; i < 80 && !s.data.sys.flash; i++) FieldCore.step(.25); return s.data.sys.flash; }")
        def search_card():
            wait_flash(); click('f2-search-kids'); assert data()['engineCardFound']
        def to_car2():
            to_dark(); search_card(); forward(); assert data()['carIndex'] == 2
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
        # 1-2. Unlock: locked before EP01 clear, dispatchable after it.
        click('field-open')
        assert page.locator('#field-dispatch-EP02').is_disabled() and page.locator('#field-dispatch-EP02').inner_text() == '연결 제한'
        page.evaluate("FieldSave.clear('EP01', { patrols: {}, elapsed: 720, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP02').inner_text() == '파견 가능' and not page.locator('#field-dispatch-EP02').is_disabled()
        assert page.locator('#field-dispatch-EP03').inner_text() == '연결 제한'
        fresh()
        assert '7번 객차' in page.locator('#f2-car').inner_text() and '이동 중' in page.locator('#f2-train').inner_text()
        assert page.locator('#f2-chips').inner_text().startswith('신발 신음')
        assert 'LINE 2' in page.locator('#f2-scene').inner_text()
        print('PASS 1-2 EP02 locked until EP01 clear, then dispatchable; EP02 view shows car/station/train/chips')

        # 3-4. Stopped: doors locked (message only). Running: move allowed.
        to_seg(1); assert not data()['trainMoving'] and data()['currentStation'] == '성수'
        forward(); assert data()['carIndex'] == 7 and '[정차 중] 연결문 잠금 유지' in log_text()
        assert '정차 중' in page.locator('#f2-train').inner_text()
        to_seg(2); assert data()['trainMoving']
        forward(); assert data()['carIndex'] == 6
        print('PASS 3-4 stopped door lock message only; running allows car movement')

        # 5-6. Drunk: shoes on -> wakes and tracks; caught -> death. Shoes off -> stays asleep.
        fresh(); forward(); assert data()['carIndex'] == 6 and not data()['drunkAwake']
        forward(); d = data(); assert d['drunkAwake'] and d['drunkTracking'] and d['carIndex'] == 5 and d['sys']['drunkGap'] == 7
        assert state()['status'] == 'active'
        step(70); dead('A_DRUNK_CAUGHT')
        fresh(); click('f2-shoes'); forward(); forward(); assert not data()['drunkAwake'] and data()['carIndex'] == 5
        print('PASS 5-6 shoes-on pass wakes the drunk into a slow chase (not instant death); caught = A_DRUNK_CAUGHT; shoes off stays asleep')

        # 7-9. Girl: direct answer fails, pointing to the map works, RPS order, winning = crying + parent risk.
        fresh(); ask_girl(); click('f2-speak'); dead('B_DESTINATION_ANSWER')
        fresh(); ask_girl(); click('f2-stepback'); assert data()['sys']['girl'] == 'asked'
        forward(); assert data()['carIndex'] == 5 and '아직 앞칸으로' in log_text()
        click('f2-map'); assert '노선도' in log_text()
        click('f2-point'); assert data()['sys']['girl'] == 'rps' and state()['status'] == 'active'
        for hand in ['paper', 'paper', 'rock', 'paper']: click(f'f2-rps-{hand}')
        d = data(); assert d['sys']['girl'] == 'done' and not d['girlCrying'] and d['parentRisk'] == 0
        forward(); assert data()['carIndex'] == 4
        fresh(); ask_girl(); click('f2-point'); click('f2-rps-paper'); click('f2-rps-rock'); dead('B_WRONG_RPS')
        fresh(); ask_girl(); click('f2-point'); click('f2-rps-scissors')
        d = data(); assert d['girlCrying'] and d['parentRisk'] == 1 and state()['status'] == 'active'
        page.evaluate('FieldEP02Data.random = () => 0'); forward(); dead('B_PARENT_ENCOUNTER')
        fresh(); to_girl(); click('f2-lookaway'); forward(); assert data()['carIndex'] == 4 and not data()['girlAsked']
        print('PASS 7-9 direct answer fails; map pointing is safe; RPS order paper-paper-rock-paper; winning = crying/parentRisk; looking away passes')

        # 10-11. Void station: crouch + eyes closed for the compressed 3 minutes; open eyes / move / no response fail.
        fresh(); to_seg(5); assert data()['voidStationActive'] and data()['currentStation'] == '■■■'
        click('f2-crouch'); click('f2-eyes'); step(1); assert data()['sys']['voidHolding'] and data()['crouching'] and data()['eyesClosed']
        step(19); assert state()['status'] == 'active' and not data()['voidStationActive'] and data()['trainMoving']
        fresh(); to_seg(5); click('f2-crouch'); click('f2-eyes'); step(1); click('f2-eyes'); dead('VOID_STATION_OPEN_EYES')
        fresh(); to_seg(5); forward(); dead('VOID_STATION_MOVE')
        fresh(); to_seg(5); step(9); dead('VOID_STATION_NO_RESPONSE')
        print('PASS 10-11 void station: crouch + eyes closed succeeds; opening eyes / moving / ignoring fail')

        # 12-14. Dark car: artificial light fails; stopped movement fails; dark search fails; card found in a flash.
        fresh(); to_dark(); click('f2-phone'); dead('C_ARTIFICIAL_LIGHT')
        fresh(); to_dark(); to_seg(1); assert not data()['trainMoving']; forward(); dead('C_MOVE_WHILE_STOPPED')
        fresh(); to_dark(); assert not data()['sys']['flash']; click('f2-search-blueCheck'); dead('C_WRONG_SEARCH')
        fresh(); to_dark(); forward(); assert data()['carIndex'] == 3 and '수색을 요한다' in log_text()
        search_card(); assert data()['engineCardFound'] and state()['status'] == 'active'
        forward(); assert data()['carIndex'] == 2
        print('PASS 12-14 dark car: light / stopped move / search in darkness fail; flash search finds the card; leaving needs the card')

        # 15. Crowd car needs both undress and oil.
        fresh(); to_car2(); forward(); dead('D_NO_UNDRESS')
        fresh(); to_car2(); click('f2-undress'); forward(); dead('D_NO_OIL')
        fresh(); to_engine(); assert data()['undressed'] and data()['oiled'] and not data()['realityButtonPressed']
        print('PASS 15 crowd car: undress + oil both required; pushing through reaches the engine room with the card')

        # 16-17. Final escape at Yongdu.
        fresh(); to_engine(); click('f2-window'); click('f2-jump'); dead('FINAL_WRONG_STATION')
        fresh(); to_engine(); click('f2-recognize'); dead('FINAL_WRONG_STATION')
        fresh(); at_yongdu(); click('f2-window'); click('f2-jump'); dead('FINAL_NO_RECOGNITION')
        fresh(); at_yongdu(); click('f2-recognize'); assert data()['realityButtonPressed']; step(13); dead('FINAL_TOO_LATE')
        fresh(); at_yongdu(); to_seg(10); step(41); dead('FINAL_TOO_LATE')
        hooks = page.evaluate('''() => { window.__hooks = []; const add = FieldCore.hooks.add;
            add('onEpisodeStart', id => window.__hooks.push('start:' + id)); add('onMajorEvent', (id, e) => window.__hooks.push(id + ':' + e));
            add('onEpisodeClear', id => window.__hooks.push('clear:' + id)); add('onMajorEvent', () => { throw new Error('hooks must never break play'); }); return true; }''')
        fresh(); at_yongdu()
        click('f2-recognize'); click('f2-window'); click('f2-jump')
        s = state(); assert s['status'] == 'cleared' and data()['escaped'], s['status']
        seen = page.evaluate('window.__hooks')
        assert 'start:EP02' in seen and 'clear:EP02' in seen and 'EP02:ENGINE_ROOM' in seen and 'EP02:C_CARD_FOUND' in seen , seen
        assert 'EP02:REALITY_BUTTON' in seen and 'EP02:VOID_STATION' in seen
        print('PASS 16-17 wrong station / no recognition / too late fail; reality button then window at Yongdu clears; AUTHOR hooks fire (no content)')

        # 18-20. Progression, Story isolation and persistence.
        assert page.evaluate("FieldSave.get().cleared.includes('EP02') && FieldSave.unlocked('EP03')")
        assert 'EP02' in page.evaluate('FieldSave.get().records') and page.evaluate("FieldSave.get().records.EP02.elapsed") > 0
        click('field-list'); assert page.locator('#field-dispatch-EP03').inner_text() == '연결 준비 중' and page.locator('#field-dispatch-EP03').is_disabled()
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before, 'Story save must be untouched'
        assert page.evaluate("!FieldSave.get().cleared.includes('EP03') && AuthorRoute.get().unlocked === false")
        deaths = page.evaluate("FieldSave.get().deaths.EP02")
        assert deaths and deaths >= 10, deaths
        page.reload(wait_until='load')
        assert page.evaluate("FieldSave.get().cleared.includes('EP02') && FieldSave.unlocked('EP03') && FieldSave.get().deaths.EP02") == deaths
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before
        assert 'EP02' in page.evaluate('FieldSave.exportProgress().cleared.join()') and page.evaluate('GameSave.exportCode().length') > 0
        print('PASS 18-20 EP03 unlocks only in Field; Story save byte-identical; EP02 clear/deaths/EP03 unlock survive reload')
        # Dev unlock (localhost only, no ?devunlock=0): every episode dispatchable, saved progress untouched.
        dev = browser.new_context().new_page(); dev.goto(BASE, wait_until='load')
        dev.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); FieldUI.open();")
        assert dev.evaluate('FieldSave.devUnlock') and dev.locator('#field-dispatch-EP02').inner_text() == '파견 가능'
        assert dev.locator('#field-dispatch-EP05').inner_text() == '연결 준비 중' and '[개발 모드]' in dev.locator('#field-content').inner_text()
        assert dev.evaluate("JSON.stringify(FieldSave.get().unlocked) === '[\"EP01\"]' && JSON.stringify(FieldSave.exportProgress().unlocked) === '[\"EP01\"]'")
        dev.locator('#field-dispatch-EP02').click(); assert dev.evaluate("FieldCore.get().id === 'EP02' && FieldCore.get().status === 'active'")
        print('PASS dev unlock: all episodes open on localhost without changing saved progress; ?devunlock=0 restores real locks')
        assert not errors, errors
        browser.close()


if __name__ == '__main__':
    run()
