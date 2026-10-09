"""EP09 (안전 안내 문자 / the phone itself is the play space) Field browser smoke test. Requires Python Playwright and
Chromium plus the Express server:
    npm start   then   python tests/ep09_browser_smoke.py
Uses isolated browser storage and the production FieldCore.step clock (the wall clock FieldCore reads is frozen, so
only step() advances time). FieldEP09Data.random(name) is pinned per run (see DEFAULT) unless forced.
No real save is read or changed.
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')
STORY_KEY = 'yuyeon98.save.v1'
# aAnswer .9 = nobody picks up; bill 0 = 9,800원; gDir 0 = front; h1..h3 0 = taken from behind; codes from fractions.
DEFAULT = {'aAnswer': .9, 'bill': 0, 'fApp': 0, 'fIcon': 0, 'fSlot': .5, 'gDir': 0, 'h1': 0, 'h2': 0, 'h3': 0,
           'jWho': 0, 'code1': .1, 'code2': .2, 'code3': .3, 'rescue': 0, 'repeat': 0}


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                    headless=True, args=['--no-sandbox'])
        page = browser.new_context(viewport={'width': 1280, 'height': 900}, has_touch=True).new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/?devunlock=0', wait_until='load')
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")
        page.evaluate("window.__pn = performance.now(); performance.now = () => window.__pn")
        T = page.evaluate('FieldEP09Data.tuning')
        D = page.evaluate('({ dirs: FieldEP09Data.dirs, opposite: FieldEP09Data.opposite, angles: FieldEP09Data.angles, missed: FieldEP09Data.missedNumbers, contacts: FieldEP09Data.contacts })')

        def click(id): page.locator('#' + id).click()
        def tap(id): page.locator('#' + id).tap()
        def has(id): return page.locator('#' + id).count() > 0
        def state(): return page.evaluate('FieldCore.get()')
        def data(): return state()['data']
        CUR = ['']
        def evs(): return data()['evs']
        def ev(kind=None):
            k = kind or CUR[0]
            return next((e for e in evs() if e['kind'] == k), {}) if k else (evs()[0] if evs() else {})
        def log_text(): return page.locator('#field-log').inner_text()
        def step(seconds): page.evaluate('(n) => { let left = n; while (left > 0 && FieldCore.get().status === "active") { FieldCore.step(Math.min(.25, left)); left -= .25; } }', seconds)
        def fresh(**force):
            page.evaluate("""(force) => { window.__force = force;
                FieldEP09Data.random = name => (name in window.__force ? window.__force[name] : 0);
                FieldUI.close(); FieldUI.open(); }""", dict(DEFAULT, **force))
            click('field-dispatch-EP09')
            assert state()['status'] == 'active' and data()['app'] == 'home'
        def dead(code):
            s = state(); assert s['status'] == 'dead' and data()['failCode'] == code, (code, s['status'], data()['failCode'], s.get('reason'))
            return s['reason']
        def home():
            if data()['app'] != 'home': click('f9-home')
        def open_app(app): home(); click('f9-app-' + app)
        def open_thread(tid): open_app('messages'); click('f9-thread-' + tid)
        def wait_kind(kind, limit=120):
            n = 0
            while ev().get('kind') != kind:
                n += 1; assert n < limit * 4 and state()['status'] == 'active', ('waiting for', kind, ev(), state().get('reason'))
                step(.25)
        def dial(number):
            open_app('phone'); page.locator('#f9-dial').fill(number); click('f9-call')
        def camera(mode='photo', lens='rear', zoom=1):
            open_app('camera'); click('f9-mode-' + mode); click('f9-lens-' + lens); click('f9-zoom-%d' % zoom)

        def hold(): page.evaluate('FieldCore.get().data.nextIn = 9999')   # no further offers while a timeout is tested
        def solve_kind(k):
            """Resolve one running situation of kind k correctly through the phone UI."""
            e = ev(k)
            if not e: return
            if k == 'A':
                if e['phase'] == 'wait': dial(e['number'])
                elif e['phase'] == 'ringing': step(.5)
                else: click('f9-hangup')
            elif k == 'B':
                page.locator('#f9-stare').focus(); page.keyboard.down(' '); step(T['stareHold'] + .3); page.keyboard.up(' ')
            elif k == 'C':
                open_thread('carrier'); page.locator('[id^=f9-pay-open-]').last.click(); click('f9-pay')
            elif k == 'D':
                while not (ev('D').get('n') == 5 and ev('D').get('phase') == 'cut'): step(.25)
                click('f9-reject')
            elif k == 'F':
                open_app('settings'); click('f9-settings-apps'); click('f9-appinfo-strange')
                for i in range(5):
                    if ev('F'): click('f9-perm-%d' % i)
            elif k == 'G':
                open_app('flashlight'); click('f9-level-3')
                if not data()['light']['on']: click('f9-light')
                click('f9-face-' + data()['entity']['dir']); camera(); click('f9-shutter')
            elif k == 'H':
                click('f9-face-' + D['opposite'][e['angle']]); camera(zoom=2); click('f9-shutter')
            elif k == 'I':
                camera('video', 'front'); click('f9-record'); step(T['selfieLen'] + .3)
            elif k == 'J':
                click('f9-j-close'); step(2.3); click('f9-j-close')
            elif k == 'K':
                if e['phase'] == 'ringing': click('f9-reject')
                elif e['phase'] == 'sms': step(T['kSmsWait'] + .3)
                else: click('f9-hangup')
            assert state()['status'] in ('active', 'cleared'), (k, state().get('reason'))

        def solve_one():
            """Resolve something that is running (screen-taking ones first, then the most urgent)."""
            running = [e['kind'] for e in evs()]
            if not running: return step(.25)
            order = ['B', 'D', 'J', 'K', 'G', 'A', 'H', 'C', 'I', 'F']
            solve_kind(sorted(running, key=order.index)[0])

        def to(kind, **force):
            """Play correctly until `kind` starts; everything else running beside it is resolved first."""
            fresh(**force); CUR[0] = kind
            n = 0
            while not ev(kind):
                n += 1; assert n < 8000, 'not reached: ' + kind
                solve_one() if evs() else step(.25)
            n = 0
            while any(e['kind'] != kind for e in evs()):
                n += 1; assert n < 50
                solve_kind([e['kind'] for e in evs() if e['kind'] != kind][0])
            if kind == 'A' and ev('A').get('phase') != 'wait': raise AssertionError('A already handled')

        story_before = page.evaluate(f"localStorage.getItem('{STORY_KEY}')")
        story_phone_before = page.evaluate("document.getElementById('mobile-phone-view').outerHTML")
        story_phase_before = page.evaluate("phoneCurrentPhase")

        # --- 0. Rule document: reviewed transcript -> 9화.txt -> Story window -> Field safety-text thread -------------------
        story_doc = page.evaluate("document.querySelector('#darkwebReportWindowEP9 textarea').value").replace('\r\n', '\n').strip()
        txt = (ROOT / '9화.txt').read_text(encoding='utf-8').replace('\r\n', '\n').strip()
        assert story_doc == txt, 'index.html Story window must equal 9화.txt'
        transcript = (ROOT / 'docs/transcripts/reviewed/EP09_안전_안내_문자.txt').read_text(encoding='utf-8-sig')
        flat = lambda v: re.sub(r'\s+', ' ', v)
        for marker in ['귀하는 금일 수신한 통화로 관리 대상자로 분류되었습니다', '신체 결손, 사망, 실종 등 치명적인 결과',
                       '본 안내 문자를 제외한 휴대전화로 연락이 오는 모든 것을 비정상 개체로 간주합니다', '일체의 상황에 대해 본부는 책임을 지지 않습니다',
                       '기재된 번호로 반드시 발신하십시오', '연결되지 않더라도 발신 기록이 남는 것으로 충분합니다', '아무 말도 하지 마시고 즉시 종료하여 주십시오',
                       '익일 다양한 형태로 사망하는 사례가 다수 확인되었습니다', '수신을 받지도 거절하지도 마시고 화면 속 남자의 눈을 계속 응시하십시오',
                       '유리에 얼굴을 바짝 붙인 기괴할 정도로 눈이 큰 남성', '원인 불명의 쇼크로 사망', '통신사 명의로 요금 미납 안내 문자',
                       '즉시 납부 기능을 이용해 결제하여 주십시오', '3분 이내에 결제가 완료되지 않을 시 미납 금액에 따라 귀하의 신체로 대신 납부됩니다',
                       '1만원 이하 왼쪽 귀', '2만원 이하 양쪽 귀와 오른쪽 엄지발가락', '3만원 이하 머리카락과 양손의 손톱', '5만원 미만 왼손, 오른발',
                       '5만원 이상 해당 정보는 검열되었습니다', '다섯 번째 비명이 끊겼을 때 수신 거절을 눌러 주십시오', '여섯 번째 비명을 들은 대상자',
                       '양쪽 고막이 완전히 파열되어 청각을 상실', '해당 항목은 삭제되었습니다', '설정에서 해당 앱의 모든 권한을 해제하십시오',
                       '알파벳과 숫자가 뒤섞인 채로', '같은 모양의 아이콘을 가진 앱이 두 개 이상 있을 경우 반드시 이름을 확인하여 주십시오',
                       '해당 통화를 받고 이동한 이들이 실종되는 사례', '손전등 기능을 켜서 소리가 나는 방향을 비추십시오', '손전등의 강도에 따라 빛이 닿는 거리는 바뀝니다',
                       '빛을 비추며 그것을 정확히 촬영하십시오', '배터리의 잔량이 줄어들수록 비정상 상황의 발생 주기가 짧아지며',
                       '잔량이 완전히 소진된 대상자에 대한 정보는 파악하지 못했습니다', '사진에 찍힌 각도의 정반대 방향을 확대 촬영하십시오',
                       '뒤에서 촬영된 사진이라면 그것은 귀하의 앞에 있습니다', '사진은 세 차례 전송되며', '해당 사진은 어떠한 경우에도 삭제하지 마십시오',
                       '네 번째 사진이 전송되며 이와 동시에 대상자는 실종됩니다', '임의로 사진 촬영을 멈출 수 없습니다', '귀하의 얼굴을 5분간 촬영하여 주십시오',
                       '저장된 사진과 동영상은 어떠한 경우에도 확인하지 마십시오', '해당 파일은 실제가 아닙니다', '가족이나 지인과 동일한 외형',
                       '특별재난관리본부에서 보호 중임을 명심하여 주십시오', '그들을 위험한 상황에 처하도록 하는 사례가 다수 있었습니다', '0050-0200',
                       '현재 위치를 즉시 파악 가능한 시스템을 구축하여 항시 대비하고 있습니다', '테러리스트 세력임을 명심하여 주십시오',
                       '세 번째로 온 인증 번호를 본 안내 문자에 입력하여 주십시오', '정확히 전송되어야만 구출 작업이 가능합니다',
                       '소요 시간은 대상자마다 달라 사전에 고지가 불가능', '요원이 도착할 때까지 위 사항을 계속하여 지켜 주십시오',
                       '위 사항을 숙지한 귀하께서는 반드시 생존할 수 있습니다']:
            assert marker in flat(txt), marker
            assert marker in flat(transcript), 'marker not in transcript: ' + marker
        headings = re.findall(r'^■ 상황 ([A-Z])', txt, re.M)
        assert headings == list('ABCDEFGHIJKL'), headings
        e_block = txt.split('■ 상황 E')[1].split('■ 상황 F')[0].strip()
        assert e_block == '- 해당 항목은 삭제되었습니다.', 'E stays deleted: ' + e_block
        for forbidden in ['문서 번호', '긴급통신-2026-EMERGENCY-SMS', '개정', '시행 일자', '0050-0으로', '문자 폭탄', '최종 탈출']:
            assert forbidden not in txt, forbidden
        assert page.evaluate("EPISODE_DOCS[9]") == '' and page.evaluate("EPISODE_TITLES[9]") == '안전 안내 문자'
        assert page.evaluate("CLUES.filter(c => c.ep === 9).every(c => document.querySelector('#darkwebReportWindowEP9 textarea').value.includes(c.quote))")
        assert page.evaluate("runEpisode(9).lines[0]") == '> EP.09 안전 안내 문자'
        print('PASS 0 rule document: 9화.txt == Story window; A~L in transcript order, E only deleted; every rule/consequence from the reviewed transcript; no document number; clue quotes valid')

        # --- 1. Unlock -------------------------------------------------------------------------------------------------------
        click('field-open')
        assert page.locator('#field-dispatch-EP09').inner_text() == '연결 제한' and page.locator('#field-dispatch-EP09').is_disabled()
        page.evaluate("for (const id of ['EP01','EP02','EP03','EP04','EP05','EP06','EP07']) FieldSave.clear(id, { patrols: {}, elapsed: 700, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP09').inner_text() == '연결 제한', 'EP09 stays locked until EP08 is cleared'
        page.evaluate("FieldSave.clear('EP08', { patrols: {}, elapsed: 300, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP09').inner_text() == '파견 가능' and not page.locator('#field-dispatch-EP09').is_disabled()
        assert page.locator('#field-dispatch-EP10').inner_text() == '연결 제한'
        print('PASS 1 EP09 locked until EP08 clear, then dispatchable; EP10 still locked')

        # --- 2. Phone UI ---------------------------------------------------------------------------------------------------
        page.evaluate("""(() => { window.__hooks = []; const add = (kind, fn) => FieldCore.hooks.add(kind, fn);
            add('onEpisodeStart', id => window.__hooks.push(['onEpisodeStart', id]));
            add('onMajorEvent', (id, event) => window.__hooks.push(['onMajorEvent', id, event]));
            add('onEpisodeClear', id => window.__hooks.push(['onEpisodeClear', id])); })()""")
        fresh()
        for app in ['phone', 'messages', 'settings', 'camera', 'photos', 'video', 'flashlight']:
            assert has('f9-app-' + app), app
        assert re.match(r'^\d{2}:\d{2}$', page.locator('#f9-time').inner_text()) and page.locator('#f9-battery').inner_text() == '%d%%' % T['startBattery']
        open_thread('safety')
        assert page.locator('#f9-rules').inner_text().strip() == txt, 'the safety-text thread shows the same document'
        visible = page.locator('#fieldWindow').inner_text()
        for secret in ['A_NO_CALL', 'B_LOOKAWAY', 'C_UNPAID', 'NO_DATA', 'true', 'false', 'undefined', '상황 A 발생']:
            assert secret not in visible, secret
        assert page.locator('#fieldWindow [id^="phone-"]').count() == 0, 'Field phone ids never collide with the Story PDA'
        assert page.locator('#mobile-phone-view [id^="f9-"]').count() == 0
        print('PASS UI: home/phone/messages/settings/camera/photos/video/flashlight; status bar time+battery; safety thread = rule document; no flag/fail code; f9- ids only')

        # --- A ---------------------------------------------------------------------------------------------------------------
        to('A'); assert ev()['number'] == D['missed'][0] and '부재중' in log_text()
        dial(ev()['number']); assert ev()['phase'] == 'ringing' and data()['calls'][0]['dir'] == 'out'
        step(T['noAnswerRing'] + .3); assert not ev('A') and 'A' in data()['resolved'] and state()['status'] == 'active'
        to('A', aAnswer=.1); dial(ev()['number']); step(T['ringBeforeAnswer'] + .1); assert ev()['phase'] == 'answered'
        click('f9-hangup'); assert 'A' in data()['resolved']
        to('A', aAnswer=.1); dial(ev()['number']); step(T['ringBeforeAnswer'] + .1); click('f9-speak'); dead('A_SPOKE')
        to('A', aAnswer=.1); dial(ev()['number']); step(T['ringBeforeAnswer'] + T['hangupLimit'] + .3); dead('A_LINGER')
        to('A'); dial('010-0000-1111'); assert ev()['phase'] == 'wait', 'another number is not the callback'
        step(T['callbackLimit'] + .3); assert '익일 다양한 형태로 사망' in dead('A_NO_CALL')
        print('PASS A: callback to the listed number (unanswered = call record is enough); picked up -> silent immediate hang-up; speaking/lingering/no call fail')

        # --- B ---------------------------------------------------------------------------------------------------------------
        to('B'); assert has('f9-vc-video') and page.locator('#f9-vc-video').get_attribute('src') == 'movies/ep9_event_video.mp4'
        click('f9-answer'); dead('B_ANSWER')
        to('B'); click('f9-reject'); dead('B_REJECT')
        to('B'); step(T['stareStart'] + .3); assert '원인 불명의 쇼크로 사망' in dead('B_LOOKAWAY')
        to('B'); page.locator('#f9-stare').focus(); page.keyboard.down(' '); step(2); page.keyboard.up(' '); step(T['lookAwayGrace'] + .3); dead('B_LOOKAWAY')
        to('B'); page.locator('#f9-stare').focus(); page.keyboard.down(' '); step(1); page.evaluate("FieldCore.action('home')"); page.keyboard.up(' '); dead('B_LOOKAWAY')
        to('B'); page.locator('#f9-stare').focus(); page.keyboard.down(' '); step(T['stareHold'] + .3); page.keyboard.up(' ')
        assert 'B' in data()['resolved'] and state()['status'] == 'active' and not has('f9-vc-video')
        print('PASS B: video already playing; receive fail, reject fail, not staring/looking away/leaving the screen fail; hold-to-stare until it ends passes')

        # --- C ---------------------------------------------------------------------------------------------------------------
        tiers = page.evaluate("[10000, 10001, 20000, 20001, 30000, 30001, 49999, 50000].map(FieldEP09Data.tierOf)")
        assert tiers == [0, 1, 1, 2, 2, 3, 3, 4], tiers
        parts = page.evaluate('FieldEP09Data.billParts')
        assert parts == ['왼쪽 귀', '양쪽 귀와 오른쪽 엄지발가락', '머리카락과 양손의 손톱', '왼손, 오른발', '해당 정보는 검열되었습니다.']
        to('C'); assert ev()['amount'] == 9800
        open_thread('carrier'); page.locator('[id^=f9-pay-open-]').last.click(); step(T['billLimit'] / 2)
        left = page.locator('#f9-pay-left').inner_text(); assert re.match(r'^1:\d\d$', left), left   # the canon 3 minutes, compressed
        click('f9-pay'); assert 'C' in data()['resolved'] and state()['status'] == 'active'
        for idx in range(5):
            to('C', bill=idx); step(T['billLimit'] + .3); reason = dead('C_UNPAID'); assert parts[idx] in reason, (idx, reason)
        print('PASS C: carrier bill paid via 즉시 납부 inside the (compressed) 3 minutes; unpaid -> exact amount-bracket body part, 5만원 이상 censored')

        # --- D ---------------------------------------------------------------------------------------------------------------
        to('D'); click('f9-answer'); assert '청각을 상실' in dead('D_ANSWER')
        to('D')
        while ev().get('n') != 3: step(.25)
        click('f9-reject'); dead('D_EARLY')
        to('D')
        while not (ev().get('n') == 5 and ev().get('phase') == 'scream'): step(.25)
        click('f9-reject'); dead('D_EARLY')
        to('D')
        while not (ev().get('n') == 5 and ev().get('phase') == 'cut'): step(.25)
        step(T['screamGap'] + .1); assert '여섯 번째 비명' in dead('D_SIXTH')
        to('D')
        while not (ev().get('n') == 5 and ev().get('phase') == 'cut'): step(.25)
        assert '어디선가 들어 본 듯한 목소리' in log_text()
        click('f9-reject'); assert 'D' in data()['resolved'] and state()['status'] == 'active'
        print('PASS D: reject exactly when the fifth scream cuts; answering, rejecting early (incl. during the 5th) or hearing the 6th fail')

        # --- E ---------------------------------------------------------------------------------------------------------------
        to('G'); assert 'E' in data()['resolved'] and '확인된 비정상 상황 E.\n[해당 항목은 삭제되었습니다.]' in page.evaluate("FieldCore.get().logs.map(l => l.message).join('\\n')")
        assert page.evaluate("Object.keys(FieldEP09Data.failures).every(k => !k.startsWith('E_'))") and page.evaluate("!('E' in FieldEP09Data.text)")
        print('PASS E: only shown as deleted (no event, no failure, no mechanic)')

        # --- F ---------------------------------------------------------------------------------------------------------------
        to('F'); home()
        apps = page.evaluate("FieldCore.get().data.apps.map(a => [a.id, a.icon, a.name])")
        strange = [a for a in apps if a[0] == 'strange'][0]
        assert any(a[1] == strange[1] and a[0] != 'strange' for a in apps), 'the unknown app shares an icon with a normal app'
        assert re.search(r'[0-9]', strange[2]) and re.search(r'[A-Za-z]', strange[2])
        page.locator('#f9-app-strange').click(); assert ev('F'), 'opening it does nothing'
        open_app('settings'); click('f9-settings-apps'); click('f9-appinfo-camera'); click('f9-uninstall'); assert state()['status'] == 'active'
        click('f9-back'); click('f9-appinfo-strange'); click('f9-uninstall'); dead('F_DELETE')
        to('F'); hold(); step(T['permLimit'] + .3); assert '실종되는 사례' in dead('F_KEPT')
        to('F'); open_app('settings'); click('f9-settings-apps'); click('f9-appinfo-strange')
        for i in range(4): click('f9-perm-%d' % i)
        assert ev('F'), 'every permission must be revoked'
        click('f9-perm-4'); assert 'F' in data()['resolved'] and state()['status'] == 'active'
        print('PASS F: same-icon twin, name is the tell; deleting fails, keeping permissions fails, revoking all permissions in Settings passes')

        # --- G ---------------------------------------------------------------------------------------------------------------
        to('G', gDir=1); assert data()['dark'] and data()['entity']['dir'] == 'left' and '왼쪽' in page.locator('#f9-env').inner_text()
        camera(); click('f9-shutter'); assert ev('G') and '어둠만 찍혔다' in log_text()
        open_app('flashlight'); click('f9-level-1'); click('f9-light'); click('f9-face-left')
        dist = data()['entity']['dist']; step(T['crawlStep'] + .3); assert data()['entity']['dist'] == dist - 1, 'level-1 light does not reach that far'
        click('f9-level-3'); dist = data()['entity']['dist']; step(T['crawlStep'] * 2); assert data()['entity']['dist'] == dist, 'lit: it cannot move'
        click('f9-face-right'); step(T['crawlStep'] + .3); assert data()['entity']['dist'] == dist - 1, 'light pointed the wrong way'
        click('f9-face-left'); camera(); click('f9-shutter'); assert 'G' in data()['resolved'] and not data()['dark']
        to('G'); step(T['crawlStep'] * T['startDistance'] + 1); dead('G_REACHED')
        print('PASS G: dark + crawling sound direction; flashlight on, pointed at the sound, strong enough to reach stops it; photo while lit passes')

        # --- H ---------------------------------------------------------------------------------------------------------------
        to('H', h1=0, h2=1, h3=2); assert ev()['angle'] == 'back' and '뒤에서 찍은 사진' in log_text()
        click('f9-face-back'); camera(zoom=2); click('f9-shutter'); assert ev('H') and '아무것도 찍히지 않았다' in log_text()
        click('f9-face-front'); click('f9-zoom-1'); click('f9-shutter'); assert ev('H'), 'it must be a zoomed shot'
        step(T['photoGap'] + .1); assert ev()['n'] == 2 and ev()['angle'] == 'left'
        click('f9-face-right'); click('f9-zoom-2'); click('f9-shutter'); assert 'H' in data()['resolved']
        fixed = [i for i in data()['items'] if i.get('fixed')]; assert len(fixed) == 1
        open_app('photos'); click('f9-item-' + fixed[0]['id']); assert data()['app'] == 'viewer'
        click('f9-del-' + fixed[0]['id']); dead('H_DELETED')
        to('H'); step(T['photoGap'] * 3 + .3); reason = dead('H_MISSING'); assert '네 번째 사진' in reason and '실종' in reason
        print('PASS H: photo angle -> opposite direction, zoomed shot fixes it; wrong way/unzoomed miss; the fixed photo cannot be deleted; no hit by the 3rd -> 4th photo, missing')

        # --- I ---------------------------------------------------------------------------------------------------------------
        to('I'); step(T['shutterGap'] * 2 + .1); assert '찰칵' in log_text() and any(i.get('iFile') for i in data()['items'])
        auto = [i for i in data()['items'] if i.get('iFile')][0]
        open_app('photos'); click('f9-item-' + auto['id']); dead('I_VIEWED')
        to('I'); step(T['iStartLimit'] + .3); dead('I_NO_VIDEO')
        to('I'); camera('video', 'rear'); click('f9-record'); step(T['selfieLen'] + .3); assert ev('I'), 'rear camera: no face'
        click('f9-record'); click('f9-lens-front'); click('f9-record'); step(T['selfieLen'] / 2); click('f9-record'); assert ev('I'), 'stopped early'
        click('f9-record'); step(T['selfieLen'] / 2)
        assert page.locator('#f9-rec-time').inner_text().strip().startswith('● 02:'), page.locator('#f9-rec-time').inner_text()
        step(T['selfieLen'] / 2 + .3); assert 'I' in data()['resolved']
        video = [i for i in data()['items'] if i['kind'] == 'video' and i.get('iFile')][-1]
        open_app('video'); assert has('f9-item-' + video['id']), 'the saved video is listed'
        click('f9-item-' + video['id']); dead('I_VIEWED')
        print('PASS I: shutter sounds + auto photos; video mode, front camera, 5 minutes (compressed) passes; rear/short does not count; opening saved files fails')

        # --- J ---------------------------------------------------------------------------------------------------------------
        for btn, code in [('f9-j-call', 'J_CONTACT'), ('f9-j-reply', 'J_CONTACT'), ('f9-j-move', 'J_MOVE'), ('f9-j-location', 'J_SEND_LOC')]:
            to('J'); assert data()['overlay'] == 'autoVideo' and data()['app'] == 'video'; click(btn); dead(code)
        to('J'); click('f9-j-close'); dial(D['contacts'][0]['number']); assert '위험한 상황' in dead('J_CONTACT')
        to('J')
        while 'j' not in data()['threads']: step(.25)
        click('f9-j-close'); open_thread('j'); page.locator('#f9-reply').fill('괜찮아?'); click('f9-reply-send'); dead('J_CONTACT')
        to('J'); click('f9-j-close'); assert data()['overlay'] == ''; step(2.3); assert data()['overlay'] == 'autoVideo', 'it runs again by itself'
        step(T['jLen'] + .3); assert 'J' in data()['resolved']
        print('PASS J: auto-playing video; calling/replying/moving/sending location as asked fail (calling a family member too); closing or letting it end passes')

        # --- K ---------------------------------------------------------------------------------------------------------------
        to('K'); assert '0050-0200' in page.locator('#f9-overlay').inner_text()
        click('f9-answer'); click('f9-tell-location'); dead('K_LOCATION')
        to('K'); click('f9-answer'); click('f9-share-location'); dead('K_LOCATION')
        to('K'); click('f9-reject'); open_thread('hq'); click('f9-send-location'); dead('K_LOCATION')
        to('K'); step(T['kRing'] + .3); open_thread('hq'); page.locator('#f9-reply').fill('집이에요'); click('f9-reply-send'); dead('K_LOCATION')
        to('K'); click('f9-answer'); click('f9-hangup'); assert 'K' in data()['resolved']
        to('K'); click('f9-reject'); step(T['kSmsWait'] + .3); assert 'K' in data()['resolved'] and state()['status'] == 'active'
        print('PASS K: 0050-0200 "agent" asking for the location; telling/sharing/sending it fails; hanging up silently or ignoring passes')

        # --- async: two situations at once, compat table, never a screen-taker beside another --------------------------
        fresh(); CUR[0] = ''
        n = 0
        while not ev('C'):
            n += 1; assert n < 400
            if ev('A') and ev('A')['phase'] != 'wait': solve_kind('A')
            step(.25)
        assert ev('A') and ev('A')['phase'] == 'wait' and len(evs()) == 2, 'C arrives while the A callback is still pending'
        dial(ev('A')['number']); step(T['noAnswerRing'] + .3); assert not ev('A') and ev('C')
        open_thread('carrier'); page.locator('[id^=f9-pay-open-]').last.click(); click('f9-pay'); assert not evs() and state()['status'] == 'active'
        M = 'FieldCore.mission("EP09")'
        for kind, others, ok in [('B', [], True), ('B', ['A'], False), ('D', ['C'], False), ('C', ['A'], True), ('H', ['G'], True), ('I', ['G'], False),
                                 ('C', ['A', 'F'], False), ('A', ['J'], False), ('F', ['C'], True)]:
            got = page.evaluate(f"(o) => {M}.canStart({{ evs: o.map(k => ({{ kind: k }})) }}, '{kind}')", others)
            assert got == ok, (kind, others, got)
        print('PASS async: A callback + C bill run together; at most two, only compatible pairs, screen-taking ones only alone')

        # --- L spread over the run + rescue ---------------------------------------------------------------------------------
        fresh(); CUR[0] = ''
        codes = data()['codes']; assert len(set(codes)) == 3 and data()['codesSent'] == 0
        def play_until(cond, limit=9000):
            n = 0
            while not cond():
                n += 1; assert n < limit and state()['status'] == 'active', (state().get('reason'), evs())
                solve_one() if evs() else step(.25)
        play_until(lambda: data()['codesSent'] >= 1 and not data()['overlay']); assert data()['stageNo'] >= 3 and 'code1' in data()['threads']
        open_thread('safety'); page.locator('#f9-reply').fill(codes[0]); click('f9-reply-send')
        assert data()['rescue'] == 'none' and '인증 번호가 정확하지 않습니다' in log_text() and state()['status'] == 'active'
        play_until(lambda: data()['codesSent'] >= 2); s2 = data()['stageNo']
        play_until(lambda: data()['codesSent'] >= 3 and not data()['overlay']); assert data()['stageNo'] > s2
        open_thread('safety'); page.locator('#f9-reply').fill(codes[1]); click('f9-reply-send'); assert data()['rescue'] == 'none'
        page.locator('#f9-reply').fill(codes[2]); click('f9-reply-send')
        d = data(); assert d['rescue'] == 'inProgress' and state()['status'] == 'active'
        hud = page.locator('#f9-rescue').inner_text(); assert hud == '[구조 작업 진행 중] [위치 확인 완료]', hud
        rescue_ui = page.locator('.field-hud').inner_text() + '\n' + '\n'.join(page.locator('.f9-msg').all_inner_texts())
        assert not re.search(r'\d+\s*(초|분)|남은|ETA', rescue_ui), 'no fixed countdown: ' + rescue_ui
        page.evaluate("FieldCore.get().data.rescueLeft = 0")
        step(.5); assert state()['status'] == 'active' and data()['rescue'] == 'inProgress', 'no instant clear: more situations come first'
        play_until(lambda: data()['rescue'] == 'arrived')
        assert data()['rescueResolved'] >= data()['rescueNeed'] >= 1 and '신호가 잠깐 끊겼다' in log_text()
        assert 'f9-off' in page.locator('#f9-phone').get_attribute('class') and state()['status'] == 'active'
        step(T['blackout'] + .3); s = state(); assert s['status'] == 'cleared', s.get('reason')
        assert '[FIELD OBSERVATION COMPLETE]' in page.locator('#field-outcome').inner_text()
        save = page.evaluate('FieldSave.get()')
        assert 'EP09' in save['cleared'] and page.evaluate("FieldSave.unlocked('EP10')") and 'EP10' not in save['cleared']
        click('field-list'); assert page.locator('#field-dispatch-EP10').inner_text() in ('연결 준비 중', '파견 가능')
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before, 'Story save untouched'
        hooks = page.evaluate('window.__hooks')
        assert ['onEpisodeClear', 'EP09'] in hooks and all(len(h) <= 3 and all(isinstance(x, str) for x in h) for h in hooks)
        assert {'A_MISSED_CALL', 'B_VIDEO_CALL', 'L_AUTH_CODE', 'RESCUE'} <= {h[2] for h in hooks if h[0] == 'onMajorEvent'}
        print('PASS L: three unrequested codes arrive spread over the run; 1st/2nd rejected; the 3rd starts [구조 작업 진행 중] (no countdown), more situations still come, then signal cut -> blackout -> clear; EP10 only')

        # --- pacing: a "normal" run with human-like reaction delays -------------------------------------------------------
        fresh(); CUR[0] = ''
        seen = set(); n = 0
        while state()['status'] == 'active':
            n += 1; assert n < 12000, (evs(), data()['battery'])
            if data()['codesSent'] >= 3 and data()['rescue'] == 'none' and not data()['overlay']:
                step(5); open_thread('safety'); page.locator('#f9-reply').fill(data()['codes'][2]); click('f9-reply-send'); continue
            new = [e['kind'] + str(id(0)) for e in evs()]
            fresh_kinds = [e['kind'] for e in evs() if (e['kind'], data()['stageNo']) not in seen]
            if fresh_kinds:
                for e in evs(): seen.add((e['kind'], data()['stageNo']))
                if not any(k in ('B', 'D') for k in fresh_kinds): step(5)   # reading / deciding
            solve_one() if evs() else step(.5)
        s = state(); assert s['status'] == 'cleared', s.get('reason')
        mins = s['elapsed'] / 60; left = data()['battery']
        print('  pacing: %.1f min, battery left %.0f%%' % (mins, left))
        assert 11 <= mins <= 16, mins
        assert 12 <= left <= 32, left
        print('PASS pacing: a careful run lasts %.1f min and ends with %.0f%% battery (target 12-15 min, 15-30%%)' % (mins, left))

        # battery: drain, flashlight cost, interval curve, 0% = unknown outcome
        fresh(); b0 = data()['battery']; step(5); idle = b0 - data()['battery']
        assert abs(idle - T['drainIdle'] * 5) < .05, idle
        open_app('memo'); b1 = data()['battery']; step(5); app = b1 - data()['battery']
        open_app('camera'); b2 = data()['battery']; step(5); cam = b2 - data()['battery']
        open_app('flashlight'); click('f9-level-3'); click('f9-light'); b3 = data()['battery']; step(5); light = b3 - data()['battery']
        click('f9-light'); camera('video', 'front'); click('f9-record'); b4 = data()['battery']; step(5); rec = b4 - data()['battery']
        assert idle < app < cam < light < rec, (idle, app, cam, light, rec)
        assert [round(page.evaluate(f'FieldCore.mission("EP09").interval({b})'), 2) for b in (100, 60, 30, 0)] == sorted([round(page.evaluate(f'FieldCore.mission("EP09").interval({b})'), 2) for b in (100, 60, 30, 0)], reverse=True)
        click('f9-record'); page.evaluate("FieldCore.get().data.battery = 0.05"); step(1)
        reason = dead('NO_DATA'); assert reason.startswith('SIGNAL LOST') and 'NO DATA' in reason and '사망' not in reason
        assert 'SIGNAL LOST / NO DATA' in log_text() and '생체 신호 소실' not in log_text()
        print('PASS battery: waiting < app < camera < flashlight < recording; lower battery -> shorter interval, 0% -> SIGNAL LOST / NO DATA (not a death)')

        # save round trip
        code = page.evaluate('GameSave.exportCode()'); story_code = page.evaluate('GameSave.exportStoryCode()')
        page.evaluate("FieldSave.reset()"); assert 'EP09' not in page.evaluate('FieldSave.get()')['cleared']
        assert page.evaluate('(c) => GameSave.importCode(c)', code)
        assert 'EP09' in page.evaluate('FieldSave.get()')['cleared'] and page.evaluate("FieldSave.unlocked('EP10')")
        assert page.evaluate('GameSave.exportStoryCode()') == story_code
        print('PASS save: v5 export/import round-trip carries the EP09 clear; v4 Story code unchanged')

        # --- Story smartphone regression ------------------------------------------------------------------------------------
        page.evaluate("FieldUI.close()")
        assert page.evaluate("document.getElementById('mobile-phone-view').outerHTML") == story_phone_before, 'Story PDA DOM untouched'
        assert page.evaluate("phoneCurrentPhase") == story_phase_before
        assert not errors, errors
        p2 = browser.new_context(viewport={'width': 1280, 'height': 900}).new_page(); err2 = []
        p2.on('pageerror', lambda error: err2.append(str(error)))
        p2.goto(BASE + '/?devunlock=0', wait_until='load')
        p2.evaluate("initPhonePhase1()")
        feed = p2.locator('#phone-message-feed').inner_text()
        assert '070-0813-0813' in feed and p2.evaluate('phoneCurrentPhase') == 1 and p2.locator('#phone-input').get_attribute('placeholder').startswith('전화번호 입력')
        assert not err2, err2
        p2.context.close()
        print('PASS Story smartphone: PDA markup/phase untouched by the Field phone; Story phone phase 1 still runs with EP09 loaded')

        # --- mobile ----------------------------------------------------------------------------------------------------------
        page.set_viewport_size({'width': 390, 'height': 844})
        page.evaluate("FieldUI.open()")
        fresh()
        tap('f9-app-phone'); page.locator('#f9-dial').fill(D['missed'][0]); tap('f9-home'); tap('f9-app-flashlight'); tap('f9-light'); tap('f9-face-left')
        assert data()['light']['on'] and data()['facing'] == 'left'
        to('B'); page.locator('#f9-stare').dispatch_event('pointerdown', {'button': 0, 'pointerId': 1}); step(T['stareHold'] + .3)
        page.locator('#f9-stare').dispatch_event('pointerup', {'button': 0, 'pointerId': 1}) if has('f9-stare') else None
        assert 'B' in data()['resolved'] and state()['status'] == 'active'
        box = page.locator('#f9-phone').bounding_box(); assert box['x'] >= 0 and box['x'] + box['width'] <= 390
        assert not errors, errors
        print('PASS mobile: phone fits 390px; apps, flashlight, direction and press-and-hold stare work with touch/pointer')
        print('ALL EP09 CHECKS PASSED')
        browser.close()


if __name__ == '__main__':
    run()
