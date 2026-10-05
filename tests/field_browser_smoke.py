"""Browser integration checks. Requires Python Playwright and Chromium.
Run the Express server, then: python3 tests/field_browser_smoke.py
Uses isolated browser storage and the production clock step to accelerate shifts.
No game save from the user's browser is loaded or changed.
"""
import json
import os
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                    headless=True, args=['--no-sandbox'])
        context = browser.new_context(viewport={'width': 1280, 'height': 900})
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until='load')
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")
        def click(id): page.locator('#' + id).click()
        def state(): return page.evaluate('FieldCore.get()')
        def advance(seconds): page.evaluate('(seconds) => FieldCore.step(seconds)', seconds)
        def until(minute, random_value=0.1):
            page.evaluate('''([minute, value]) => {
                const old = Math.random; Math.random = () => value;
                try { const s = FieldCore.get(); FieldCore.step(Math.max(.01, (minute + .02 - s.minute) * s.duration / 480)); }
                finally { Math.random = old; }
            }''', [minute, random_value])
        def dispatch():
            if page.locator('#field-retry').count(): click('field-retry')
            else:
                if page.locator('#field-list').count(): click('field-list')
                click('field-dispatch-EP01')
        def hold(id, seconds):
            el = page.locator('#' + id); el.scroll_into_view_if_needed(); box = el.bounding_box()
            page.mouse.move(box['x'] + box['width']/2, box['y'] + box['height']/2)
            page.mouse.down(); advance(seconds); page.mouse.up()
        def equipment():
            click('field-tab-equipment'); click('field-equipment-check'); click('field-take-baton'); click('field-take-radio')
        def a_success():
            until(60); click('field-light'); hold('field-eyes', 10.5)
            assert state()['status'] == 'active' and state()['data']['event'] is None
        def b_contact(value=0.1):
            until(220, value); click('field-contact-greet'); click('field-contact-inspect'); click('field-contact-compliment')
        def b_buy(item='money'):
            click('field-contact-buy'); page.locator('#field-item').select_option(item); click('field-use')
        def f_success():
            until(415); click('field-blink-left'); click('field-blink-right'); hold('field-back', 6.5)
            assert state()['data']['event']['stage'] == 'tv'
            click('field-contact-behind'); click('field-contact-crouch'); advance(4.5)
            assert state()['data']['event']['stage'] == 'sound'
            click('field-contact-front'); page.locator('#field-item').select_option('baton')
            for _ in range(3): click('field-use')
            assert state()['data']['event'] is None
        click('field-open')
        assert page.locator('#field-dispatch-EP02').is_disabled()
        assert page.locator('#field-dispatch-EP02').inner_text() == '연결 제한'
        assert '[EP.01]' in page.locator('.field-case').first.inner_text()
        assert '사건수사노트의 [기록] 탭' in page.locator('#field-content').inner_text()
        # The shared setting controls shift minutes, not real-time interaction deadlines.
        pacing = page.evaluate('''() => {
            const results = [];
            for (const seconds of [1.25, 1.5, 2]) {
                FieldCore.config.realSecondsPerGameMinute = seconds;
                FieldCore.dispatch('EP01');
                const s = FieldCore.get(); FieldCore.step(60);
                results.push({ seconds, duration: s.duration, minute: s.minute, elapsed: s.elapsed });
                FieldCore.disconnect();
            }
            FieldCore.config.realSecondsPerGameMinute = 1.5;
            return results;
        }''')
        for sample in pacing:
            assert sample['duration'] == 480 * sample['seconds']
            assert abs(sample['minute'] - 60 / sample['seconds']) < .001
            assert sample['elapsed'] == 60
        assert page.evaluate('FieldEP01Data.events.map(e => [e.type, e.minute])') == [['A',60],['B',220],['D',310],['F',415]]
        first = page.evaluate('''() => {
            FieldCore.dispatch('EP01'); FieldCore.step(89.75);
            const before = FieldCore.get().data.event;
            FieldCore.step(.25); const s = FieldCore.get();
            const result = { before, type: s.data.event.type, minute: s.minute, elapsed: s.elapsed };
            FieldCore.disconnect(); return result;
        }''')
        assert first == {'before':None, 'type':'A', 'minute':60, 'elapsed':90}
        assert '현장 관측 시스템.exe - 특별재난 관리본부' in page.locator('#fieldWindow .window-header').inner_text()
        # Restore the list UI after the isolated pacing probes.
        click('field-close'); click('field-open')
        dispatch(); equipment()
        # Reading does not pause the clock; advance through a wave window and report a patrol.
        click('field-tab-rules'); before = state()['elapsed']; page.wait_for_timeout(650)
        assert state()['elapsed'] > before
        assert abs(state()['minute'] - state()['elapsed'] / 1.5) < .001
        assert state()['duration'] == 720
        click('field-tab-map'); click('field-check-weather'); click('field-move-harbor'); click('field-patrol')
        click('field-tab-phone'); click('field-phone-1'); click('field-report'); click('field-hangup')
        assert state()['patrols'].get('0')
        a_success()
        until(70); click('field-tab-map'); click('field-move-harbor'); click('field-check-weather'); click('field-move-coast')
        assert state()['data']['location'] == 'harbor'
        click('field-move-shelter'); click('field-tab-phone'); click('field-phone-1'); click('field-phone-0')
        assert state()['data']['phoneNamesYou']
        click('field-hangup'); click('field-phone-0'); assert state()['data']['phone'] is None
        advance(3); click('field-phone-0'); assert not state()['data']['phoneNamesYou']; click('field-hangup')
        story_before = page.evaluate('JSON.stringify(GameSave.get())')
        code_before = page.evaluate('GameSave.exportStoryCode()')
        b_contact(); b_buy(); assert state()['inventory']['bait'] == 1
        until(310); page.locator('#field-item').select_option('bait'); click('field-use')
        assert 'bait' not in state()['inventory'] and state()['inventory']['catch'] == 1
        f_success(); until(480)
        assert state()['status'] == 'cleared'
        assert page.evaluate("FieldSave.unlocked('EP02') && FieldSave.get().cleared.includes('EP01')")
        assert page.evaluate('JSON.stringify(GameSave.get())') == story_before
        assert page.evaluate('GameSave.exportStoryCode()') == code_before
        # Transfer a genuinely completed shift + AUTHOR progress into a fresh browser.
        page.evaluate("FieldSave.death('EP01')")
        page.evaluate("AuthorRoute.importProgress({v:1,unlocked:true,authorAccessLevel:1,authorTraces:['creator-note']})")
        bundle = page.evaluate('GameSave.exportCode()')
        expected_field = page.evaluate('FieldSave.get()')
        expected_author = page.evaluate('AuthorRoute.get()')
        target = browser.new_context(); target_page = target.new_page()
        target_page.on('dialog', lambda dialog: dialog.accept())
        target_page.goto(BASE, wait_until='load')
        assert not target_page.evaluate('FieldSave.get().cleared.length || AuthorRoute.get().unlocked')
        target_page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); openNotebook('record');")
        target_page.locator('#save-code-input').fill(bundle)
        with target_page.expect_navigation(wait_until='load'):
            target_page.locator('#save-code-import').click()
        assert target_page.evaluate('GameSave.exportStoryCode()') == code_before
        assert target_page.evaluate('FieldSave.get()') == expected_field
        assert target_page.evaluate('AuthorRoute.get()') == expected_author
        assert target_page.evaluate('FieldCore.get()') is None
        assert target_page.evaluate('GameSave.exportCode()') == bundle
        target.close()
        print('PASS v5 fresh-browser UI round-trip: actual 06:00 clear, EP02 unlock, death, duty summary, Story and AUTHOR trace')
        # EP02 is implemented now: unlocked by the EP01 clear, it can be dispatched (still locked before).
        click('field-list'); assert '파견 가능' in page.locator('#field-dispatch-EP02').inner_text()
        assert not page.locator('#field-dispatch-EP02').is_disabled()
        page.reload(wait_until='load')
        assert page.evaluate("FieldSave.get().cleared.includes('EP01') && FieldSave.unlocked('EP02')")
        assert page.evaluate('(code) => GameSave.importCode(code)', code_before)
        assert page.evaluate('GameSave.exportStoryCode()') == code_before
        assert page.evaluate("FieldSave.unlocked('EP02')")
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")
        click('field-open')
        print('PASS central system, real reading clock, equipment/patrol/weather/phone, A/B/D/F direct controls, 06:00, EP02 unlock, persistence, Story isolation and v4 round-trip')
        dispatch(); until(60); advance(9); assert state()['status'] == 'dead'
        dispatch(); assert state()['minute'] < 1 and 'bait' not in state()['inventory']
        until(60); click('field-light'); hold('field-eyes', 2); assert state()['status'] == 'dead'
        for forbidden in ['light', 'move']:
            dispatch(); until(60); click('field-light')
            page.evaluate("FieldCore.action('eyes', true); FieldCore.step(2)")
            if forbidden == 'light': click('field-light')
            else: click('field-tab-map'); click('field-move-shelter')
            assert state()['status'] == 'dead'
        print('PASS A at 23:00/90 seconds, 10-second hold, late protection/early release/movement/relighting failure and clean retry')
        # Full human response windows are real seconds at the faster shift pace.
        dispatch(); a_success(); until(220); advance(118)
        assert state()['status'] == 'active' and state()['data']['event']['type'] == 'B'
        advance(3); assert state()['status'] == 'dead'
        dispatch(); a_success(); b_contact(); b_buy(); until(310); advance(88)
        assert state()['status'] == 'active' and state()['data']['event']['type'] == 'D'
        advance(3); assert state()['status'] == 'dead'
        dispatch(); equipment(); a_success(); b_contact(); b_buy(); until(310)
        page.locator('#field-item').select_option('bait'); click('field-use'); until(415)
        advance(24); assert state()['status'] == 'active'
        advance(2); assert state()['status'] == 'dead'
        print('PASS shared 1.25/1.5/2-second pacing, unchanged event schedule and real-second B/D/F response windows')
        dispatch(); a_success(); b_contact(); b_buy('wallet'); assert state()['status'] == 'dead'
        dispatch(); a_success(); b_contact(.5)
        assert state()['data']['event']['bag']['observation'] == '사람의 머리'
        assert not state()['data']['event']['bag']['actualOgwibal']
        click('field-contact-notify'); b_buy(); assert state()['inventory']['bait'] == 1
        click('field-close'); click('field-open'); dispatch(); a_success(); b_contact(.9)
        assert state()['data']['event']['bag']['actualOgwibal']
        click('field-contact-leave'); assert 'bait' not in state()['inventory']
        until(310); click('field-contact-body'); assert state()['data']['event'] is None
        print('PASS B wallet failure, head notification without creature identity merge, actual creature polite departure, D body demand')
        until(415); click('field-look'); assert state()['status'] == 'dead'
        dispatch(); equipment(); a_success(); b_contact(); b_buy(); until(310)
        page.locator('#field-item').select_option('bait'); click('field-use'); until(415)
        hold('field-back', 6.5); click('field-contact-behind'); click('field-contact-crouch'); advance(4.5); advance(13)
        assert state()['status'] == 'dead' and '토막난' in state()['reason']
        print('PASS F gaze loss and post-sound delay failure')
        dispatch(); a_success(); b_contact(); b_buy(); until(310)
        click('field-tab-map'); click('field-move-shelter'); assert state()['status'] == 'dead'
        dispatch(); a_success(); b_contact(); b_buy(); until(310)
        click('field-look'); assert state()['status'] == 'dead'
        assert page.evaluate("FieldSave.get().deaths.EP01") >= 6
        dispatch(); click('field-close'); assert state() is None
        page.evaluate('disconnectDarkWeb()'); page.wait_for_timeout(300); assert state() is None
        print('PASS D turn/flee failure, death persistence and disconnect cleanup')
        # Retained CCTV still uses its original, independent clock and progress hook.
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); openDarkWebCCTV();")
        def cctv_reach(expected):
            page.evaluate("clearInterval(cctvTimer); for(let i=0;i<100 && cctvGameState==='idle';i++) tickCCTVGame();")
            assert page.evaluate('cctvGameState') == expected
        def cctv_pick(n): page.locator('#cctv-choices-container button').nth(n).click()
        cctv_reach('event_A'); cctv_pick(1); page.wait_for_function("cctvGameState==='idle'")
        cctv_reach('event_B'); cctv_pick(1)
        cctv_reach('event_D'); cctv_pick(1)
        cctv_reach('event_F'); cctv_pick(1); cctv_pick(1); page.wait_for_function("cctvGameState==='idle'")
        cctv_reach('win'); assert page.evaluate('GameSave.ep(1).clears') == 1
        page.evaluate('startCCTVGame(); triggerEventB();'); cctv_pick(0)
        assert page.evaluate('cctvGameState') == 'death'; cctv_pick(0)
        assert page.evaluate('cctvHour===22 && cctvMinute===0')
        page.evaluate('closeDarkWebCCTV()')
        print('PASS retained EP01 CCTV A/B/D/F→06:00 and death/retry')
        # A fresh storage context has no Field clears; existing Story still reaches J and LOOP.
        other = browser.new_context(); fresh = other.new_page(); fresh.on('pageerror', lambda e: errors.append(str(e)))
        legacy = {'v':1, 'eps':{'1':{'clears':2,'deaths':1,'firstClearAt':10}}, 'clues':{'c01-blink':10}, 'deductions':{}, 'flags':{}}
        fresh.add_init_script('(function(){ if(!localStorage.getItem("yuyeon98.save.v1")) localStorage.setItem("yuyeon98.save.v1", ' + json.dumps(json.dumps(legacy)) + '); })();')
        fresh.goto(BASE, wait_until='load')
        assert fresh.evaluate('GameSave.ep(1).clears') == 2
        assert fresh.evaluate('FieldSave.get().cleared.length') == 0
        fresh.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); phoneCurrentPhase=3; document.getElementById('phone-input').disabled=false; document.getElementById('phone-input').value='5264'; handlePhoneInputSubmit();")
        assert fresh.evaluate('GameSave.ep(9).clears') == 1
        assert fresh.locator('#jay-report-icon').evaluate("e => e.style.display") == 'flex'
        fresh.evaluate('openJayReport(); closeJayReport();')
        assert fresh.evaluate("GameSave.flag('jayUnlocked') && GameSave.flag('finaleSeen')")
        fresh.evaluate('applyLoopDesktopState(false)')
        assert 'LOOP 02' in fresh.locator('#darkweb-desktop').inner_text()
        assert fresh.evaluate('FieldSave.get().cleared.length') == 0
        print('PASS old save load and EP09 success → J → BSOD/LOOP with zero Field clears (boundary integration)')
        assert not errors, errors
        other.close()
        # Narrow mobile viewport: direct controls and report remain reachable without overflow.
        mobile = browser.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True)
        m = mobile.new_page(); m.goto(BASE, wait_until='load')
        m.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); FieldUI.open();")
        m.locator('#field-dispatch-EP01').click(); m.locator('#field-tab-rules').click()
        assert m.locator('.field-rules').is_visible()
        assert m.locator('#field-content').evaluate('e => e.scrollWidth <= e.clientWidth + 1')
        m.locator('#field-close').click(); mobile.close()
        print('PASS mobile layout and accessible document/exit')
        # Reset the actual completed shift/death/Story records from this integration run.
        assert page.evaluate("FieldSave.get().cleared.includes('EP01') && GameSave.ep(1).clears > 0")
        page.evaluate("FieldCore.dispatch('EP01'); GameSave.reset();")
        assert page.evaluate('FieldCore.get()') is None
        assert page.evaluate('FieldSave.get()') == {'v':1,'cleared':[],'unlocked':['EP01'],'deaths':{},'records':{}}
        assert page.evaluate('AuthorRoute.get()') == {'v':1,'unlocked':False,'authorAccessLevel':0,'authorTraces':[]}
        assert page.evaluate('GameSave.ep(1).clears === 0 && Object.keys(GameSave.get().eps).length === 0')
        page.reload(wait_until='load')
        assert not page.evaluate("FieldSave.get().cleared.length || AuthorRoute.get().unlocked || GameSave.ep(1).clears")
        print('PASS full reset after actual Field/CCTV clears: blank Story/Field/AUTHOR, live disconnect and reload')
        context.close(); browser.close()
    config = json.loads((ROOT/'vercel.json').read_text())
    assert any(b['src']=='field/**' and b['use']=='@vercel/static' for b in config['builds'])
    for file in (ROOT/'field').rglob('*'):
        if not file.is_file(): continue
        with urlopen(BASE+'/'+file.relative_to(ROOT).as_posix()) as response:
            assert response.status == 200 and response.read() == file.read_bytes()
    print('PASS all Field assets served exactly; Vercel static inclusion configured (live deployment not run)')

if __name__ == '__main__':
    run()
