"""EP07 (나눔 12시 편의점 야간 근무 / convenience-store counter duty) Field browser smoke test. Requires Python
Playwright and Chromium plus the Express server:
    npm start   then   python tests/ep07_browser_smoke.py
Uses isolated browser storage and the production FieldCore.step clock (the wall clock FieldCore reads is frozen, so
only step() advances time). FieldEP07Data.random(name) forces dTier (0-5) / ghostCode (0 blank, 1 code) / endPresses (>=1). No real save is read or changed.
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')
STORY_KEY = 'yuyeon98.save.v1'


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                    headless=True, args=['--no-sandbox'])
        page = browser.new_context(viewport={'width': 1280, 'height': 900}, has_touch=True).new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))

        def boot():
            page.goto(BASE + '/?devunlock=0', wait_until='load')
            page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")
            page.evaluate("window.__pn = performance.now(); performance.now = () => window.__pn")

        boot()
        SCHED = page.evaluate('FieldEP07Data.schedule')
        T = page.evaluate('FieldEP07Data.tuning')

        def click(id): page.locator('#' + id).click()
        def tap(id): page.locator('#' + id).tap()
        def has(id): return page.locator('#' + id).count() > 0
        def state(): return page.evaluate('FieldCore.get()')
        def data(): return state()['data']
        def log_text(): return page.locator('#field-log').inner_text()
        def step(seconds): page.evaluate('(n) => { let left = n; while (left > 0 && FieldCore.get().status === "active") { FieldCore.step(Math.min(.25, left)); left -= .25; } }', seconds)
        def act(name, value=None): page.evaluate('([n, v]) => FieldCore.action(n, v)', [name, value])
        def cust(): return data()['cust'] or {}
        def fresh(force=None):
            page.evaluate("""(force) => { window.__force = force || {};
                FieldEP07Data.random = name => (name in window.__force ? window.__force[name] : Math.random());
                FieldUI.close(); FieldUI.open(); }""", force or {})
            click('field-dispatch-new-EP07' if has('field-dispatch-new-EP07') else 'field-dispatch-EP07')
            assert state()['status'] == 'active' and data()['clock'] == 0 and not data()['cust']
        def dead(code):
            s = state(); assert s['status'] == 'dead' and data()['failCode'] == code and s['reason'].startswith(code), (code, s['status'], data()['failCode'], s['reason'])
            assert '[근무 기록 중단]' in s['reason'] and '근무 기록 중단' in log_text()
        def wait_for(cond, limit=1200):
            n = 0
            while not cond():
                n += 1; assert n < limit, ('wait timeout', data().get('cust'), data()['clock'])
                assert state()['status'] == 'active', state().get('reason')
                step(.5)
        def at_counter(): wait_for(lambda: cust().get('phase') == 'counter')
        def away(): wait_for(lambda: cust().get('gaze') == 'away' and cust().get('gazeT', 0) > 1.0)
        def glance(hold=.4):
            away(); act('glance', True); step(hold); act('glance', False)
        def serve(stop=None):
            """Serve the current customer correctly (stop=name returns just before that step)."""
            at_counter()
            if stop == 'mirror': return
            glance()
            c = cust()
            if c['q'] == 'pending': act('pointPrice')
            for i in range(len(c['items'])): act('scan', i)
            if any(i.get('ghost') for i in cust()['items']):
                if stop == 'hq': return
                act('hq')
            if c['id']:
                wait_for(lambda: cust().get('idStage') == 'handed')
                if stop == 'id': return
                act('idTake', 500); step(.8); act('idReturn', 520)
            act('pay', c['pay'])
            if c['bag']: act('bag')
            wait_for(lambda: not data()['cust'])
        def solve_free():
            d = data()
            if d['urge'] and d['chimes'] == d['exits']:
                act('lockDoor'); act('leave'); return True
            if d['wasteAlert'] and d['f'] == '':
                act('shelf', True); act('tongs', 'returned'); act('contain'); act('hq'); act('registerWaste', 'lunchbox'); act('shelf', False); return True
            return False
        def play(until, limit=1500):
            n = 0
            while not until():
                n += 1; assert n < limit, ('stuck', data().get('cust'), data()['clock'])
                assert state()['status'] == 'active', state().get('reason')
                if data()['cust']: serve(); continue
                if solve_free(): continue
                step(.5)
        def k_index(k):
            """schedule position just after the k-th customer (1-based) walked in"""
            return [i for i, e in enumerate(SCHED) if 'customer' in e][k - 1] + 1

        story_before = page.evaluate(f"localStorage.getItem('{STORY_KEY}')")
        globals_js = "JSON.stringify([typeof jayUnlocked !== 'undefined' ? jayUnlocked : null, typeof finaleSeen !== 'undefined' ? finaleSeen : null, localStorage.getItem('yuyeon98.author.v1'), localStorage.getItem('yuyeon98.classified.v1')])"
        globals_before = page.evaluate(globals_js)

        # --- 0. Rule document: one canon (transcript -> 7화.txt -> Story window -> Field panel) ------------------------
        story_doc = page.evaluate("document.querySelector('#darkwebReportWindowEP7 textarea').value").replace('\r\n', '\n').strip()
        txt = (ROOT / '7화.txt').read_text(encoding='utf-8').replace('\r\n', '\n').strip()
        assert story_doc == txt, 'index.html Story window must equal 7화.txt'
        transcript = (ROOT / 'docs/transcripts/reviewed/EP07_나눔_12시_편의점.txt').read_text(encoding='utf-8-sig')
        assert '문서 번호 2026-07-19' in transcript.replace('.', '').replace(',', '') or '2026-07-19' in transcript
        for marker in ['문서 번호: 2026-07-19', '나눔 12시 편의점', '0050-0200', 'SNS-0719', '알바지옥',
                       '여기 알바는 거울을 좋아하나 봐요?', '엄지손톱', '10,000원 이하 양쪽 귀', '30,000원 이하 랜덤한 장기 한 부위',
                       '50,000원 이하 전두엽', '근무 종료', '본 수칙을 숙지한 귀하는 반드시 무사히 퇴근할 수 있습니다.']:
            assert marker in txt, marker
        for forbidden in ['편의점야간-', '2026년 개정', '시행 일자', '부착 위치', '외부 게시 불가', '열람 금지', '0050-0으로']:
            assert forbidden not in txt, forbidden
        assert page.evaluate("EPISODE_DOCS[7]") == '2026-07-19' and page.evaluate("EPISODE_TITLES[7]") == '나눔 12시 편의점'
        assert page.evaluate("CLUES.filter(c => c.ep === 7).every(c => document.querySelector('#darkwebReportWindowEP7 textarea').value.includes(c.quote))")
        assert page.evaluate("MESSENGER_GENERIC.hq.filter(m => m.ep === 7).every(m => document.querySelector('#darkwebReportWindowEP7 textarea').value.includes(m.quote))")
        print('PASS 0 rule document: 7화.txt == Story window; doc no. 2026-07-19; 나눔 12시 편의점; A-G canon phrases kept; no unsourced metadata; clue/messenger quotes valid')

        # --- 1. Unlock -------------------------------------------------------------------------------------------------
        click('field-open')
        assert page.locator('#field-dispatch-EP07').inner_text() == '연결 제한' and page.locator('#field-dispatch-EP07').is_disabled()
        page.evaluate("for (const id of ['EP01','EP02','EP03','EP04','EP05']) FieldSave.clear(id, { patrols: {}, elapsed: 700, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP07').inner_text() == '연결 제한', 'EP07 stays locked until EP06 is cleared'
        page.evaluate("FieldSave.clear('EP06', { patrols: {}, elapsed: 300, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP07').inner_text() == '파견 가능' and not page.locator('#field-dispatch-EP07').is_disabled()
        assert page.locator('#field-dispatch-EP08').inner_text() == '연결 제한'
        print('PASS 1 EP07 locked until EP06 clear, then dispatchable; EP08 still locked')

        # --- 2. UI: the counter, no counts, manual tally -------------------------------------------------------------
        page.evaluate("""(() => { window.__hooks = []; const add = (kind, fn) => FieldCore.hooks.add(kind, fn);
            add('onEpisodeStart', id => window.__hooks.push(['onEpisodeStart', id]));
            add('onMajorEvent', (id, event) => window.__hooks.push(['onMajorEvent', id, event]));
            add('onEpisodeClear', id => window.__hooks.push(['onEpisodeClear', id])); })()""")
        fresh()
        hud = page.locator('.field-hud').inner_text()
        assert page.locator('.field-hud > *').count() == 3 and '22:00' in hud and '계산대' in hud and '자동문: 열림' in hud
        assert '[POS] 전 근무 폐기 내역: 삼각김밥(참치마요) 02:14' in log_text()
        whole = page.locator('#field-content').inner_text().replace(page.locator('.field-rules').inner_text(), '')
        for secret in ['ENTRY', 'EXIT', '불일치', '상황 A', '상황 B', 'phantom', 'true', 'false', 'MIRROR', '정답']:
            assert secret not in whole, secret
        click('f7-tally-chime'); click('f7-tally-chime'); click('f7-tally-exit'); click('f7-tally-chime-minus')
        assert data()['tally'] == {'chime': 1, 'exit': 1} and data()['chimes'] == 0 and page.locator('#f7-marks-chime').inner_text().replace(' ', '') == '띵동|'
        print('PASS UI: HUD = time / counter / door lock; previous shift waste log; no counts or event names; the tally memo is manual only')

        # --- 3. A normal transaction through the real UI --------------------------------------------------------------
        fresh(); wait_for(lambda: data()['cust']); assert '띵동' in log_text() and data()['chimes'] == 1 and data()['tally']['chime'] == 0
        at_counter(); assert cust()['gaze'] == 'watch' and '이쪽을 보고 있다' in page.locator('#f7-text').inner_text()
        click('f7-greet'); dead('SPOKE_FIRST')
        fresh(); wait_for(lambda: data()['cust']); at_counter(); click('f7-scan-0'); dead('MIRROR_SKIPPED')
        fresh(); wait_for(lambda: data()['cust']); at_counter(); act('glance', True); dead('MIRROR_LOCKED')   # caught while they watch
        fresh(); wait_for(lambda: data()['cust']); at_counter(); away(); act('glance', True); step(T['glanceMax'] + .3); dead('MIRROR_LOCKED')   # stared
        fresh(); wait_for(lambda: data()['cust']); at_counter(); away()
        page.locator('#f7-glance').hover(); page.mouse.down(); assert not page.locator('#f7-mirror').is_hidden(); step(.4); page.mouse.up()
        assert cust()['mirrored'] and '평범한 매장 통로' in log_text()
        click('f7-scan-0'); assert '생수 500ml' in page.locator('#f7-pos').inner_text()
        click('f7-pay-cash'); assert '카드를 내민다' in log_text(); click('f7-pay-card')
        wait_for(lambda: not data()['cust']); assert data()['exits'] == 1 and '손님이 나갔다' in log_text() and data()['clock'] >= 12
        print('PASS normal: chime -> customer -> covert mirror glance (hold) -> scan -> correct payment -> exit; greeting first / scanning before the mirror / being caught / staring fail')

        # --- 4. A mirror corridor ----------------------------------------------------------------------------------------
        fresh(); play(lambda: data()['sched'] >= k_index(3)); at_counter(); away(); act('glance', True)
        assert '끝없이 반복되는 통로' in log_text() and page.locator('#f7-mirror').get_attribute('class') == 'f7-corridor'
        step(T['corridorMax'] + .3); dead('MIRROR_LOCKED'); assert '여기 알바는 거울을 좋아하나 봐요?' in state()['reason']
        fresh(); play(lambda: data()['sched'] >= k_index(3)); at_counter(); glance(.4); assert cust()['mirrored'] and '시선을 거뒀다' in log_text()
        serve(); assert state()['status'] == 'active'
        print('PASS A: the corridor shows only inside the mirror glance; holding it fails with the canon quote; looking away at once and serving normally proceeds')

        # --- 5. B ID card (normal + blinking), drag interaction ----------------------------------------------------------
        fresh(); play(lambda: data()['sched'] >= k_index(2)); serve('id'); assert not page.locator('#f7-id').is_hidden()
        card = page.locator('#f7-id-card'); tray = page.locator('#f7-id-tray').bounding_box()
        card.hover(); page.mouse.down(); page.mouse.move(tray['x'] + 20, tray['y'] + 30); page.mouse.up()
        assert cust()['idStage'] == 'taken'; step(2); assert not cust()['blinked']
        act('idReturn', 3000); assert cust()['idStage'] == 'returned', 'a normal ID can go back at any pace'
        def to_blink():
            fresh(); play(lambda: data()['sched'] >= k_index(5)); serve('id')
        to_blink(); act('idTake', 500); step(T['blinkAfter'] + .2); assert cust()['blinked'] and '눈을 깜빡인다' in log_text()
        act('idReturn', 1500); dead('ID_FAIL'); assert '튀어나온 손' in state()['reason']
        to_blink(); act('idTake', 500); step(T['blinkAfter'] + .2); click('f7-id-look'); dead('ID_FAIL')
        to_blink(); act('idTake', 500); step(T['blinkAfter'] + .2); click('f7-refuse'); dead('ID_FAIL')
        to_blink(); act('idTake', 500); step(T['blinkAfter'] + T['idHold'] + .5); dead('ID_FAIL')
        to_blink(); act('idTake', 500); step(T['blinkAfter'] + .2); act('idReturn', 560); assert cust()['idStage'] == 'returned'
        act('pay', cust()['pay']); wait_for(lambda: not data()['cust'])
        print('PASS B: ID dragged hand -> tray; a blinking photo: same-speed return passes; different speed / looking closer / refusing / freezing with it fail')

        # --- 6. C voice overlap vs a normal price question ----------------------------------------------------------------
        fresh(); play(lambda: data()['sched'] >= k_index(4)); at_counter(); assert '"이거 얼마예요?"' in log_text() and '내 목소리' not in log_text()
        click('f7-answer'); assert cust()['q'] == 'done', 'a normal price question may be answered aloud'
        def to_voice():
            fresh(); play(lambda: data()['sched'] >= k_index(6)); at_counter(); assert '내 목소리다' in log_text()
        to_voice(); click('f7-answer'); dead('VOICE_LOST'); assert '성대' in state()['reason']
        to_voice(); click('f7-point-screen'); assert cust()['q'] == 'done'; serve(); assert state()['status'] == 'active'
        print('PASS C: the same price question; when it overlaps your own voice, answering aloud fails and pointing (tag/screen) passes')

        # --- 7. E chime with nobody + manual tally + leaving the counter ----------------------------------------------------
        fresh(); play(lambda: data()['phantom'] == 'inside'); assert '아무도 보이지 않는다' in log_text() and data()['chimes'] == data()['exits'] + 1
        assert '불일치' not in page.locator('#field-content').inner_text().replace(page.locator('.field-rules').inner_text(), '')
        act('lockDoor'); act('leave'); dead('E_LEFT_DURING_MISMATCH'); assert '허공에 건네는' in state()['reason']
        fresh(); play(lambda: data()['urge']); assert data()['phantom'] == 'inside' and '화장실이 급하다' in log_text()
        play(lambda: data()['cust']); at_counter(); act('lockDoor'); assert '손님이 있다' in log_text() and not data()['doorLocked']
        act('leave'); dead('LEAVE_WITH_CUSTOMER')
        fresh(); play(lambda: data()['phantom'] == 'gone'); assert '저절로 들린다' in log_text() and data()['chimes'] == data()['exits']
        act('leave'); dead('DOOR_UNLOCKED'); assert '이름표' in state()['reason']
        fresh(); play(lambda: data()['phantom'] == 'gone'); act('lockDoor'); assert '잠김' in page.locator('.field-hud').inner_text()
        act('leave'); assert state()['status'] == 'active' and not data()['urge'] and not data()['doorLocked']
        fresh(); play(lambda: data()['urge']); page.evaluate("(() => { const d = FieldCore.get().data, u = FieldEP07Data.tuning.urgeUntil; d.clock = u - 1; d.sched = FieldEP07Data.schedule.findIndex(e => e.at >= u); })()")
        step(2); dead('URGE')
        print('PASS E: a chime with nobody; leaving while chime/exit differ fails (canon CCTV result); the invisible customer pays and leaves; then lock + empty store = safe break; unlocked / customer present fail')

        # --- 8. F returned waste item -------------------------------------------------------------------------------------
        def to_shelf():
            fresh(); play(lambda: data()['wasteAlert']); act('shelf', True); assert data()['shelfOpen']
        to_shelf(); assert '폐기 시간 03:00 경과' in page.locator('#f7-shelf').inner_text(); click('f7-reg-returned'); dead('F_REREGISTER'); assert '근무 시작 시각' in state()['reason']
        to_shelf(); click('f7-bare-returned'); dead('F_BAREHAND')
        to_shelf(); click('f7-reg-lunchbox'); assert '도시락(제육) 폐기 등록 완료' in log_text()
        click('f7-tongs-returned'); click('f7-contain'); click('f7-hq'); assert data()['f'] == 'done' and '회수 완료를 보고' in log_text()
        print('PASS F: previous shift log lists it; registering the returned item again or bare hands fail; SNS-0719 -> container -> HQ; normal expired items are registered as usual')

        # --- 9. D blank/coded POS line ---------------------------------------------------------------------------------------
        def to_ghost(force):
            fresh(force); play(lambda: data()['sched'] >= k_index(9)); serve('hq')
        to_ghost({'dTier': 5, 'ghostCode': 0}); pos_text = page.locator('#f7-pos').inner_text()
        assert '45,000' in pos_text and '(상품명 없음)' in log_text()
        act('pay', cust()['pay']); step(T['leave'] + .5); dead('D_UNREPORTED'); assert '전두엽' in state()['reason'] and '45,000원' in state()['reason']
        to_ghost({'dTier': 0, 'ghostCode': 1}); assert '8809 0719 2026 3' in page.locator('#f7-pos').inner_text()
        click('f7-hq'); assert '0050-0200으로 말씀드렸다' in log_text(); act('pay', cust()['pay']); wait_for(lambda: not data()['cust']); assert state()['status'] == 'active'
        print('PASS D: an unstocked item scans with a blank name or a bare code; unreported departure -> canon tier damage; calling 0050-0200 from the counter first survives')

        # --- 10. G dawn + full clear -----------------------------------------------------------------------------------------
        fresh({'endPresses': 3}); click('f7-app-open'); click('f7-app-end'); assert '근무 시간이 남아 있습니다' in log_text()
        play(lambda: data()['dawn']); assert '창밖: 밤' in page.locator('#f7-window').inner_text() and '교대 근무자가 오지 않는다' in log_text()
        click('f7-go-outside-main'); dead('G_OUTSIDE'); assert '잘게 뜯겨' in state()['reason']
        fresh({'endPresses': 3}); play(lambda: data()['dawn']); click('f7-app-open')
        click('f7-app-end'); click('f7-app-end'); assert state()['status'] == 'active' and log_text().count('다시 시도해 주십시오') == 2
        click('f7-app-end'); s = state(); assert s['status'] == 'cleared', s.get('reason')
        assert '밝아진다' in page.locator('#f7-window').inner_text() and '[근무 종료 처리 완료]' in page.locator('#field-outcome').inner_text()
        assert page.evaluate("FieldSave.get().cleared.includes('EP07') && FieldSave.unlocked('EP08')")
        assert not page.evaluate("FieldSave.get().cleared.includes('EP08')") and not page.evaluate("FieldSave.unlocked('EP09')")
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before, 'Story save must be untouched'
        assert page.evaluate(globals_js) == globals_before, 'J / LOOP / AUTHOR / CLASSIFIED untouched'
        hooks = page.evaluate('window.__hooks')
        assert ['onEpisodeStart', 'EP07'] in hooks and ['onEpisodeClear', 'EP07'] in hooks and all(len(h) <= 3 for h in hooks)
        assert page.evaluate("!FieldSave.get().progress?.EP07")
        print('PASS G + clear: 06:00 stays dark; walking out fails; 알바지옥 근무 종료 fails until pressed enough, then light and clear; EP08 only; Story/J/LOOP untouched; solver real time %.0fs' % s['elapsed'])

        # --- 11. Retry / save / mobile -------------------------------------------------------------------------------------
        cleared = page.evaluate("FieldSave.get().cleared.slice()")
        fresh(); click('f7-leave'); dead('DOOR_UNLOCKED'); click('field-retry'); assert state()['status'] == 'active' and data()['clock'] == 0 and page.evaluate("FieldSave.get().cleared.slice()") == cleared
        code = page.evaluate("GameSave.exportCode()"); story_code = page.evaluate("GameSave.exportStoryCode()")
        assert page.evaluate("(c) => GameSave.importCode(c)", code) and page.evaluate("FieldSave.get().cleared.includes('EP07')") and page.evaluate("GameSave.exportStoryCode()") == story_code
        page.set_viewport_size({'width': 390, 'height': 844}); fresh(); wait_for(lambda: data()['cust']); at_counter(); away()
        page.locator('#f7-glance').dispatch_event('pointerdown', {'pointerId': 1}); step(.4); page.locator('#f7-glance').dispatch_event('pointerup', {'pointerId': 1})
        assert cust()['mirrored']; tap('f7-scan-0'); tap('f7-pay-card'); wait_for(lambda: not data()['cust'])
        print('PASS retry resets only the run; v5 save round-trip; 390px touch')

        assert not errors, errors
        browser.close()
        print('ALL EP07 CHECKS PASSED')


if __name__ == '__main__':
    run()
