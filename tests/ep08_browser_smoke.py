"""EP08 (유성 워터파크 / water-park day with the electronic wristband) Field browser smoke test. Requires Python
Playwright and Chromium plus the Express server:
    npm start   then   python tests/ep08_browser_smoke.py
Uses isolated browser storage and the production FieldCore.step clock (the wall clock FieldCore reads is frozen, so
only step() advances time). FieldEP08Data.random(name) is pinned to index 0 (locker 214, sunbed C-07) unless forced.
No real save is read or changed.
"""
import os
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
        page.goto(BASE + '/?devunlock=0', wait_until='load')
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")
        page.evaluate("window.__pn = performance.now(); performance.now = () => window.__pn")
        T = page.evaluate('FieldEP08Data.tuning')

        def click(id): page.locator('#' + id).click()
        def tap(id): page.locator('#' + id).tap()
        def has(id): return page.locator('#' + id).count() > 0
        def state(): return page.evaluate('FieldCore.get()')
        def data(): return state()['data']
        def ev(): return data()['ev'] or {}
        def sid(): return page.evaluate('(() => { const d = FieldCore.get().data; return FieldEP08Data.stages[d.stage]?.id || "" })()')
        def log_text(): return page.locator('#field-log').inner_text()
        def step(seconds): page.evaluate('(n) => { let left = n; while (left > 0 && FieldCore.get().status === "active") { FieldCore.step(Math.min(.25, left)); left -= .25; } }', seconds)
        def zone_of(stage_id): return page.evaluate('(id) => FieldEP08Data.stages.find(s => s.id === id).zone', stage_id)
        def fresh(force=None):
            page.evaluate("""(force) => { window.__force = Object.assign({ locker: 0, sunbed: 0 }, force || {});
                FieldEP08Data.random = name => (name in window.__force ? window.__force[name] : Math.random());
                FieldUI.close(); FieldUI.open(); }""", force or {})
            click('field-dispatch-new-EP08' if has('field-dispatch-new-EP08') else 'field-dispatch-EP08')
            assert state()['status'] == 'active' and sid() == 'entry' and data()['zone'] == 'entrance'
        def dead(code):
            s = state(); assert s['status'] == 'dead' and data()['failCode'] == code and s['reason'].startswith(code), (code, s['status'], data()['failCode'], s.get('reason'))
        def go(zone):
            if data()['zone'] != zone: click('f8-move-' + zone)

        def solve_one():
            """Advance the current stage by one correct move."""
            s, d, e = sid(), data(), ev()
            if not d['started'] and d['zone'] != zone_of(s): return go(zone_of(s))
            k = e.get('kind')
            if k == 'entry': click('f8-wear-band')
            elif k == 'lockerUse': click('f8-locker-%d' % d['band']['locker'])
            elif k == 'lockerOpen': click('f8-hold-breath') if e['phase'] == 'open' else go('desk')
            elif k == 'report': click('f8-report-desk')
            elif k == 'lostChild': go('desk')
            elif k == 'aloneChild': click('f8-say-line')
            elif k == 'wave': step(T['waveLength'] + .5) if e['phase'] == 'wave' else click('f8-look-around')
            elif k == 'loose': click('f8-wrist-in')
            elif k == 'unwet': click('f8-avert') if e['phase'] == 'seen' else step(T['unwetWait'] + .5)
            elif k == 'whistle': click({'blow': 'f8-freeze', 'frozen': 'f8-check-tower', 'empty': 'f8-leave-water'}[e['phase']])
            elif k == 'float': click('f8-call-lifeguard')
            elif k == 'sunbed': click('f8-bed-' + d['band']['sunbed'])
            elif k == 'broadcast': step(T['broadcastLength'] + .5)
            elif k == 'spaWait': click('f8-enter-bath')
            elif k == 'bath': click('f8-exit-bath')
            elif k == 'slideWait': click('f8-ride')
            elif k == 'ride':
                if e['curves'] == 3: step(T['curveGap'] * 4 + .5)
                else:
                    for _ in range(4): step(T['curveGap']); click('f8-count')
                    for b in ['f8-arms', 'f8-wall', 'f8-slow', 'f8-stop', 'f8-emergency']: click(b)
            elif k == 'injury': click('f8-decline')
            elif k == 'order': click('f8-order-0')
            elif k == 'unordered': click('f8-eat-all')
            elif k == 'ask': click('f8-not-today')
            elif k == 'photoNormal': click('f8-skip-photo')
            elif k == 'mascot': click('f8-back-away')
            elif k == 'stay': click('f8-refuse')
            elif k == 'blocked': click('f8-emergency')
            elif k == 'statement': click('f8-return-band' if e['paid'] else 'f8-pay')
            else: raise AssertionError('no solver for %r at %s' % (k, s))
            assert state()['status'] in ('active', 'cleared'), (s, k, state().get('reason'))

        def to(stage_id, **force):
            """Play every earlier stage correctly and arrive (stage begun) at `stage_id`."""
            fresh(force)
            guard = 0
            while not (sid() == stage_id and data()['started']):
                guard += 1; assert guard < 200, 'stage not reached: ' + stage_id
                solve_one()

        story_before = page.evaluate(f"localStorage.getItem('{STORY_KEY}')")

        # --- 0. Rule document: one canon (reviewed transcript -> 8화.txt -> Story window -> Field panel) -------------------
        story_doc = page.evaluate("document.querySelector('#darkwebReportWindowEP8 textarea').value").replace('\r\n', '\n').strip()
        txt = (ROOT / '8화.txt').read_text(encoding='utf-8').replace('\r\n', '\n').strip()
        assert story_doc == txt, 'index.html Story window must equal 8화.txt'
        transcript = (ROOT / 'docs/transcripts/reviewed/EP08_유성_워터파크.txt').read_text(encoding='utf-8-sig')
        for marker in ['손목 밴드는 퇴장 전까지 어떠한 경우에도 풀지 마십시오', '헐거워졌다고 느껴지더라도 조이지 마시고', '손목을 몸쪽으로 붙인 채',
                       '최대한 빠르게 힘껏 안전 요원을 불러 주십시오', '즉시 호흡을 멈추신 뒤 탈의실 밖으로 나오신 후 안내 데스크에 신고',
                       '변종 에볼라 바이러스', '“오늘 수술받는 날이 아니었니?”', '매시 정각과 30분', '1회 15분간', '혼자만 젖지 않은 사람',
                       '수습된 유해에서는 혈액이 검출되지 않았습니다', '성인 고객을 안내 방송으로 호출하지 않습니다', '1회 입욕 시간은 15분',
                       '수술 대상으로 분류됩니다', '네 번째 곡선은 존재하지 않습니다', '마취 없이 개복된 상태', '“오늘은 아닙니다.”라고만',
                       '해당 날짜에 반드시 수술을 받게 됨', '4시간 이상 방치된 물품', '분실물 센터에 부위별로 분류', '수술실로 안내하는 사람이 있을 시 정중하게 거절',
                       '2인 이상의 인솔 직원', '캐릭터 내부에서 으깨진 채로', '붉은색 수영복', '검은색 수영복 반바지', '양쪽 갈비뼈 골절',
                       '오후 6시', '조금 더 놀고 가자고', '긴급 전화 버튼', '이의를 제기하거나 환불을 요구하지 마십시오', '결제 기록에는 오류가 발생하지 않습니다',
                       '2021년 한 차례 임시 폐쇄', '변종 콜레라 바이러스', '영업 중단을 요청하는 민원', '0050-0200']:
            assert marker in txt, marker
            assert marker.replace('“', '').replace('”', '') in transcript.replace('“', '').replace('”', ''), 'marker not in transcript: ' + marker
        for forbidden in ['문서 번호', '워터파크-2021-08-YWP', '개정', '시행 일자', '부착 위치', '경영지원실', '밴드 반납 게이트']:
            assert forbidden not in txt, forbidden
        assert page.evaluate("EPISODE_DOCS[8]") == '' and page.evaluate("EPISODE_TITLES[8]") == '유성 워터파크'
        assert page.evaluate("CLUES.filter(c => c.ep === 8).every(c => document.querySelector('#darkwebReportWindowEP8 textarea').value.includes(c.quote))")
        assert page.evaluate("runEpisode(8).lines[0]") == '> EP.08 유성 워터파크', 'no document number and no "undefined" in the terminal'
        print('PASS 0 rule document: 8화.txt == Story window; every rule/consequence from the reviewed transcript kept; no document number or unsourced metadata; clue quotes valid')

        # --- 1. Unlock ---------------------------------------------------------------------------------------------------
        click('field-open')
        assert page.locator('#field-dispatch-EP08').inner_text() == '연결 제한' and page.locator('#field-dispatch-EP08').is_disabled()
        page.evaluate("for (const id of ['EP01','EP02','EP03','EP04','EP05','EP06']) FieldSave.clear(id, { patrols: {}, elapsed: 700, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP08').inner_text() == '연결 제한', 'EP08 stays locked until EP07 is cleared'
        page.evaluate("FieldSave.clear('EP07', { patrols: {}, elapsed: 300, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP08').inner_text() == '파견 가능' and not page.locator('#field-dispatch-EP08').is_disabled()
        assert page.locator('#field-dispatch-EP09').inner_text() == '연결 제한'
        print('PASS 1 EP08 locked until EP07 clear, then dispatchable; EP09 still locked')

        # --- 2. UI: map + wristband, no spoiler ---------------------------------------------------------------------------
        page.evaluate("""(() => { window.__hooks = []; const add = (kind, fn) => FieldCore.hooks.add(kind, fn);
            add('onEpisodeStart', id => window.__hooks.push(['onEpisodeStart', id]));
            add('onMajorEvent', (id, event) => window.__hooks.push(['onMajorEvent', id, event]));
            add('onEpisodeClear', id => window.__hooks.push(['onEpisodeClear', id])); })()""")
        fresh()
        assert page.locator('.field-hud > *').count() == 3 and page.locator('#f8-map button').count() == 12
        for z in ['입구', '사물함 / 탈의실', '키즈존', '파도풀', '온천 스파', '워터 슬라이드', '푸드코트', '선베드 / 파라솔', '캐릭터 포토존', '안전요원대', '안내 데스크', '출구']:
            assert z in page.locator('#f8-map').inner_text(), z
        assert '여름엔 유성' in log_text()
        visible = page.locator('#f8-scene').inner_text() + page.locator('.field-hud').inner_text() + page.locator('#f8-actions').inner_text() + page.locator('#f8-band').inner_text()
        for secret in ['LOCKER_BREATH', 'UNWET', 'SLIDE_END', 'true', 'false', 'stage', 'phantom', '정답']:
            assert secret not in visible, secret
        click('f8-wear-band'); assert data()['band']['attached'] and '사물함 214번' in page.locator('#f8-band').inner_text() and '선베드 C-07' in page.locator('#f8-band').inner_text()
        assert '다음 이용 안내: 사물함 / 탈의실' in page.locator('#f8-band').inner_text()
        click('f8-remove-band'); dead('BAND_REMOVED')
        print('PASS UI: HUD = clock / zone / band; 12-zone map; wristband shows locker/sunbed/next stop; no flag/fail code on screen; removing the band fails')

        # --- 3. Locker / changing room -------------------------------------------------------------------------------------
        to('locker'); click('f8-locker-108'); assert '열리지 않는다' in log_text() and ev()['kind'] == 'lockerUse'
        click('f8-locker-214'); assert ev()['kind'] == 'lockerOpen' and '스스로 열린다' in log_text()
        step(T['breathDeadline'] + .3); dead('LOCKER_BREATH'); assert '변종 에볼라' in state()['reason']
        to('locker'); click('f8-locker-214'); click('f8-look-locker'); dead('LOCKER_LOOK')
        to('locker'); click('f8-locker-214'); click('f8-move-desk'); dead('LOCKER_BREATH')   # left still breathing
        to('locker'); click('f8-locker-214'); click('f8-hold-breath'); step(T['breathHold'] + .3); dead('LOCKER_BREATH')   # stayed too long
        to('locker'); click('f8-locker-214'); click('f8-hold-breath'); click('f8-move-kids')
        assert state()['status'] == 'active' and sid() == 'lockerReport' and '탈의실 밖으로' in log_text()
        click('f8-move-desk'); click('f8-report-desk'); assert sid() == 'lostChild' and '신고를 접수' in log_text()
        print('PASS locker: only the assigned locker opens; an unassigned one opening -> stop breathing, leave, report at the desk; breathing/looking/lingering fail')

        # --- 4. Kids zone ---------------------------------------------------------------------------------------------------
        to('lostChild'); click('f8-hold-hand'); dead('CHILD_HAND')
        to('lostChild'); click('f8-move-desk'); assert sid() == 'lostChildReport'; click('f8-report-desk'); assert '미아 인계' in log_text()
        to('aloneChild'); assert '손 잡아 주세요.' in log_text()
        click('f8-give-hand'); dead('CHILD_HAND')
        to('aloneChild'); click('f8-lead-desk'); dead('CHILD_HAND')
        to('aloneChild'); click('f8-ask-parent'); dead('CHILD_WORDS')
        to('aloneChild'); click('f8-say-line'); assert '오늘 수술받는 날이 아니었니?' in log_text() and '도망쳤다' in log_text() and sid() == 'wave1'
        print('PASS kids: a lost child is handed over through the desk (never by the hand); the lone child gets the exact canon line and runs')

        # --- 5. Wave pool: wave -> end -> look around; loose band; unwet person ---------------------------------------------
        to('wave1'); assert '11:00' in log_text() and not has('f8-look-around')
        step(T['waveLength'] + .5); assert '파도가 물러갔다' in log_text(); click('f8-look-around'); assert '모두 젖은 채' in log_text()
        click('f8-tighten'); dead('BAND_TIGHTENED')
        to('wave1'); step(T['waveLength'] + .5); click('f8-look-around'); click('f8-wrist-in'); assert sid() == 'wave2'
        step(T['waveLength'] + .5); click('f8-look-around'); assert '물기 하나 없이' in log_text()
        click('f8-meet-eyes'); dead('UNWET'); assert '혈액이 검출되지 않았습니다' in state()['reason']
        to('wave2'); step(T['waveLength'] + .5); click('f8-look-around'); click('f8-talk-unwet'); dead('UNWET')
        to('wave2'); step(T['waveLength'] + .5); click('f8-look-around'); click('f8-avert'); click('f8-move-spa'); dead('UNWET')
        to('wave2'); step(T['waveLength'] + .5); click('f8-look-around'); step(T['whistleFreeze'] + 1.5); dead('UNWET')
        to('wave2'); step(T['waveLength'] + .5); click('f8-look-around'); click('f8-avert'); step(T['unwetWait'] + .5)
        assert state()['status'] == 'active' and sid() == 'whistle' and '보이지 않는다' in log_text()
        print('PASS wave pool: wave -> recede -> look around; tightening the loose band fails; the unwet person: eye contact/talk/move/staring fail, eyes down and still until the next wave passes')

        # --- 6. Whistle / lifeguard tower ----------------------------------------------------------------------------------
        to('whistle'); click('f8-keep-swim'); dead('WHISTLE_MOVE')
        to('whistle'); step(T['whistleFreeze'] + .3); dead('WHISTLE_MOVE')
        to('whistle'); click('f8-freeze'); click('f8-check-tower'); assert '붉은색 수영복' in log_text() and ev()['round'] == 2
        click('f8-freeze'); click('f8-check-tower'); assert '비어 있다' in log_text() and '검은색 수영복 반바지' in log_text()
        click('f8-stay-water'); dead('WHISTLE_STAY'); assert '갈비뼈' in state()['reason']
        to('whistle'); click('f8-freeze'); click('f8-check-tower'); click('f8-freeze'); click('f8-check-tower'); click('f8-ask-black'); dead('WHISTLE_STAY')
        to('whistle'); click('f8-freeze'); click('f8-check-tower'); click('f8-freeze'); click('f8-check-tower'); step(T['leaveWater'] + .3); dead('WHISTLE_STAY')
        to('whistle'); click('f8-freeze'); click('f8-check-tower'); click('f8-freeze'); click('f8-check-tower'); click('f8-leave-water')
        assert state()['status'] == 'active' and sid() == 'bandFloat'
        print('PASS whistle: stop at once, check the nearest tower; manned -> carry on; empty -> out of the water now; staying/asking the black-shorts lifeguard fails')

        # --- 7. Band floats ------------------------------------------------------------------------------------------------
        to('bandFloat'); assert '저절로 풀려 물 위에 떠올랐다' in log_text()
        click('f8-grab-band'); dead('BAND_FLOAT')
        to('bandFloat'); step(T['bandCall'] + .3); dead('BAND_FLOAT')
        to('bandFloat'); click('f8-call-lifeguard'); assert data()['band']['issued'] == 2 and '재지급' in log_text() and '재지급' in page.locator('.field-hud').inner_text()
        assert data()['band']['locker'] == 214 and sid() == 'sunbed'
        print('PASS band: a band floating loose -> call the lifeguard at once -> reissued (same locker/sunbed); grabbing it or waiting fails')

        # --- 8. Sunbed + announcements --------------------------------------------------------------------------------------
        to('sunbed'); click('f8-bed-B-12'); dead('SUNBED'); assert '분실물 센터' in state()['reason']
        to('sunbed'); click('f8-bed-D-03'); dead('SUNBED')
        to('sunbed'); click('f8-bed-C-07'); assert ev()['kind'] == 'broadcast' and ev()['round'] == 1 and '미아 보호자' in log_text()
        click('f8-answer'); assert state()['status'] == 'active'   # a normal announcement is harmless
        step(T['broadcastLength'] + .5); assert '귀하의 성함' in log_text() and ev()['round'] == 2
        click('f8-answer'); dead('BROADCAST')
        to('sunbed'); click('f8-bed-C-07'); step(T['broadcastLength'] + .5); click('f8-move-desk'); dead('BROADCAST')
        to('sunbed'); click('f8-bed-C-07'); step(T['broadcastLength'] + .5); step(T['broadcastLength'] + .5); assert state()['status'] == 'active' and sid() == 'spa'
        print('PASS sunbed/broadcast: only the band-assigned sunbed; a normal announcement vs. your own name called: answering or going to the desk fails, ignoring passes')

        # --- 9. Spa ----------------------------------------------------------------------------------------------------------
        to('spa'); click('f8-enter-bath'); step(T['thirstAt'] + .3); assert '목이 타들어' in log_text(); click('f8-drink'); dead('SPA_DRINK'); assert '수술 대상' in state()['reason']
        to('spa'); click('f8-enter-bath'); step(T['bathLength'] + .3); assert '안내종' in log_text(); step(T['bellExit'] + .3); dead('SPA_LATE')
        to('spa'); click('f8-enter-bath'); step(T['thirstAt'] + .3); click('f8-endure'); step(T['bathLength'] - T['thirstAt']); click('f8-exit-bath')
        assert state()['status'] == 'active' and sid() == 'slide1'
        print('PASS spa: 15-minute soak; drinking in the bath fails; staying after the bell fails; enduring and leaving at the bell passes')

        # --- 10. Slide: count 3 curves; 4th curve QTE -----------------------------------------------------------------------
        to('slide1'); click('f8-ride')
        for _ in range(3): step(T['curveGap']); click('f8-count')
        assert ev()['count'] == 3; click('f8-arms'); assert '제대로 버티지 못했다' in log_text()
        step(T['curveGap'] + .3); assert '도착 지점' in log_text() and sid() == 'injury'
        click('f8-follow'); dead('INJURY_FOLLOW')
        to('injury'); assert '수술실로 안내' in log_text(); click('f8-decline'); assert sid() == 'injuryReport'
        click('f8-move-desk'); click('f8-report-desk'); assert '부상을 접수' in log_text() and sid() == 'slide2'
        to('slide2'); click('f8-ride')
        for _ in range(4): step(T['curveGap'])
        step(T['slideStop'] + .3); dead('SLIDE_END'); assert '마취 없이 개복' in state()['reason']   # never counted the 4th curve
        to('slide2'); click('f8-ride')
        for _ in range(4): step(T['curveGap']); click('f8-count')
        click('f8-wall'); assert '계속 미끄러진다' in log_text()   # out of order
        step(T['slideStop'] + .3); dead('SLIDE_END')
        to('slide2'); click('f8-ride')
        for _ in range(4): step(T['curveGap']); click('f8-count')
        for b in ['f8-arms', 'f8-wall', 'f8-slow', 'f8-stop']: click(b)
        assert ev()['stopped']; step(10); assert state()['status'] == 'active', 'stopped riders do not arrive'
        click('f8-emergency'); assert '구조 요청' in log_text() and sid() == 'food'
        print('PASS slide: the player counts curves; 3 -> arrival; 4th curve -> arms, wall, slow, stop, emergency call in order; reaching the end fails; injury -> decline the surgery-room guide, report at the desk')

        # --- 11. Food court ------------------------------------------------------------------------------------------------
        to('food'); click('f8-order-1'); assert '주문하지 않은 맑은 국' in log_text() and data()['band']['purchases'][-1]['price'] == 5500
        click('f8-leave-food'); dead('FOOD_LEFT')
        to('food'); click('f8-order-0'); click('f8-return-food'); dead('FOOD_LEFT')
        to('food'); click('f8-order-0'); click('f8-eat-all'); assert '언제 수술이십니까?' in log_text()
        click('f8-answer-date'); dead('SURGERY_DATE'); assert '해당 날짜에 반드시 수술' in state()['reason']
        to('food'); click('f8-order-0'); click('f8-eat-all'); click('f8-answer-other'); dead('SURGERY_OTHER')
        to('food'); click('f8-order-0'); click('f8-eat-all'); click('f8-not-today'); assert '"오늘은 아닙니다."' in log_text() and sid() == 'photo'
        print('PASS food: the unordered dish is eaten in full (leaving/returning fails); "언제 수술이십니까?" -> only "오늘은 아닙니다."; a date or any other answer fails')

        # --- 12. Photo zone ------------------------------------------------------------------------------------------------
        to('photo'); assert '인솔 직원 두 명' in log_text(); click('f8-take-photo'); assert '혼자 걸어 나온다' in log_text()
        click('f8-approach-mascot'); dead('CHARACTER'); assert '으깨진' in state()['reason']
        for bad in ['f8-run-away', 'f8-photo-mascot', 'f8-move-exit']:
            to('photo'); click('f8-skip-photo'); click(bad); dead('CHARACTER')
        to('photo'); click('f8-skip-photo'); click('f8-back-away'); assert sid() == 'closing'
        print('PASS photo zone: character with two staff is normal; alone -> back away toward the crowd without showing your back; approaching/photo/running/walking off fails')

        # --- 13. Closing ---------------------------------------------------------------------------------------------------
        to('closing'); assert '18:00 폐장' in log_text() and '조금 더 놀고 가자.' in log_text() and '환자 여러분' in log_text()
        click('f8-play-more'); dead('CLOSING_STAY')
        to('closing'); click('f8-refuse'); assert '막아선다' in log_text(); click('f8-shove'); dead('CLOSING_FORCE')
        to('closing'); click('f8-refuse'); click('f8-emergency'); assert '손을 놓았다' in log_text() and sid() == 'retrieve'
        print('PASS closing: 18:00 broadcast; "조금 더 놀고 가자." -> refuse politely; physically blocked -> emergency-call button; staying or shoving fails')

        # --- 14. Settlement -------------------------------------------------------------------------------------------------
        to('settle'); assert '이용한 적 없는 결제' in log_text() and '힐링존 추가 이용' in page.locator('#f8-panel').inner_text()
        click('f8-dispute'); dead('SETTLE_DISPUTE')
        to('settle'); click('f8-refund'); dead('SETTLE_DISPUTE')
        print('PASS settlement: unrecognised charges on the statement; disputing or asking for a refund fails')

        # --- 15. Full clear: EP09 unlock only, Story untouched -------------------------------------------------------------
        to('settle'); total = page.evaluate("FieldCore.mission('EP08').total(FieldCore.get().data)")
        click('f8-pay'); assert ('%s원' % format(total, ',')) in log_text() and not has('f8-pay')
        click('f8-return-band')
        s = state(); assert s['status'] == 'cleared', (s['status'], s.get('reason'))
        assert page.evaluate("FieldSave.get().cleared.includes('EP08') && FieldSave.unlocked('EP09')")
        assert not page.evaluate("FieldSave.get().cleared.includes('EP09')") and not page.evaluate("FieldSave.unlocked('EP10')")
        click('field-list'); assert page.locator('#field-dispatch-EP09').inner_text() == '파견 가능' and not page.locator('#field-dispatch-EP09').is_disabled()  # EP09 is implemented now
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before, 'Story save must be untouched'
        assert page.evaluate("!FieldSave.get().progress?.EP08"), 'EP08 does not persist mid-run snapshots'
        hooks = page.evaluate('window.__hooks')
        assert ['onEpisodeStart', 'EP08'] in hooks and ['onEpisodeClear', 'EP08'] in hooks and any(h[0] == 'onMajorEvent' and h[1] == 'EP08' for h in hooks) and all(len(h) <= 3 for h in hooks)
        print('PASS full clear: pay as shown -> return band -> EP09 Field-only unlock; EP10 locked; Story save byte-identical; AUTHOR hooks (ids only)')

        # --- 16. Save Code v5 round-trip -----------------------------------------------------------------------------------
        code = page.evaluate("GameSave.exportCode()"); story_code = page.evaluate("GameSave.exportStoryCode()")
        assert page.evaluate("(c) => GameSave.importCode(c)", code)
        assert page.evaluate("FieldSave.get().cleared.includes('EP08')") and page.evaluate("GameSave.exportStoryCode()") == story_code
        print('PASS save: v5 export/import round-trip carries the EP08 clear; v4 Story code unchanged')

        # --- 17. Mobile touch --------------------------------------------------------------------------------------------------
        fresh(); tap('f8-wear-band'); tap('f8-move-locker'); tap('f8-locker-214'); tap('f8-hold-breath'); tap('f8-move-desk'); tap('f8-report-desk')
        assert state()['status'] == 'active' and sid() == 'lostChild'
        to('slide2'); tap('f8-ride')
        for _ in range(4): step(T['curveGap']); tap('f8-count')
        for b in ['f8-arms', 'f8-wall', 'f8-slow', 'f8-stop', 'f8-emergency']: tap(b)
        assert state()['status'] == 'active' and sid() == 'food'
        print('PASS mobile: map movement, band, locker, slide count/QTE and emergency button all work with tap()')

        assert not errors, errors
        browser.close()
        print('ALL EP08 CHECKS PASSED')


if __name__ == '__main__':
    run()
