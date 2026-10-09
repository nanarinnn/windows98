"""EP08 (유성 워터파크 / one continuous run: changing room -> wave pool -> park -> 18:00 closing -> settlement) Field
browser smoke test. Requires Python Playwright and Chromium plus the Express server:
    npm start   then   python tests/ep08_browser_smoke.py
Uses isolated browser storage and the production FieldCore.step clock (the wall clock FieldCore reads is frozen, so
only step() advances time). FieldEP08Data.random(name) is pinned to index 0 unless forced:
locker 214, sunbed C-07, waveOverlay nameBroadcast, portable [bandFloat, aloneChild], lure [spaThirst, foodUnordered],
tower empty. No real save is read or changed.
"""
import os
from collections import deque
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')
STORY_KEY = 'yuyeon98.save.v1'
QTE = ['arms', 'wall', 'slow', 'stop']


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
        D = page.evaluate('FieldEP08Data')
        T, C = D['tuning'], D['clock']
        ADJ = D['adjacent']

        def click(id): page.locator('#' + id).click()
        def tap(id): page.locator('#' + id).tap()
        def has(id): return page.locator('#' + id).count() > 0
        def state(): return page.evaluate('FieldCore.get()')
        def data(): return state()['data']
        def sc(): return data()['scene'] or {}
        def ov(): return data()['overlay'] or {}
        def act(name, value=None): page.evaluate('([n, v]) => FieldCore.action(n, v)', [name, value])
        def log_text(): return page.locator('#field-log').inner_text()
        def hud(): return page.locator('.field-hud').inner_text()
        def step(seconds): page.evaluate('(n) => { let left = n; while (left > 0 && FieldCore.get().status === "active") { FieldCore.step(Math.min(.25, left)); left -= .25; } }', seconds)
        def hhmm(m): return '%02d:%02d' % (int(m) // 60, int(m) % 60)
        def fresh(force=None):
            page.evaluate("""(force) => { window.__force = Object.assign({ locker: 0, sunbed: 0, dry: 0, waveOverlay: 0, portable: 0, lure: 0, phantom: 0, tower: 0 }, force || {});
                FieldEP08Data.random = name => (name in window.__force ? window.__force[name] : Math.random());
                FieldUI.close(); FieldUI.open(); }""", force or {})
            click('field-dispatch-new-EP08' if has('field-dispatch-new-EP08') else 'field-dispatch-EP08')
            s = state(); assert s['status'] == 'active' and s['data']['zone'] == 'locker' and s['data']['clock'] == C['start'] and sc().get('phase') == 'band'
            click('f8-wear-band'); assert sc().get('phase') == 'store' and '밴드를 찼다' in log_text()
        def dead(code):
            s = state(); assert s['status'] == 'dead' and data()['failCode'] == code and s['reason'].startswith(code), (code, s['status'], data()['failCode'], s.get('reason'))
            assert '[CASE TERMINATED]' in s['reason'] and '[퇴장 기록 없음]' in s['reason'] and '[CASE TERMINATED]' in log_text()
        def route(goal):
            start = data()['zone']; prev = {start: None}; q = deque([start])
            while q:
                z = q.popleft()
                for n in ADJ[z]:
                    if n not in prev: prev[n] = z; q.append(n)
            path = [goal]
            while prev[path[-1]] is not None: path.append(prev[path[-1]])
            return list(reversed(path))[1:]
        def walk(goal):
            for z in route(goal): act('move', z)

        def solve():
            """One correct move for whatever is happening now (used to play forward and for natural runs)."""
            d = data(); e = d['scene'] or {}; o = d['overlay'] or {}; k = e.get('kind')
            w = o if o.get('kind') == 'whistle' else (e if k == 'whistle' else None)
            if w:
                if w['phase'] == 'blow': return act('freeze')
                if w['phase'] == 'frozen': return act('checkTower')
                return act('backAway' if k == 'character' else 'leaveWater')
            if d['band']['loose']: return act('wristIn')
            if k == 'locker':
                if e['phase'] == 'store': return act('openLocker', d['band']['locker'])
                if e['phase'] == 'calm': return step(T['lockerOpenDelay'] + .3)
                act('breath', True); return act('move', 'desk')
            if k == 'report': return act('report')
            if k == 'wave':
                if e['phase'] == 'ride': return step(T['waveRide'] + .3)
                if e['phase'] == 'receded': return act('avert')
                return step(1)
            if k == 'slide':
                ph = e['phase']
                if ph == 'queue': return act('ride')
                if ph == 'stopped': return act('emergency')
                if e['count'] < e['curve']: return act('count')
                if ph == 'fourth': return act(QTE[e['qte']])
                return step(.5)
            if k == 'aloneChild': return act('sayLine')
            if k == 'bandFloat': return act('callLifeguard')
            if k == 'character': return act('backAway') if not e.get('ov') else step(.5)
            if k == 'bath': return act('exitBath')
            if k == 'food': return act('notToday') if e['phase'] == 'ask' else act('eatAll' if e['extra'] else 'eat')
            if k == 'sunbed': return act('ownBed')
            if k == 'closing':
                if e['phase'] == 'stay': return act('refuse')
                if e['phase'] == 'blocked': return act('emergency')
                return step(1)
            if k == 'settle': return act({'statement': 'pay', 'paid': 'returnBand', 'door': 'goOut', 'staff': 'staffPay'}[e['phase']])
            if o.get('kind') == 'nameBroadcast': return step(1)
            c = d['core']
            if not c['wave']: return act('move', route('wave')[0])
            if not c['slide']: return act('move', route('slide')[0])
            if c['closing'] and d['zone'] != 'exit': return act('move', route('exit')[0])
            return step(1)

        def play(until, limit=600):
            n = 0
            while not until():
                n += 1; assert n < limit, ('stuck', data().get('scene'), data().get('overlay'), hhmm(data()['clock']))
                assert state()['status'] == 'active', state().get('reason')
                solve()
        def after_locker(force=None):
            fresh(force); play(lambda: data()['core']['locker'])
        def after_wave(force=None):
            after_locker(force); play(lambda: data()['core']['wave'])
        def free_at(zone, force=None):
            after_wave(force); walk(zone)
        def wait_for(cond, limit=900, handle=None):
            """Stay put and let the clock run (optionally handling unrelated scenes) until cond()."""
            n = 0
            while not cond():
                n += 1; assert n < limit, ('wait timeout', data().get('scene'), hhmm(data()['clock']))
                assert state()['status'] == 'active', state().get('reason')
                if handle and handle(): continue
                step(.5)

        story_before = page.evaluate(f"localStorage.getItem('{STORY_KEY}')")
        story_globals = "JSON.stringify([typeof jayUnlocked !== 'undefined' ? jayUnlocked : null, typeof ep9GoodEndingCleared !== 'undefined' ? ep9GoodEndingCleared : null])"
        globals_before = page.evaluate(story_globals)

        # --- 0. Rule document: one canon (reviewed transcript -> 8화.txt -> Story window -> Field panel) -------------------
        story_doc = page.evaluate("document.querySelector('#darkwebReportWindowEP8 textarea').value").replace('\r\n', '\n').strip()
        txt = (ROOT / '8화.txt').read_text(encoding='utf-8').replace('\r\n', '\n').strip()
        assert story_doc == txt, 'index.html Story window must equal 8화.txt'
        transcript = (ROOT / 'docs/transcripts/reviewed/EP08_유성_워터파크.txt').read_text(encoding='utf-8-sig')
        norm = lambda t: t.replace('“', '').replace('”', '')
        for marker in ['손목 밴드는 퇴장 전까지 어떠한 경우에도 풀지 마십시오', '헐거워졌다고 느껴지더라도 조이지 마시고', '손목을 몸쪽으로 붙인 채',
                       '최대한 빠르게 힘껏 안전 요원을 불러 주십시오', '즉시 호흡을 멈추신 뒤 탈의실 밖으로 나오신 후 안내 데스크에 신고',
                       '변종 에볼라 바이러스', '“오늘 수술받는 날이 아니었니?”', '매시 정각과 30분', '1회 15분간', '혼자만 젖지 않은 사람',
                       '수습된 유해에서는 혈액이 검출되지 않았습니다', '성인 고객을 안내 방송으로 호출하지 않습니다', '1회 입욕 시간은 15분',
                       '수술 대상으로 분류됩니다', '네 번째 곡선은 존재하지 않습니다', '마취 없이 개복된 상태', '“오늘은 아닙니다.”라고만',
                       '해당 날짜에 반드시 수술을 받게 됨', '분실물 센터에 부위별로 분류', '2인 이상의 인솔 직원', '캐릭터 내부에서 으깨진 채로',
                       '붉은색 수영복', '검은색 수영복 반바지', '양쪽 갈비뼈 골절', '오후 6시', '조금 더 놀고 가자고', '긴급 전화 버튼',
                       '이의를 제기하거나 환불을 요구하지 마십시오', '결제 기록에는 오류가 발생하지 않습니다', '0050-0200']:
            assert marker in txt, marker
            assert norm(marker) in norm(transcript), 'marker not in transcript: ' + marker
        for code in D['canonFailures']:   # every canon failure text restates the reviewed transcript
            body = D['failures'][code].split('습니다. ', 1)[-1] if code != 'SPA_DRINK' else '탕 안에서 수분을 섭취한 고객은 수술 대상으로 분류됩니다'
            key = body[:18]
            assert norm(key) in norm(transcript), (code, key)
        assert page.evaluate("EPISODE_DOCS[8]") == '' and page.evaluate("EPISODE_TITLES[8]") == '유성 워터파크'
        assert page.evaluate("runEpisode(8).lines[0]") == '> EP.08 유성 워터파크'
        print('PASS 0 rule document: 8화.txt == Story window; rules/consequences match the reviewed transcript; canon failure texts quote it')

        # --- 1. Unlock ---------------------------------------------------------------------------------------------------
        click('field-open')
        assert page.locator('#field-dispatch-EP08').inner_text() == '연결 제한' and page.locator('#field-dispatch-EP08').is_disabled()
        page.evaluate("for (const id of ['EP01','EP02','EP03','EP04','EP05','EP06']) FieldSave.clear(id, { patrols: {}, elapsed: 700, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP08').inner_text() == '연결 제한', 'EP08 stays locked until EP07 is cleared'
        page.evaluate("FieldSave.clear('EP07', { patrols: {}, elapsed: 300, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP08').inner_text() == '파견 가능' and page.locator('#field-dispatch-EP09').inner_text() == '연결 제한'
        print('PASS 1 EP08 locked until EP07 clear, then dispatchable; EP09 still locked')

        # --- 2. UI ---------------------------------------------------------------------------------------------------------
        page.evaluate("""(() => { window.__hooks = []; const add = (kind, fn) => FieldCore.hooks.add(kind, fn);
            add('onEpisodeStart', id => window.__hooks.push(['onEpisodeStart', id]));
            add('onMajorEvent', (id, event) => window.__hooks.push(['onMajorEvent', id, event]));
            add('onEpisodeClear', id => window.__hooks.push(['onEpisodeClear', id])); })()""")
        fresh()
        assert page.locator('.field-hud > *').count() == 3 and hud().split()[0] == '17:02' and '탈의실' in hud() and 'BAND: ACTIVE' in hud()
        assert page.locator('#f8-map button').count() == 11
        enabled = [b for b in ADJ if not page.locator('#f8-move-' + b).is_disabled()]
        assert sorted(enabled) == ['desk', 'locker'], enabled   # current + adjacent only
        assert '배정 사물함 214번' in page.locator('#f8-band').inner_text() and '선베드' not in page.locator('#f8-band').inner_text()
        visible = page.locator('#f8-scene').inner_text() + hud() + page.locator('#f8-actions').inner_text() + page.locator('#f8-band').inner_text()
        for secret in ['LOCKER_BREATH', 'UNWET', 'SLIDE_END', 'true', 'false', 'phantom', '정답', 'CORE', 'overlay']:
            assert secret not in visible, secret
        click('f8-remove-band'); dead('BAND_REMOVED')
        print('PASS UI: HUD = time / place / band only; 11-zone map, only adjacent areas walkable; locker number shown only in the changing room; removing the band fails')

        # --- 3. CORE 1: changing room ----------------------------------------------------------------------------------------
        fresh(); click('f8-locker-108'); assert '반응하지 않는다' in log_text() and sc()['phase'] == 'store'
        click('f8-locker-214'); assert sc()['phase'] == 'calm' and hhmm(data()['clock']) == '17:03'
        click('f8-move-desk'); assert data()['zone'] == 'locker', 'cannot leave before anything happens'
        step(T['lockerOpenDelay'] + .3); assert sc()['phase'] == 'open' and '스스로 열린다' in log_text() and has('f8-breath')
        step(T['breathDeadline'] + .3); dead('LOCKER_BREATH'); assert '변종 에볼라' in state()['reason']
        fresh(); click('f8-locker-214'); step(T['lockerOpenDelay'] + .3); click('f8-move-desk'); dead('LOCKER_BREATH')       # walked out breathing
        fresh(); click('f8-locker-214'); step(T['lockerOpenDelay'] + .3); act('breath', True); act('breath', False); dead('LOCKER_BREATH')   # breathed inside
        fresh(); click('f8-locker-214'); step(T['lockerOpenDelay'] + .3); act('breath', True); step(T['breathMax'] + .3); dead('LOCKER_BREATH')  # lingered
        # real press-and-hold: hold the button, drag onto the map's desk, release
        fresh(); click('f8-locker-214'); step(T['lockerOpenDelay'] + .3)
        page.locator('#f8-breath').hover(); page.mouse.down(); assert data()['breath'] and page.locator('#f8-breath').get_attribute('aria-pressed') == 'true'
        box = page.locator('#f8-move-desk').bounding_box(); page.mouse.move(box['x'] + box['width'] / 2, box['y'] + box['height'] / 2); page.mouse.up()
        assert state()['status'] == 'active' and data()['zone'] == 'desk' and sc()['kind'] == 'report' and '숨을 참은 채 탈의실 밖으로' in log_text()
        click('f8-pass'); dead('LOCKER_UNREPORTED')
        fresh(); click('f8-locker-214'); step(T['lockerOpenDelay'] + .3); act('breath', True); act('move', 'desk'); act('move', 'wave'); dead('LOCKER_UNREPORTED')
        fresh(); click('f8-locker-214'); step(T['lockerOpenDelay'] + .3); act('breath', True); act('move', 'desk'); click('f8-report')
        assert data()['core']['locker'] and '신고했다' in log_text() and not data()['scene']
        print('PASS CORE locker: assigned locker only; an unassigned one opens by itself -> hold breath (press-and-hold), leave, report at the desk; breathing/lingering/not reporting fail')

        # --- 4. CORE 2: wave pool + overlap ----------------------------------------------------------------------------------
        clock_before = data()['clock']; step(20); assert data()['clock'] == clock_before, 'the tutorial clock only moves with actions'
        click('f8-move-wave'); assert sc()['kind'] == 'wave' and sc()['phase'] == 'ride' and not has('f8-avert')
        step(T['waveRide'] + .3); assert hhmm(data()['clock']) == '17:15' and sc()['phase'] == 'receded'
        crowd = page.locator('#f8-crowd').inner_text(); assert D['crowdDry'] in crowd and all(w in crowd for w in D['crowdWet'])
        assert '젖지 않' not in page.locator('#f8-text').inner_text() and '!' not in crowd and not page.locator('#f8-crowd b, #f8-crowd mark').count(), 'no marker: the player has to spot it'
        step(T['unwetNotice'] + .3); dead('UNWET'); assert '혈액이 검출되지 않았습니다' in state()['reason'] and '얼굴만 천천히' in log_text()
        for bad in ['f8-meet-eyes', 'f8-wave-hand', 'f8-leave-pool']:
            after_locker(); walk('wave'); step(T['waveRide'] + .3); click(bad); dead('UNWET')
        after_locker(); walk('wave'); step(T['waveRide'] + .3); click('f8-avert'); act('move', 'kids'); dead('UNWET')
        # name broadcast on top of "don't move / don't look"
        after_locker(); walk('wave'); step(T['waveRide'] + .3); click('f8-avert'); step(T['overlayDelay'] + .3)
        assert ov()['kind'] == 'nameBroadcast' and '분명히 내 이름이다' in page.locator('#f8-alert').inner_text()
        click('f8-answer'); dead('BROADCAST')
        after_locker(); walk('wave'); step(T['waveRide'] + .3); click('f8-avert'); step(T['overlayDelay'] + .3); act('move', 'desk'); dead('BROADCAST')
        after_locker(); walk('wave'); step(T['waveRide'] + .3); click('f8-avert'); step(T['overlayDelay'] + .3)
        step(T['unwetWait']); assert state()['status'] == 'active' and data()['core']['wave'] and hhmm(data()['clock']) == '17:30' and '젖지 않은 사람은 보이지 않는다' in log_text()
        assert '방송이 끝났다' in log_text()
        # whistle (tower manned) on top instead
        after_locker({'waveOverlay': 1}); walk('wave'); step(T['waveRide'] + .3); click('f8-avert'); step(T['overlayDelay'] + .3)
        assert ov()['kind'] == 'whistle' and ov()['phase'] == 'frozen' and '이미 움직이지 않고' in log_text()
        step(T['whistleCheck'] + .3); dead('WHISTLE_IGNORED')
        after_locker({'waveOverlay': 1}); walk('wave'); step(T['waveRide'] + .3); click('f8-avert'); step(T['overlayDelay'] + .3)
        click('f8-check-tower'); assert '붉은색 수영복' in log_text() and not data()['overlay']
        step(T['unwetWait']); assert data()['core']['wave']
        print('PASS CORE wave pool: wave -> 17:15 recede -> one dry person in the crowd (no marker) -> eyes down, stay still until 17:30; overlapped by own-name broadcast (ignore, do not go to the desk) or a whistle (already still, check the tower)')

        # --- 5. CORE 3: slide ------------------------------------------------------------------------------------------------
        free_at('slide'); assert sc()['kind'] == 'slide' and sc()['phase'] == 'queue'
        click('f8-ride'); assert has('f8-count') and page.locator('#f8-tunnel').is_visible()
        labels = page.locator('#f8-actions button').all_inner_texts(); assert labels.index('양팔을 벌린다') > labels.index('벽면에 몸을 붙인다'), 'steps are not listed in order'
        for i in range(3): step(T['curveGap']); click('f8-count')
        assert sc()['curve'] == 3 and sc()['count'] == 3 and page.locator('#f8-count-view').inner_text() == '3'
        click('f8-arms'); assert '버틸 수가 없다' in log_text() and sc()['qte'] == 0
        step(T['curveGap'] + .1); assert sc()['phase'] == 'blackout' and '빛이 꺼진다' in log_text()
        step(T['blackout'] + .1); assert sc()['phase'] == 'fourth' and sc()['curve'] == 4
        step(T['slideStop'] + .3); dead('SLIDE_END'); assert '마취 없이 개복' in state()['reason']
        free_at('slide'); click('f8-ride'); step(T['curveGap'] * 4 + T['blackout'] + .5); assert sc()['phase'] == 'fourth'
        click('f8-arms'); assert sc()['qte'] == 0, 'not counted -> not perceived'; step(T['slideStop']); dead('SLIDE_END')
        free_at('slide'); click('f8-ride')
        for i in range(3): step(T['curveGap']); click('f8-count')
        step(T['curveGap'] + T['blackout'] + .5); click('f8-count'); click('f8-tuck'); dead('SLIDE_END')
        free_at('slide'); click('f8-ride')
        for i in range(3): step(T['curveGap']); click('f8-count')
        step(T['curveGap'] + T['blackout'] + .5); click('f8-count')
        click('f8-wall'); assert '계속 미끄러진다' in log_text() and sc()['qte'] == 0
        for b in QTE: click('f8-' + b)
        assert sc()['phase'] == 'stopped'; step(10); assert state()['status'] == 'active', 'stopped riders do not arrive'
        click('f8-emergency'); assert data()['core']['slide'] and '구조 요청' in log_text() and not data()['scene']
        print('PASS CORE slide: pseudo first person, player counts curves; 3 -> blackout -> 4th; arms/wall/slow/stop then wristband emergency; uncounted/tucked/too slow -> canon failure')

        # --- 6. Optional events -------------------------------------------------------------------------------------------
        # A band: loose (do not tighten) -> floats in the water -> call the lifeguard
        loose = lambda: data()['band']['loose']
        after_wave(); walk('kids'); wait_for(loose); assert 'BAND: LOOSE' in hud() and hhmm(data()['clock']) >= '17:35'
        click('f8-tighten'); dead('BAND_TIGHTENED')
        after_wave(); walk('kids'); wait_for(loose); click('f8-wrist-in'); assert not data()['band']['loose']; step(T['bandFloatDelay'] + .3)
        assert sc()['kind'] == 'bandFloat' and '물 위에 떠올랐다' in log_text(); click('f8-grab-band'); dead('BAND_FLOAT')
        after_wave(); walk('kids'); wait_for(loose); step(T['bandFloatDelay'] + .3); step(T['bandCall'] + .3); dead('BAND_FLOAT')
        after_wave(); walk('kids'); wait_for(loose); step(T['bandFloatDelay'] + .3); click('f8-call-lifeguard')
        assert data()['band']['issued'] == 2 and 'BAND: REISSUED' in hud() and not data()['scene']
        # floats only in a lifeguard pool: on land it stays pending
        after_wave(); walk('food'); wait_for(loose); step(5); assert data()['band']['floatPending'] and not data()['scene']
        print('PASS band: loose -> do not tighten; floating band -> call the lifeguard (reissued); grabbing/waiting fails; floats only in the water')

        # C lone child (slot 2 with portable 0)
        def to_child():
            after_wave(); walk('food'); wait_for(loose); act('wristIn')
            wait_for(lambda: sc().get('kind') == 'aloneChild')
        to_child(); assert '손 잡아 주세요.' in log_text()
        for bad, code in [('f8-give-hand', 'CHILD_HAND'), ('f8-lead-desk', 'CHILD_HAND'), ('f8-ask-parent', 'CHILD_WORDS')]:
            click(bad); dead(code); to_child()
        step(T['childWait'] + .3); dead('CHILD_HAND')
        to_child(); click('f8-say-line'); assert '도망쳤다' in log_text() and not data()['scene']
        print('PASS lone child: never the hand, never the desk; only "오늘 수술받는 날이 아니었니?" -> runs off')

        # K whistle with an empty tower (portable 1 -> [aloneChild, whistleEmpty]: second slot, in the water)
        def to_whistle():
            after_wave({'portable': 1}); walk('kids')
            child = lambda: sc().get('kind') == 'aloneChild' and (act('sayLine') or True)
            wait_for(lambda: sc().get('kind') == 'whistle', handle=child)
        to_whistle(); assert sc()['phase'] == 'blow'; click('f8-keep-swim'); dead('WHISTLE_MOVE')
        to_whistle(); step(T['whistleFreeze'] + .3); dead('WHISTLE_MOVE')
        to_whistle(); click('f8-freeze'); click('f8-check-tower'); assert '비어 있다' in log_text() and '검은색 수영복 반바지' in log_text()
        click('f8-stay-water'); dead('WHISTLE_STAY'); assert '갈비뼈' in state()['reason']
        to_whistle(); click('f8-freeze'); click('f8-check-tower'); click('f8-ask-black'); dead('WHISTLE_STAY')
        to_whistle(); click('f8-freeze'); click('f8-check-tower'); step(T['leaveWater'] + .3); dead('WHISTLE_STAY')
        to_whistle(); click('f8-freeze'); click('f8-check-tower'); act('move', 'wave'); dead('WHISTLE_STAY')   # into another pool
        to_whistle(); click('f8-freeze'); click('f8-check-tower'); click('f8-leave-water'); assert state()['status'] == 'active' and not data()['scene']
        print('PASS whistle: stop at once, check the nearest tower; empty -> out of the water now; staying/asking the black-shorts lifeguard fails')

        # F spa
        free_at('spa'); click('f8-enter-bath'); c0 = data()['clock']; step(T['thirstAt'] + .3); assert '목이 타들어' in log_text() and has('f8-drink')
        click('f8-drink'); dead('SPA_DRINK'); assert '수술 대상' in state()['reason']
        free_at('spa'); click('f8-enter-bath'); c0 = data()['clock']; step(T['bathLength'] + .3); assert '안내종' in log_text() and abs(data()['clock'] - (c0 + 15)) < .01
        step(T['bellExit'] + .3); dead('SPA_LATE')
        free_at('spa'); click('f8-enter-bath'); step(T['bathLength'] + .3); click('f8-exit-bath'); assert state()['status'] == 'active' and data()['used']['spa']
        print('PASS spa: 15 game minutes; thirst with water in reach -> drinking fails; leave at the bell or fail')

        # H food court
        free_at('food'); click('f8-order-1'); assert D['unordered'] in log_text()
        click('f8-not-ordered'); dead('FOOD_LEFT')
        free_at('food'); click('f8-order-0'); click('f8-leave-food'); dead('FOOD_LEFT')
        free_at('food'); click('f8-order-0'); act('move', 'wave'); dead('FOOD_LEFT')
        for bad, code in [('f8-answer-date', 'SURGERY_DATE'), ('f8-answer-other', 'SURGERY_OTHER'), ('f8-answer-unsure', 'SURGERY_OTHER')]:
            free_at('food'); click('f8-order-0'); click('f8-eat-all'); assert '언제 수술이십니까?' in log_text(); click(bad); dead(code)
        free_at('food'); click('f8-order-0'); click('f8-eat-all'); click('f8-not-today'); assert '"오늘은 아닙니다."' in log_text() and not data()['scene']
        print('PASS food: unordered dish -> eat it all (pointing it out/leaving/walking off fails); "언제 수술이십니까?" -> only "오늘은 아닙니다."')

        # I sunbed (lure 1 -> [foodUnordered, sunbedLure])
        for bad in ['f8-near-bed', 'f8-towel-bed']:
            free_at('sunbed', {'lure': 1}); click('f8-rest'); assert '배정 선베드 C-07' in page.locator('#f8-band').inner_text(); click(bad); dead('SUNBED')
        assert '분실물 센터' in state()['reason']
        free_at('sunbed', {'lure': 1}); click('f8-rest'); click('f8-own-bed'); assert 'C-07 선베드까지 걸어가 누웠다' in log_text()
        free_at('sunbed', {'lure': 0}); click('f8-rest'); assert not has('f8-near-bed')
        print('PASS sunbed: the nearer empty beds are a lure; only the band-assigned bed')

        # J character (late slot, after the slide) on land with the name broadcast on top (waveOverlay=whistle)
        def to_character(force, zone):
            after_wave(force); play(lambda: data()['core']['slide'], 400); walk(zone)
            play(lambda: sc().get('kind') == 'character', 400)
        for bad in ['f8-approach', 'f8-photo-mascot', 'f8-run-away']:
            to_character({'waveOverlay': 1}, 'food'); click(bad); dead('CHARACTER')
        assert '으깨진' in state()['reason']
        to_character({'waveOverlay': 1}, 'food'); act('move', 'wave'); dead('CHARACTER')   # turning to walk off
        to_character({'waveOverlay': 1}, 'food'); step(T['overlayDelay'] + .3); assert ov()['kind'] == 'nameBroadcast'
        click('f8-back-away'); assert '등을 보이지 않은 채' in log_text() and not data()['scene']
        step(T['broadcastLength']); assert state()['status'] == 'active'
        print('PASS character: no staff -> never approach/photo/turn away; back off toward the crowd (with the own-name broadcast running)')

        # J + K overlap in the water: empty tower -> back out of the water facing it
        to_character({'tower': 0}, 'kids'); assert sc()['ov'] == 'whistleEmpty'; step(T['overlayDelay'] + .3)
        assert ov()['kind'] == 'whistle' and ov()['phase'] == 'blow'; click('f8-back-away'); dead('WHISTLE_MOVE')
        to_character({'tower': 0}, 'kids'); step(T['overlayDelay'] + .3); click('f8-freeze'); step(T['whistleCheck'] - 1)
        assert state()['status'] == 'active' and sc()['kind'] == 'character', 'the character waits while the whistle is handled'; click('f8-check-tower'); click('f8-back-away')
        to_character({'tower': 0}, 'kids'); step(T['overlayDelay'] + .3); click('f8-freeze'); click('f8-check-tower'); click('f8-leave-water'); dead('CHARACTER')
        to_character({'tower': 0}, 'kids'); step(T['overlayDelay'] + .3); click('f8-freeze'); click('f8-check-tower'); click('f8-stay-water'); dead('WHISTLE_STAY')
        to_character({'tower': 0}, 'kids'); step(T['overlayDelay'] + .3); click('f8-freeze'); click('f8-check-tower')
        assert '뒷걸음질' in page.locator('#f8-back-away').inner_text(); click('f8-back-away')
        assert state()['status'] == 'active' and not data()['scene'] and not data()['overlay'] and '물 밖으로 나왔다' in log_text()
        to_character({'tower': 1}, 'kids'); step(T['overlayDelay'] + .3); click('f8-freeze'); click('f8-check-tower'); assert '붉은색 수영복' in log_text() and sc()['kind'] == 'character'
        click('f8-back-away'); assert not data()['scene']
        print('PASS character + whistle: stop facing it, check the tower; empty -> back out of the water toward the crowd (turning to climb out or staying fails); manned -> back away')

        # --- 7. CORE 4: closing ---------------------------------------------------------------------------------------------
        def to_closing(force=None):
            after_wave(force); play(lambda: sc().get('kind') == 'closing' and sc()['phase'] == 'stay', 600)
        to_closing(); assert hhmm(data()['clock']) == '18:00' and '18:00' in log_text() and '음악이 멈췄다' in log_text() and '조금 더 놀고 가자.' in log_text()
        assert '환자 여러분' in log_text() and 'f8-late' in page.locator('#f8-scene').get_attribute('class')
        click('f8-play-more'); dead('CLOSING_STAY')
        to_closing(); click('f8-refuse'); assert '막아선다' in log_text(); click('f8-shove'); dead('CLOSING_FORCE')
        to_closing(); click('f8-refuse'); step(T['blockWait'] + .3); dead('CLOSING_STAY')
        to_closing(); click('f8-refuse'); click('f8-emergency'); assert '길이 잠깐 열렸다' in log_text() and data()['core']['closing']
        step(T['pathOpen'] + .3); assert sc()['kind'] == 'closing' and sc()['phase'] == 'blocked' and '다시 사람들이' in log_text()
        click('f8-emergency'); walk('exit'); assert sc()['kind'] == 'settle'
        print('PASS CORE closing: 18:00 broadcast, music stops, "조금 더 놀고 가자." -> refuse politely -> blocked -> wristband emergency opens a short path (lingering re-blocks)')

        # --- 8. Settlement -------------------------------------------------------------------------------------------------
        statement = page.locator('#f8-panel').inner_text()
        assert '유성 워터파크 이용 정산' in statement and 'TOTAL' in statement and '메가 슬라이드' in statement and '힐링존 이용' in statement   # spa never used
        assert any(u in statement for u in D['phantom']['unknown'])
        click('f8-dispute'); dead('SETTLE_DISPUTE')
        to_closing(); play(lambda: sc().get('kind') == 'settle'); click('f8-refund'); dead('SETTLE_DISPUTE')
        to_closing(); play(lambda: sc().get('kind') == 'settle'); click('f8-call-staff'); click('f8-staff-dispute'); dead('SETTLE_DISPUTE')
        to_closing(); play(lambda: sc().get('kind') == 'settle'); click('f8-call-staff'); click('f8-staff-pay'); assert sc()['phase'] == 'statement'
        total = page.evaluate("FieldCore.mission('EP08').total(FieldCore.get().data)")
        click('f8-pay'); assert ('%s원' % format(total, ',')) in log_text() and '결제 승인' in page.locator('#f8-panel').inner_text()
        click('f8-return-band'); assert 'BAND: RETURNED' in hud() and '자동문' in log_text()
        click('f8-go-out')
        s = state(); assert s['status'] == 'cleared', s.get('reason')
        assert '[FIELD OBSERVATION COMPLETE]' in page.locator('#field-outcome').inner_text() and 'TRUE END' not in page.locator('#field-outcome').inner_text()
        assert page.evaluate("FieldSave.get().cleared.includes('EP08') && FieldSave.unlocked('EP09')")
        assert not page.evaluate("FieldSave.get().cleared.includes('EP09')") and not page.evaluate("FieldSave.unlocked('EP10')")
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before, 'Story save must be untouched'
        assert page.evaluate(story_globals) == globals_before, 'J / EP09 Story flags untouched'
        assert page.evaluate("!FieldSave.get().progress?.EP08"), 'EP08 does not persist mid-run snapshots'
        hooks = page.evaluate('window.__hooks')
        assert ['onEpisodeStart', 'EP08'] in hooks and ['onEpisodeClear', 'EP08'] in hooks and all(len(h) <= 3 for h in hooks)
        click('field-list'); assert page.locator('#field-dispatch-EP09').inner_text() == '파견 가능'
        print('PASS settlement: unused charges listed; dispute/refund/staff dispute fail; pay as shown -> return band -> out -> [FIELD OBSERVATION COMPLETE]; EP09 only; Story/J untouched')

        # --- 9. System ------------------------------------------------------------------------------------------------------
        M = "FieldCore.mission('EP08')"
        for a, b in [('wave', 'whistleEmpty'), ('wave', 'bandFloat'), ('slide', 'nameBroadcast'), ('slide', 'whistleManned'), ('locker', 'nameBroadcast'),
                     ('closing', 'nameBroadcast'), ('settle', 'nameBroadcast'), ('bath', 'whistleEmpty'), ('aloneChild', 'whistleEmpty')]:
            assert not page.evaluate(f"{M}.canOverlap('{a}', '{b}')"), (a, b)
        for a, lst in D['OVERLAP_RULES'].items():
            for b in lst: assert page.evaluate(f"{M}.canOverlap('{a}', '{b}')")
        # natural runs across decks: never more than one overlay, never stuck, always clearable, clock monotonic
        decks = [{}, {'waveOverlay': 1, 'portable': 1, 'lure': 1, 'tower': 1}, {'portable': 2, 'lure': 2}, {'waveOverlay': 1, 'portable': 2, 'tower': 0}]
        for force in decks:
            fresh(force); last = data()['clock']; n = 0; kinds = set()
            while state()['status'] == 'active':
                n += 1; assert n < 900, ('stuck', force, data()['scene'], data()['overlay'], hhmm(data()['clock']))
                d = data(); assert d['clock'] >= last - 1e-9, 'clock went backwards'; last = d['clock']
                if d['scene']: kinds.add(d['scene']['kind'])
                if d['overlay']: kinds.add(d['overlay']['kind']); assert d['scene'] is None or page.evaluate(f"{M}.canOverlap('{d['scene']['kind']}', '{d['overlay'].get('kind') if d['overlay']['kind'] != 'whistle' else ('whistleEmpty' if d['overlay']['empty'] else 'whistleManned')}')") or d['scene']['kind'] == 'closing'
                solve()
            s = state(); assert s['status'] == 'cleared', (force, s.get('reason'))
            assert {'locker', 'wave', 'slide', 'closing', 'settle'} <= kinds, kinds
            fired = len(data()['fired']); assert 3 <= fired <= 6, (force, data()['fired'])
            print('  run', force or 'default', 'events', data()['fired'], 'solver real seconds %.0f' % s['elapsed'])
        # retry: a death restarts only this run; Field progression kept
        cleared_before = page.evaluate("FieldSave.get().cleared.slice()")
        fresh(); click('f8-remove-band'); dead('BAND_REMOVED'); click('field-retry')
        assert state()['status'] == 'active' and data()['clock'] == C['start'] and page.evaluate("FieldSave.get().cleared.slice()") == cleared_before
        print('PASS system: overlap table (impossible pairs refused), natural runs over 4 decks clear without softlock, 3-6 drawn events per run, retry resets only the run')

        # --- 10. Save Code v5 round-trip -----------------------------------------------------------------------------------
        code = page.evaluate("GameSave.exportCode()"); story_code = page.evaluate("GameSave.exportStoryCode()")
        assert page.evaluate("(c) => GameSave.importCode(c)", code)
        assert page.evaluate("FieldSave.get().cleared.includes('EP08')") and page.evaluate("GameSave.exportStoryCode()") == story_code
        print('PASS save: v5 export/import round-trip carries the EP08 clear; v4 Story code unchanged')

        # --- 11. Mobile touch ------------------------------------------------------------------------------------------------
        page.set_viewport_size({'width': 390, 'height': 844})
        fresh(); tap('f8-locker-214'); step(T['lockerOpenDelay'] + .3)
        page.locator('#f8-breath').dispatch_event('pointerdown', {'pointerId': 1, 'clientX': 1, 'clientY': 1}); assert data()['breath']
        tap('f8-move-desk'); tap('f8-report'); assert data()['core']['locker']
        tap('f8-move-wave'); step(T['waveRide'] + .3); tap('f8-avert'); assert sc()['phase'] == 'still'
        box = page.locator('#f8-map').bounding_box(); assert box['x'] >= 0 and box['x'] + box['width'] <= 390
        print('PASS mobile: hold breath with one finger and tap the map with another; map and controls fit 390px')

        assert not errors, errors
        browser.close()
        print('ALL EP08 CHECKS PASSED')


if __name__ == '__main__':
    run()
