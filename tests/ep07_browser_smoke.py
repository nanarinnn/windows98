"""EP07 (나눔 12시 편의점 야간 근무 / convenience-store counter duty) Field browser smoke test. Requires Python
Playwright and Chromium plus the Express server:
    npm start   then   python tests/ep07_browser_smoke.py
Uses isolated browser storage and the production FieldCore.step clock (the wall clock FieldCore reads is frozen, so
only step() advances time). FieldEP07Data.random(name) is pinned: a number forces dTier (0-5) / endPresses (>=1) /
nItem (0-4) branches. No real save is read or changed.
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

        def click(id): page.locator('#' + id).click()
        def tap(id): page.locator('#' + id).tap()
        def has(id): return page.locator('#' + id).count() > 0
        def state(): return page.evaluate('FieldCore.get()')
        def data(): return state()['data']
        def log_text(): return page.locator('#field-log').inner_text()
        def step(seconds): page.evaluate('(n) => { let left = n; while (left > 0 && FieldCore.get().status === "active") { FieldCore.step(Math.min(.25, left)); left -= .25; } }', seconds)
        def labels(): return set(b.inner_text() for b in page.locator('#f7-actions button').all())
        def fresh(force=None):
            page.evaluate("""(force) => { window.__force = force || {};
                FieldEP07Data.random = name => (name in window.__force ? window.__force[name] : Math.random());
                FieldUI.close(); FieldUI.open(); }""", force or {})
            click('field-dispatch-new-EP07' if has('field-dispatch-new-EP07') else 'field-dispatch-EP07')
            assert state()['status'] == 'active' and data()['visit'] == 'N' and data()['queueIdx'] == 0
        def dead(code):
            s = state(); assert s['status'] == 'dead' and data()['failCode'] == code and s['reason'].startswith(code), (code, s['status'], data()['failCode'], s['reason'])
        def to(visit, mirror=True, **force):
            """Replay every visit correctly until the queue reaches `visit`; by default also does the target customer's
            mirror check (every customer is mirror-checked first; pass mirror=False to stop before it)."""
            fresh(force)
            guard = 0
            while data()['visit'] != visit:
                guard += 1; assert guard < 20, 'visit not reached: ' + visit
                v = data()['visit']
                if v in 'NBCD': click('f7-mirror-check')
                if v == 'N': click('f7-pay-normal')
                elif v == 'A': click('f7-mirror-check'); click('f7-mirror-away'); click('f7-pay-a')
                elif v == 'B': click('f7-id-check'); click('f7-id-same')
                elif v == 'C': click('f7-c-price')
                elif v == 'D': click('f7-hq-call'); step(data()['dTimer'] + .5)
                elif v == 'E': step(12)
                elif v == 'F': click('f7-f-tongs'); click('f7-f-contained'); click('f7-hq-call')
                assert state()['status'] == 'active', (v, state().get('reason'))
            if mirror and visit in 'BCD': click('f7-mirror-check')

        story_before = page.evaluate(f"localStorage.getItem('{STORY_KEY}')")

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

        # --- 2. The counter is the interface; no spoiler UI -------------------------------------------------------------
        page.evaluate("""(() => { window.__hooks = []; const add = (kind, fn) => FieldCore.hooks.add(kind, fn);
            add('onEpisodeStart', id => window.__hooks.push(['onEpisodeStart', id]));
            add('onMajorEvent', (id, event) => window.__hooks.push(['onMajorEvent', id, event]));
            add('onEpisodeClear', id => window.__hooks.push(['onEpisodeClear', id])); })()""")
        fresh()
        assert '전 근무일 폐기 완료 상품' in log_text() and '삼각김밥' in log_text()
        assert page.locator('.field-hud > *').count() == 3
        visible = page.locator('#f7-store').inner_text() + page.locator('.field-hud').inner_text() + page.locator('#f7-actions').inner_text()
        for secret in ['DOOR_UNLOCKED', 'LEAVE_WITH_CUSTOMER', 'MIRROR_LOCKED', 'ID_FAIL', 'VOICE_LOST', 'D_UNREPORTED', 'true', 'false', 'queueIdx', 'dTier']:
            assert secret not in visible, secret
        print('PASS UI: HUD = clock / door count / mirror hint; no internal flag, fail code or boolean on screen; disposal/app panels present')

        # --- 3. N: normal customer + rule 1 (never speak first) ----------------------------------------------------------
        fresh(); assert data()['chimes'] == 1 and data()['exits'] == 0 and any(w in log_text() for w in ['생수', '전주비빔', '아이스크림', '담배', '숙취해소제'])
        click('f7-speak-first'); dead('SPOKE_FIRST')
        # every customer is mirror-checked first: no payment before it, and a normal customer shows an ordinary aisle
        fresh(); assert not has('f7-pay-normal') and page.locator('#f7-pos').is_hidden()
        click('f7-mirror-check'); assert '평범한 매장 통로' in log_text() and data()['mirrorState'] == 'clear' and has('f7-pay-normal')
        assert '상품명:' in page.locator('#f7-pos').inner_text()
        # paying sends the customer out (exit 1) and the next visit (A) chimes in: exactly one customer inside again
        click('f7-pay-normal'); assert data()['exits'] == 1 and data()['chimes'] == 2 and data()['visit'] == 'A' and state()['status'] == 'active'
        print('PASS N: mirror check first (ordinary aisle), then a normal payment; speaking first fails; door chime/exit stay balanced')

        # --- 4. A: security mirror --------------------------------------------------------------------------------------
        to('A'); assert has('f7-mirror-check') and not has('f7-pay-a') and '손님이 들어왔다' in log_text().strip().splitlines()[-1], 'A arrives like any customer'
        click('f7-mirror-check'); assert '끝없이 반복되는 통로' in log_text() and has('f7-mirror-away') and not has('f7-mirror-check')
        step(4.5); dead('MIRROR_LOCKED'); assert '여기 알바는 거울을 좋아하나 봐요?' in state()['reason']
        to('A'); click('f7-mirror-check'); click('f7-mirror-away'); assert has('f7-pay-a')
        click('f7-pay-a'); assert state()['status'] == 'active' and data()['visit'] != 'A'
        print('PASS A: checking the mirror like the card reader screen; failing to look away in time fails with the exact quote; looking away then paying proceeds')

        # --- 5. B: moving ID card --------------------------------------------------------------------------------------
        to('B', mirror=False); assert has('f7-mirror-check') and not has('f7-id-check') and not has('f7-id-refuse')
        to('B'); assert not has('f7-id-same'); click('f7-id-refuse'); dead('ID_FAIL'); assert '판매를 거절' in state()['reason']
        to('B'); click('f7-id-check'); assert '눈을 깜빡인다' in log_text() and has('f7-id-same') and has('f7-id-startled') and has('f7-id-wrong-speed')
        click('f7-id-startled'); dead('ID_FAIL'); assert '놀란 기색' in state()['reason']
        to('B'); click('f7-id-check'); click('f7-id-wrong-speed'); dead('ID_FAIL'); assert '다른 손짓과 속도' in state()['reason']
        to('B'); click('f7-id-check'); step(7.5); dead('ID_FAIL'); assert '지연' in state()['reason']
        to('B'); click('f7-id-check'); click('f7-id-same'); assert state()['status'] == 'active' and data()['visit'] != 'B'
        print('PASS B: the ID photo blinks; refusing/starting/wrong speed/delay all fail; returning it at the same speed it was handed over proceeds')

        # --- 6. C: overlapping voice -----------------------------------------------------------------------------------
        to('C'); click('f7-c-answer'); dead('VOICE_LOST'); assert '성대' in state()['reason']
        to('C'); click('f7-c-price'); assert state()['status'] == 'active' and data()['visit'] != 'C'
        to('C'); click('f7-c-screen'); assert state()['status'] == 'active' and data()['visit'] != 'C'
        print('PASS C: a voice overlapping your own; answering aloud fails; pointing at the price tag or the screen proceeds')

        # --- 7. D: unregistered item / blank POS name -------------------------------------------------------------------
        to('D', mirror=False, dTier=5); assert page.locator('#f7-pos').is_hidden() and '코드만' not in log_text()
        step(20); assert state()['status'] == 'active', 'the D clock only starts once the barcode is scanned (after the mirror check)'
        click('f7-mirror-check'); assert '빈칸' in log_text() or '코드만' in log_text()
        assert '[ 코드만 표시 ]' in page.locator('#f7-pos').inner_text() and '45,000' in page.locator('#f7-pos').inner_text()
        step(8.5); dead('D_UNREPORTED'); assert '전두엽' in state()['reason'] and '45,000원' in state()['reason']
        to('D', dTier=0); step(8.5); dead('D_UNREPORTED'); assert '왼손 엄지손톱' in state()['reason'] and '900원' in state()['reason']
        to('D', dTier=2); click('f7-hq-call'); assert '0050-0200' in log_text() and '4,500' in log_text()
        step(8.5); assert state()['status'] == 'active' and data()['visit'] != 'D', 'reporting before the customer leaves survives'
        print('PASS D: blank/coded product name still charges correctly; unreported departure costs the body part for that price tier (0050-0200); reporting before departure survives')

        # --- 8. E: chime/exit mismatch (invisible customer) --------------------------------------------------------------
        to('E'); assert data()['chimes'] != data()['exits']
        click('f7-leave-counter'); dead('E_LEFT_DURING_MISMATCH')
        to('E'); assert '들어온 사람이 보이지 않는다' in log_text()
        step(5.5); assert '불빛' in log_text() or '봉투' in log_text()
        # the invisible customer leaves (counts match again), then the next normal customer chimes in: exactly one inside
        step(5.5); assert data()['chimes'] - data()['exits'] == 1 and data()['visit'] == 'N' and '보이지 않는 무언가' in log_text() and state()['status'] == 'active'
        print('PASS E: a chime with no visible entrant; leaving the counter during the mismatch fails; waiting resolves it (phantom POS/bag, then exit) and only then does it progress')

        # --- 9. F: a discarded item back on the shelf -----------------------------------------------------------------------
        to('F'); assert '삼각김밥' in log_text() and '폐기 처리를 마친 상품' in log_text()
        click('f7-f-barehand'); dead('F_BAREHAND')
        to('F'); click('f7-f-reregister'); dead('F_REREGISTER'); assert '이름과 근무 시작 시각' in state()['reason']
        to('F'); click('f7-f-contained'); assert state()['status'] == 'active' and data()['fStage'] == '', 'the container is useless before the tongs'
        click('f7-f-tongs'); assert data()['fStage'] == 'tongs'
        click('f7-f-contained'); assert data()['fStage'] == 'contained'
        click('f7-hq-call'); assert state()['status'] == 'active' and data()['visit'] == 'G'
        print('PASS F: SNS-0719 tongs -> container -> HQ report clears it; bare hands and re-registering for disposal both fail in canon-specific ways; order is enforced')

        # --- 10. G: 06:00, no dawn, no relief --------------------------------------------------------------------------------
        to('F'); click('f7-f-tongs'); click('f7-f-contained'); click('f7-hq-call'); assert data()['visit'] == 'G'
        assert '창밖이 밝아지지 않고' in log_text()
        click('f7-go-outside'); dead('G_OUTSIDE'); assert '잘게 뜯겨' in state()['reason']
        to('F', endPresses=3); click('f7-f-tongs'); click('f7-f-contained'); click('f7-hq-call'); assert data()['visit'] == 'G'
        click('f7-app-open'); assert has('f7-app-end')
        click('f7-app-end'); assert data()['gPresses'] == 1 and state()['status'] == 'active' and '오류' in log_text()
        click('f7-app-end'); assert data()['gPresses'] == 2 and state()['status'] == 'active'
        click('f7-app-end'); assert state()['status'] == 'cleared'
        print('PASS G: going outside fails; opening 알바지옥 and pressing 근무 종료 fails a few times before it finally takes and clears the shift')

        # --- 11. Leaving the counter: no customer -> lock the auto door -> go (rules 1/2) ---------------------------------
        fresh(); click('f7-leave-counter'); dead('LEAVE_WITH_CUSTOMER'); assert '기록 중단' in state()['reason']
        to('B'); click('f7-leave-counter'); dead('LEAVE_WITH_CUSTOMER')
        fresh(); click('f7-lock-door'); assert not data()['doorLocked'] and '손님이 있다' in log_text(), 'cannot lock with a customer inside'
        to('F'); click('f7-leave-counter'); dead('DOOR_UNLOCKED'); assert '이름표' in state()['reason'] and '부위별로 나뉜' in state()['reason']
        to('F'); click('f7-lock-door'); assert data()['doorLocked'] and '잠김' in page.locator('#f7-door').inner_text() and not has('f7-lock-door')
        click('f7-leave-counter'); assert state()['status'] == 'active' and not data()['doorLocked'] and '잠금을 해제' in log_text()
        to('E'); click('f7-lock-door'); assert data()['doorLocked']; click('f7-leave-counter'); dead('E_LEFT_DURING_MISMATCH')
        print('PASS leave-counter: with a customer inside = record interrupted; unlocked door = canon name-tag result; empty store + locked door = safe return; locking does not excuse an E mismatch')

        # --- 12. Full clear: EP08 unlock only in Field, Story untouched, hooks ----------------------------------------------
        to('F', endPresses=1); click('f7-f-tongs'); click('f7-f-contained'); click('f7-hq-call'); assert data()['visit'] == 'G'
        click('f7-app-open'); click('f7-app-end')
        s = state(); assert s['status'] == 'cleared', (s['status'], s.get('reason'), data())
        assert page.evaluate("FieldSave.get().cleared.includes('EP07') && FieldSave.unlocked('EP08')")
        assert not page.evaluate("FieldSave.get().cleared.includes('EP08')") and not page.evaluate("FieldSave.unlocked('EP09')")
        click('field-list'); assert page.locator('#field-dispatch-EP08').inner_text() == '연결 준비 중' and page.locator('#field-dispatch-EP08').is_disabled()
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before, 'Story save must be untouched'
        assert page.evaluate("!FieldSave.get().progress?.EP07"), 'EP07 does not persist mid-run snapshots'
        hooks = page.evaluate('window.__hooks')
        assert ['onEpisodeStart', 'EP07'] in hooks and ['onEpisodeClear', 'EP07'] in hooks and any(h[0] == 'onMajorEvent' and h[1] == 'EP07' for h in hooks) and all(len(h) <= 3 for h in hooks)
        print('PASS full clear: EP08 Field-only unlock; EP09 not unlocked; Story save byte-identical; AUTHOR hooks (ids only); no mid-run EP07 snapshot')

        # --- 13. Save Code v5 round-trip (existing Story/Field codec regression) --------------------------------------------
        code = page.evaluate("GameSave.exportCode()"); story_code = page.evaluate("GameSave.exportStoryCode()")
        assert page.evaluate("(c) => GameSave.importCode(c)", code)
        assert page.evaluate("FieldSave.get().cleared.includes('EP07')") and page.evaluate("GameSave.exportStoryCode()") == story_code, 'v4 Story codec unchanged'
        print('PASS save: v5 export/import round-trip unaffected; v4 Story code unchanged')

        # --- 14. Mobile touch: core interactions work with tap() instead of click() ------------------------------------------
        fresh(); tap('f7-mirror-check'); tap('f7-pay-normal'); assert data()['exits'] == 1 and state()['status'] == 'active'
        to('A'); tap('f7-mirror-check'); tap('f7-mirror-away'); tap('f7-pay-a'); assert state()['status'] == 'active' and data()['visit'] != 'A'
        to('F'); tap('f7-lock-door'); tap('f7-leave-counter'); assert state()['status'] == 'active'
        print('PASS mobile: payment, door lock/leave, mirror-check/look-away/pay and the rest of the primary controls are plain tap targets')

        assert not errors, errors
        browser.close()
        print('ALL EP07 CHECKS PASSED')


if __name__ == '__main__':
    run()
