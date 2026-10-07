"""EP05 (애기소 / 10-minute extraction + contact triage) Field browser smoke test. Requires Python Playwright and Chromium plus the Express server:
    npm start   then   python tests/ep05_browser_smoke.py
Uses isolated browser storage and the production FieldCore.step clock. FieldEP05Data.random(name) is pinned so the target's zone, kind
(a string forces 'clean'|'numb'|'overstay'|'survivor'), the wet path, and the C/D/F triggers are deterministic. No real save is read or changed.
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
            # Freeze the wall clock FieldCore reads, so only FieldCore.step() advances the 10-minute timer (exact-second assertions).
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
        def labels(): return set(b.inner_text() for b in page.locator('#f5-actions button').all())
        def finish(pill=False):
            """Let the current timed action (travel, search, question) complete. pill=True takes the red pill the moment the sound is heard."""
            page.evaluate('(pill) => { let n = 0; while (FieldCore.get().status === "active" && FieldCore.get().data.busy && n++ < 400) { FieldCore.step(.5); if (pill && FieldCore.get().data.c === "sound") FieldCore.action("pill"); } }', pill)
        def fresh(force=None, quiet=True):
            page.evaluate("""(force) => { window.__force = force || {};
                FieldEP05Data.random = name => (name in window.__force ? window.__force[name] : (name === 'kind' ? 'clean' : name === 'miss' ? 0.99 : name === 'wetSide' ? 0.9 : name === 'reflect' ? 0.99 : 0.5));
                FieldUI.close(); FieldUI.open(); }""", force or {})
            click('field-dispatch-new-EP05' if has('field-dispatch-new-EP05') else 'field-dispatch-EP05')
            assert state()['status'] == 'active' and data()['phase'] == 'briefing'
            if quiet: setd(cAt=99999, dAt=99999, reflect=False)
        def begin(force=None, quiet=True):
            fresh(force, quiet); click('f5-inject'); click('f5-enter')
            assert data()['phase'] == 'inside' and data()['timer'] == 600
        def dead(code):
            s = state(); assert s['status'] == 'dead' and data()['failCode'] == code and s['reason'].startswith(code), (code, s['status'], data()['failCode'], s['reason'])
        def go(value, pill=False): action('go', value); finish(pill)
        def to_target(zone):
            """Walk to the target zone along safe paths (wet path is R by default; always take L)."""
            path = {'trail': ['trail'], 'woods': ['trail', 'woods'], 'shore': ['trail', 'woods', 'shore:L']}[zone]
            for stop in path: go(stop)
            assert data()['zone'] == zone, data()['zone']
        def secure_target(zone='woods', **force):
            begin({'targetZone': {'trail': 0.1, 'woods': 0.5, 'shore': 0.9}[zone], **force}); to_target(zone)
            action('search'); finish(); assert data()['found']
            action('secure'); finish(); assert data()['secured']

        story_before = page.evaluate(f"localStorage.getItem('{STORY_KEY}')")
        # --- 0. Rule document: one canon (transcript -> 5화.txt -> Story window -> Field panel) ---------------------------
        story_doc = page.evaluate("document.querySelector('#darkwebReportWindowEP5 textarea').value").replace('\r\n', '\n').strip()
        txt = (ROOT / '5화.txt').read_text(encoding='utf-8').replace('\r\n', '\n').strip()
        assert story_doc == txt, 'index.html Story window must equal 5화.txt'
        transcript = (ROOT / 'docs/transcripts/reviewed/EP05_애기소.txt').read_text(encoding='utf-8-sig')
        body = '\n'.join(line for line in transcript.splitlines() if line.strip() and not re.match(r'^\d\d:\d\d$', line.strip()) and not line.startswith('[') and 'generated by AI' not in line)
        for marker in ['[0] 개요 / 현황', '[1] 기본 수칙', '[2] 확인된 비정상 상황 및 대응 지침', '■ 상황 A: 해당 항목은 삭제되었습니다.', '■ 상황 B', '■ 상황 C', '■ 상황 D', '■ 상황 E', '■ 상황 F', '[!] 최종 경고', '문서 번호: 2024-06-02', '강원도 홍천군 살둔계곡 내 애기소', '0050-0200', '약 30시간에 걸쳐', '반경 500m', '각성제의 효력은 정확히 10분입니다', '3인 1조', '반경 1km', '1500명', '물처럼 보이는 하나의 거대한 고체 덩어리', '물에 젖듯 그대로 스며들어', '문지르거나 씻어내지 마십시오', '압박 붕대나 얼음찜질', '고통 없는 마지막이 가능한 시설', '비상 프로토콜 A 완전 격리 시스템', '빨간 알약을 즉시 복용하십시오', '소형 EMP 폭탄', 'B급 정신 치료 시설', '애기소 현장 투입팀 구조 매뉴얼', '발견 즉시 확보 개체 91번 검은 것을 방사하여 애기소를 완전히 칠하십시오.']:
            assert marker in txt, marker
        a_block = txt.split('■ 상황 A')[1].split('■ 상황 B')[0].strip()
        assert a_block == ': 해당 항목은 삭제되었습니다.', a_block   # situation A stays deleted: nothing restored
        for forbidden in ['통제구역-2024', '개정', '시행 일자', '부착 위치', '외부 게시 불가', '열람 금지', '아기소', '재난안전대책본부', '수심 수십', '청량한 물소리', '5m 이상', '철책', '스프레이', '최면성 침수 충동',
                          '통제 등급', '좌표', '시설명']:
            assert forbidden not in txt, forbidden
        assert page.evaluate("EPISODE_DOCS[5]") == '2024-06-02' and page.evaluate("EPISODE_TITLES[5]") == '살둔계곡 애기소'
        assert page.evaluate("CLUES.filter(c => c.ep === 5).every(c => document.querySelector('#darkwebReportWindowEP5 textarea').value.includes(c.quote))")
        assert page.evaluate("MESSENGER_GENERIC.hq.filter(m => m.ep === 5).every(m => document.querySelector('#darkwebReportWindowEP5 textarea').value.includes(m.quote))")
        assert '아기소' not in page.evaluate("document.documentElement.innerHTML") and '아기소' not in (ROOT / 'app.js').read_text(encoding='utf-8')
        for name in ['ep05-data.js', 'ep05.js', 'ep05-ui.js']:
            src = (ROOT / 'field/ep05' / name).read_text(encoding='utf-8')
            assert 'AudioContext' not in src and 'new Audio' not in src and '<audio' not in src, 'dangerous sounds are never played'
        print('PASS 0 rule document: the manual keeps its game-critical phrases and every Story quote from 5화.txt; Story window == 5화.txt; A stays deleted; F sentence verbatim; doc no. 2024-06-02; 애기소; no unsourced metadata; clue quotes valid')

        # --- 1. Unlock ------------------------------------------------------------------------------------------------
        click('field-open')
        assert page.locator('#field-dispatch-EP05').is_disabled() and page.locator('#field-dispatch-EP05').inner_text() == '연결 제한'
        page.evaluate("for (const id of ['EP01', 'EP02', 'EP03']) FieldSave.clear(id, { patrols: {}, elapsed: 700, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP05').inner_text() == '연결 제한', 'EP05 stays locked until EP04 is cleared'
        page.evaluate("FieldSave.clear('EP04', { patrols: {}, elapsed: 300, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP05').inner_text() == '파견 가능' and not page.locator('#field-dispatch-EP05').is_disabled()
        assert page.locator('#field-dispatch-EP06').inner_text() == '연결 제한'
        print('PASS 1 EP05 locked until EP04 clear, then dispatchable; EP06 still locked')

        # --- 2. Briefing: nothing is running, nothing is spoiled ---------------------------------------------------------
        page.evaluate("""(() => { window.__hooks = []; const add = (kind, fn) => FieldCore.hooks.add(kind, fn);
            add('onEpisodeStart', id => window.__hooks.push(['onEpisodeStart', id]));
            add('onMajorEvent', (id, event) => window.__hooks.push(['onMajorEvent', id, event]));
            add('onEpisodeClear', id => window.__hooks.push(['onEpisodeClear', id])); })()""")
        fresh()
        assert labels() == {'장비를 점검한다', '각성제를 주입한다', '반경 500m 안으로 진입한다'}, labels()
        assert page.locator('#f5-timer').inner_text() == '각성제 미주입' and '외부' in page.locator('#f5-radius').inner_text() and '브리핑' in page.locator('#f5-status').inner_text()
        assert 'TEAM 3' in page.locator('#f5-team').inner_text()
        step(120); assert data()['timer'] == 600 and data()['phase'] == 'briefing', 'the timer does not run during the briefing'
        click('f5-tab-record'); assert '확인되지 않음' in page.locator('#f5-record').inner_text()
        click('f5-tab-rules'); assert '문서 번호: 2024-06-02' in page.locator('#field-tools').inner_text() and '■ 상황 F' in page.locator('#field-tools').inner_text()
        click('f5-inject'); assert data()['injected'] and '주입했다' in log_text()
        step(60); assert data()['timer'] == 600, 'injecting is not entering: the timer starts at the radius'
        fresh(); click('f5-enter'); dead('NO_STIMULANT')
        print('PASS briefing: only equipment/inject/enter; no timer before entering; the rules are readable; entering without the stimulant fails (system)')

        # --- 3. The 10-minute timer ---------------------------------------------------------------------------------------
        begin()
        assert page.locator('#f5-timer').inner_text() == '각성제 10:00' and '내부' in page.locator('#f5-radius').inner_text() and '● ● ●' in page.locator('#f5-team').inner_text()
        step(1); assert data()['timer'] == 599
        click('f5-tab-rules'); click('f5-tab-record'); click('f5-tab-equip'); step(1); assert data()['timer'] == 598, 'reading the rules or records never pauses the timer'
        step(599.75 - 2); assert state()['status'] == 'active' and abs(data()['timer'] - 0.25) < 1e-6
        step(.25); dead('TIME_OUT'); assert '스스로 애기소를 향해 걸어 들어가며' in state()['reason']
        begin(); action('go', 'trail'); step(10); assert data()['busy'] and data()['timer'] == 590, 'travel and actions cost real time from the same timer'
        print('PASS timer: starts at entry, exactly 10:00 real seconds, reading does not pause it, 0:00 = canon failure (hypnosis takes over)')

        # --- 4. Operation basics ---------------------------------------------------------------------------------------
        begin()
        assert labels() == {'주변을 살핀다', '계곡 길 쪽으로 들어간다', '반경 밖으로 이탈한다'}, labels()
        for secret in ['빨간 알약', 'EMP', '91번', '밀폐', '압박', '얼음', '문지른', '씻어', '보고', '확보한다', '체류', '저림', '후송']:
            assert not any(secret in label for label in labels()), secret
        action('exit'); dead('ABORTED')
        begin(); go('trail'); assert data()['zone'] == 'trail' and data()['timer'] == 565
        action('search'); finish(); assert '대상자는 보이지 않는다' in log_text() and data()['timer'] == 550
        action('look'); action('go', 'woods'); assert data()['zone'] == 'trail', 'no second action while one is under way'
        print('PASS operation: contextual start actions only; leaving without the target = failure (system); moves/search cost time; no overlapping actions')

        # --- 5. Contact ----------------------------------------------------------------------------------------------------
        begin(); go('trail'); go('woods'); action('look'); finish()
        assert '오른쪽 길에는 젖은 것처럼 보이는 표면이 닿아 있다' in log_text() and '물' not in page.locator('#f5-text').inner_text().replace('웅덩이', '').replace('젖은', '').replace('물에', '')
        go('shore:L'); assert data()['zone'] == 'shore' and data()['contact'] == 'none', 'the dry path is safe'
        begin(); go('trail'); go('woods'); go('shore:R')
        assert data()['contact'] == 'touched' and '신발이 표면에 스쳤다' in log_text() and '물에 젖듯 그대로 스며든다' in log_text(), 'a brush with a shoe counts as contact'
        assert {'구조 요원에게 보고한다', '접촉 부위를 문지른다', '접촉 부위를 씻어낸다'} <= labels() and not any('압박' in l or '얼음' in l for l in labels()), 'compress / ice only appear once swelling begins'
        assert '접촉 의심' in (click('f5-tab-record') or page.locator('#f5-record').inner_text())
        step(24); assert data()['contact'] == 'touched'
        step(1.5); assert data()['contact'] == 'numb' and '경미한 저림' in log_text()
        step(45); assert data()['contact'] == 'swelling' and '부종이 시작된다' in log_text() and {'압박 붕대로 감는다', '얼음찜질을 한다'} <= labels()
        step(45); assert data()['contact'] == 'expanding' and '전신이 팽창하기 시작한다' in log_text()
        step(40); dead('CONTACT_PROGRESSION'); assert '파열음과 함께 사망' in state()['reason']
        begin(); go('trail'); go('woods'); go('shore:R'); click('f5-contact-rub'); assert data()['rate'] == 2.5 and '더 빠르게 진행된다' in log_text()
        step(60); assert state()['status'] == 'dead' and data()['failCode'] == 'CONTACT_PROGRESSION', 'rubbing speeds the progression up'
        begin(); go('trail'); go('woods'); go('shore:R'); click('f5-contact-wash'); assert data()['rate'] == 2.5 and '씻어냈다' in log_text()
        begin(); go('trail'); go('woods'); go('shore:R'); click('f5-contact-report'); dead('CONTACT_REPORTED'); assert '고통 없는 마지막이 가능한 시설' in state()['reason']
        for control in ['f5-contact-compress', 'f5-contact-ice']:
            begin(); go('trail'); go('woods'); go('shore:R'); step(75); click(control); dead('CONTACT_PRESSURE'); assert '즉발적으로 팽창, 파열' in state()['reason']
        secure_target('shore'); go('woods:R'); dead('TARGET_CONTACTED')
        secure_target('shore'); go('woods:L'); assert state()['status'] == 'active' and data()['contact'] == 'none'
        print('PASS contact: a shoe brush is contact; numbness -> swelling -> whole-body swelling -> death (compressed); rubbing/washing speed it up; compress/ice only after swelling and fatal; reporting; the target can be contacted too')

        # --- 6. A: deleted ---------------------------------------------------------------------------------------------------
        events = page.evaluate("window.__hooks.filter(h => h[0] === 'onMajorEvent').map(h => h[2])")
        assert not any(e.startswith('A_') or e == 'A' for e in events), events
        assert not any('A' == k for k in page.evaluate("Object.keys(FieldEP05Data.text)")) and '상황 A' not in log_text()
        print('PASS A: deleted in the source; no gameplay event, no text')

        # --- 7. C: a sound even after the stimulant -----------------------------------------------------------------------
        begin(); setd(cAt=30, cKind=0)
        assert not has('f5-pill')
        step(29); assert not has('f5-pill'); step(1.5)
        assert data()['c'] == 'sound' and has('f5-pill') and '아기의 울음소리' in log_text() and '주입했는데도' in log_text()
        step(10); click('f5-pill'); assert data()['c'] == 'done' and not has('f5-pill') and state()['status'] == 'active' and '빨간 알약' in log_text()
        step(60); assert state()['status'] == 'active'
        begin(); setd(cAt=10, cKind=1); step(11); assert '아이의 웃음소리' in log_text(); step(23); assert state()['status'] == 'active'; step(2); dead('C_UNRESOLVED')
        assert '2021년 통제 인원 전원이 사망한 원인으로 지목된 소리와 동일한 유형' in state()['reason']
        print('PASS C: crying/laughing after the stimulant; the red pill only appears with the sound; taking it continues; not answering in time = canon failure')

        # --- 8. D: the communication gear -----------------------------------------------------------------------------------
        begin(); setd(dAt=20); step(19); assert not has('f5-d-play'); step(2)
        assert data()['dev'] == 'alert' and '통신 장비' in log_text() and {'소리가 담긴 파일을 재생한다', '소형 EMP 폭탄을 사용한다', '해당 장비와 구역을 완전 밀폐한다', '본부에 보고한다'} <= labels()
        click('f5-d-play'); dead('D_PLAYED'); assert '실제 노출과 동일하게 치명적' in state()['reason']
        assert page.locator('#f5-wave').is_visible() and '재생 차단' in page.locator('#f5-wave').inner_text() and page.locator('audio').count() == 0, 'the sound is blocked, never played'
        begin(); setd(dAt=1); step(2); click('f5-d-seal'); dead('D_ORDER')
        begin(); setd(dAt=1); step(2); click('f5-d-report'); dead('D_ORDER')
        begin(); setd(dAt=1); step(2); click('f5-d-emp'); click('f5-d-report'); dead('D_ORDER')
        begin(); setd(dAt=1); step(2); click('f5-d-emp'); assert data()['dev'] == 'emp' and 'EMP 폭탄' in log_text(); click('f5-d-seal'); assert data()['dev'] == 'sealed' and '완전 밀폐' in log_text()
        click('f5-d-report'); assert data()['dev'] == 'reported' and '본부 보고' in log_text() and not has('f5-d-play') and state()['status'] == 'active'
        # leaving with the gear uncontained
        secure_target('woods', kind='clean'); setd(dAt=1); step(2); click('f5-ask-duration'); finish(); click('f5-ask-symptom'); finish(); click('f5-verdict-transport')
        go('trail'); go('edge'); action('exit'); dead('D_UNSEALED')
        print('PASS D: the recording is never played (blocked waveform only); EMP -> seal -> report in order; playing / wrong order / leaving uncontained fail')

        # --- 9. E: triage ---------------------------------------------------------------------------------------------------------
        secure_target('woods', kind='clean')
        assert {'체류 시간을 묻는다', '접촉 흔적을 살핀다', '저림 증상을 확인한다', '접촉 전 단계로 판단하고 후송한다', '접촉자로 보고한다'} <= labels()
        text_all = page.locator('#f5-text').inner_text() + page.locator('#f5-actions').inner_text() + page.locator('#field-tools').inner_text()
        assert 'SAFE' not in text_all and 'INFECTED' not in text_all and '정상' not in page.locator('#f5-actions').inner_text()
        click('f5-ask-trace'); finish(); assert '겉으로 드러나는 흔적은 확인되지 않는다' in log_text()
        click('f5-verdict-transport'); dead('E_UNCHECKED')                                         # no duration question asked
        secure_target('woods', kind='clean'); click('f5-ask-duration'); finish(); click('f5-verdict-transport'); dead('E_UNCHECKED')   # symptoms skipped for a short stay
        secure_target('woods', kind='clean'); click('f5-ask-duration'); finish(); click('f5-ask-symptom'); finish()
        assert '약 5분' in log_text() and '증상은 전혀 없다' in log_text() and '약 5분' in (click('f5-tab-record') or page.locator('#f5-record').inner_text())
        click('f5-verdict-report'); dead('E_MISJUDGED')
        secure_target('woods', kind='clean'); click('f5-ask-duration'); finish(); click('f5-ask-symptom'); finish(); click('f5-verdict-transport')
        assert data()['verdict'] == 'transport' and 'B급 정신 치료 시설로 후송' in log_text() and not has('f5-verdict-report')
        go('trail'); go('edge'); action('exit'); s = state(); assert s['status'] == 'cleared' and 'B급 정신 치료 시설로 후송했다' in log_text()
        secure_target('woods', kind='numb'); click('f5-ask-duration'); finish(); click('f5-ask-symptom'); finish()
        assert '약 5분' in log_text() and '경미한 저림이 있다' in log_text(); click('f5-verdict-transport'); dead('E_MISJUDGED')
        secure_target('woods', kind='numb'); click('f5-ask-duration'); finish(); click('f5-ask-symptom'); finish(); click('f5-verdict-report'); assert data()['verdict'] == 'report'
        go('trail'); go('edge'); action('exit'); assert state()['status'] == 'cleared' and '접촉자로 보고했다' in log_text()
        secure_target('woods', kind='overstay'); click('f5-ask-duration'); finish()
        assert '약 40분' in log_text(); click('f5-verdict-transport'); dead('E_MISJUDGED')
        secure_target('woods', kind='overstay'); click('f5-ask-duration'); finish(); click('f5-verdict-report'); assert data()['verdict'] == 'report', '10 minutes exceeded = contact, whatever the symptoms'
        print('PASS E: duration first, symptoms only for short stays; clean -> transport to the B-class facility; numbness or >10 min = contact -> report; unchecked / mismatched verdicts fail; no SAFE/INFECTED label')

        # --- 9b. rule 4: the target asks to be bound ----------------------------------------------------------------------
        secure_target('woods', kind='overstay'); click('f5-ask-duration'); finish()
        assert data()['bind'] == 'ask' and '단단히 묶어 달라고 한다' in log_text() and {'압박 붕대로 묶어 준다', '얼음찜질을 해 준다', '요구를 들어주지 않는다'} <= labels()
        click('f5-bind-cloth'); dead('TARGET_PRESSURE'); assert '즉발적으로 팽창, 파열' in state()['reason']
        secure_target('woods', kind='overstay'); click('f5-ask-duration'); finish(); click('f5-bind-ice'); dead('TARGET_PRESSURE')
        secure_target('woods', kind='overstay'); click('f5-ask-duration'); finish(); click('f5-bind-decline'); assert state()['status'] == 'active' and data()['bind'] == 'declined'
        print('PASS rule 4: binding / icing a swelling is fatal; refusing is the answer')

        # --- 10. B: 30 hours alive is not recovery ----------------------------------------------------------------------------
        secure_target('woods', kind='survivor'); click('f5-ask-duration'); finish(); click('f5-ask-symptom'); finish()
        assert '30시간이 넘었지만 아직 살아 있다' in log_text()
        click('f5-verdict-transport'); dead('B_RECOVERY'); assert '회복이 아닌' in state()['reason']
        secure_target('woods', kind='survivor'); click('f5-ask-duration'); finish(); click('f5-ask-symptom'); finish(); click('f5-verdict-report')
        assert data()['verdict'] == 'report' and '30시간이 지나도 살아 있는 접촉자' in log_text() and {'격리실에 비상 프로토콜 A 완전 격리 시스템을 적용한다', '고통 없는 마지막이 가능한 시설로 이송한다', '일반 병동에 수용한다'} <= labels()
        click('f5-protocol-transfer'); dead('B_NOT_ISOLATED'); assert '반경 50m 밖까지' in state()['reason']
        secure_target('woods', kind='survivor'); click('f5-ask-duration'); finish(); click('f5-verdict-report'); go('trail'); go('edge'); action('exit'); dead('B_NOT_ISOLATED')
        secure_target('woods', kind='survivor'); click('f5-ask-duration'); finish(); click('f5-verdict-report'); click('f5-protocol-isolate')
        assert data()['protocol'] == 'isolate' and '비상 프로토콜 A 완전 격리 시스템' in log_text()
        go('trail'); go('edge'); action('exit'); assert state()['status'] == 'cleared' and '비상 프로토콜 A' in log_text()
        print('PASS B: a 30-hour survivor is not recovered; reporting then the emergency protocol A full isolation clears; transfer / skipping the protocol / calling it recovery fails')

        # --- 11. F: the moving reflection -------------------------------------------------------------------------------------
        begin({'reflect': 0.0, 'spray': 0.0}); setd(cAt=99999, dAt=99999, reflect=True); go('trail'); go('woods'); go('shore:L')
        assert not has('f5-spray') and data()['f'] == ''
        action('look'); assert data()['f'] == 'active' and '내 움직임과 다르게 스스로 움직인다' in log_text() and has('f5-spray') and page.locator('#f5-surface').is_visible()
        assert '확보 개체 91번 검은 것을 방사한다' in labels()
        click('f5-spray'); assert data()['cover'] == 1 and data()['f'] == 'active' and '아직 남아 있다' in log_text() and page.locator('#f5-refl .f5-band.covered').count() == 1
        for _ in range(3): click('f5-spray')
        assert data()['f'] == 'active' and data()['cover'] == 4, 'partly covered is not erased'
        click('f5-spray'); assert data()['f'] == 'done' and '완전히 사라졌다' in log_text() and not has('f5-spray') and state()['status'] == 'active'
        begin({'spray': 0.0}); setd(cAt=99999, dAt=99999, reflect=True); go('trail'); go('woods'); go('shore:L'); action('look'); step(29); assert state()['status'] == 'active'; step(2); dead('F_INCOMPLETE')
        assert '자신의 모습을 완전히 지우지 못한 대상자는 반드시 애기소로 가게 되는 사례가 다수' in state()['reason']
        begin({'spray': 0.0}); setd(cAt=99999, dAt=99999, reflect=True); go('trail'); go('woods'); go('shore:L'); action('look'); click('f5-spray'); click('f5-spray'); finish(); action('go', 'woods:L'); dead('F_INCOMPLETE')
        begin({'spray': 0.99}); setd(cAt=99999, dAt=99999, reflect=True); go('trail'); go('woods'); go('shore:L'); action('look'); click('f5-spray'); click('f5-spray'); click('f5-spray'); assert data()['f'] == 'done', 'a spray can cover more than one part'
        print('PASS F: the reflection moves on its own; 91번 is offered only then; it must be erased completely (partial / too slow / walking away fail); phrase kept verbatim')

        # --- 12. UI: nothing future, no debug ----------------------------------------------------------------------------------------
        begin({'kind': 'survivor'})
        hud = page.locator('.field-hud').inner_text()
        assert '각성제 10:00' in hud and '반경 500m 내부' in hud and 'TEAM 3' in hud
        page_text = page.locator('#f5-text').inner_text() + page.locator('.field-hud').inner_text() + page.locator('#f5-actions').inner_text()
        for secret in ['survivor', 'overstay', 'numb', 'clean', 'wet', 'kind', 'true', 'false', '다음 이벤트', '필요', 'EVENT', '정답', 'targetZone', '남은 거리']:
            assert secret not in page_text, secret
        assert page.locator('.field-hud > *').count() == 4
        print('PASS UI: HUD = timer / radius / status / TEAM 3; no future event, no debug state, no answer or label')

        # --- 13. Full run ---------------------------------------------------------------------------------------------------------------
        begin({'kind': 'clean', 'targetZone': 0.9}); setd(cAt=60, dAt=140, reflect=True, cKind=1)
        go('trail', True); go('woods', True); action('look'); finish(True)
        wet = 'R' if '오른쪽 길에는 젖은' in log_text() else 'L'; dry = 'L' if wet == 'R' else 'R'
        go('shore:' + dry, True)
        if data()['c'] == 'sound': click('f5-pill')
        action('look'); assert data()['f'] == 'active'
        while data()['f'] == 'active': click('f5-spray')
        if data()['c'] == 'sound': click('f5-pill')
        finish(True)
        action('search'); finish(True); action('secure'); finish(True)
        if data()['c'] == 'sound': click('f5-pill')
        click('f5-ask-duration'); finish(True); click('f5-ask-symptom'); finish(True); click('f5-verdict-transport')
        go('woods:' + dry, True); go('trail', True)
        if data()['c'] == 'sound': click('f5-pill')
        if data()['dev'] == 'alert':
            click('f5-d-emp'); click('f5-d-seal'); click('f5-d-report'); finish(True)   # the device work takes time
        go('edge', True); assert data()['timer'] > 0 and state()['status'] == 'active'
        if data()['dev'] == 'alert': click('f5-d-emp'); click('f5-d-seal'); click('f5-d-report'); finish(True)
        click('f5-exit'); s = state(); assert s['status'] == 'cleared', (s['status'], s.get('reason'), data())
        assert page.evaluate("FieldSave.get().cleared.includes('EP05') && FieldSave.unlocked('EP06')") and page.evaluate("FieldSave.get().records.EP05.elapsed") > 0
        click('field-list'); assert page.locator('#field-dispatch-EP06').inner_text() == '파견 가능' and not page.locator('#field-dispatch-EP06').is_disabled()  # EP06 is implemented now
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before, 'Story save must be untouched'
        assert page.evaluate("!FieldSave.get().cleared.includes('EP06') && AuthorRoute.get().unlocked === false && !FieldSave.get().progress?.EP05")
        hooks = page.evaluate('window.__hooks')
        assert ['onEpisodeStart', 'EP05'] in hooks and ['onEpisodeClear', 'EP05'] in hooks and any(h[0] == 'onMajorEvent' and h[1] == 'EP05' for h in hooks) and all(len(h) <= 3 for h in hooks)
        print('PASS full run: briefing -> stimulant -> radius -> search -> reflection -> secure -> triage -> out within 10:00 -> EP06 unlock only in Field; Story save byte-identical; AUTHOR hooks (ids only)')

        # --- 14. Save: mid-run snapshot, v5 transport ------------------------------------------------------------------------------------
        begin({'kind': 'overstay', 'targetZone': 0.5}); go('trail'); go('woods'); step(5)
        snap = {k: data()[k] for k in ['zone', 'kind', 'targetZone', 'wet', 'injected', 'phase']}
        timer = data()['timer']
        page.evaluate("FieldCore.disconnect()")
        progress = page.evaluate("FieldSave.get().progress?.EP05")
        assert progress and progress['v'] == 1 and abs(progress['timer'] - timer) < 1e-6
        page.reload(wait_until='load'); boot(); click('field-open')
        assert page.locator('#field-dispatch-EP05').inner_text() == '이어서 파견' and has('field-dispatch-new-EP05')
        click('field-dispatch-EP05')
        assert state()['status'] == 'active' and {k: data()[k] for k in snap} == snap and abs(data()['timer'] - timer) < 1e-6 and '[복원]' in log_text()
        step(1); assert abs(data()['timer'] - (timer - 1)) < 1e-6, 'the restored timer keeps running'
        code = page.evaluate("GameSave.exportCode()"); story_code = page.evaluate("GameSave.exportStoryCode()")
        page.evaluate("FieldSave.reset()"); assert page.evaluate("!FieldSave.get().progress")
        assert page.evaluate("(c) => GameSave.importCode(c)", code)
        assert abs(page.evaluate("FieldSave.get().progress?.EP05?.timer") - (timer - 1)) < 2 and page.evaluate("FieldSave.get().cleared.includes('EP05')")
        assert page.evaluate("GameSave.exportStoryCode()") == story_code, 'v4 Story codec unchanged'
        page.evaluate("FieldSave.saveProgress('EP05', { v: 1, phase: 'inside', timer: 99999, zone: 'sky', kind: 'x', wet: 'Z', targetZone: 'q', contact: 'boom' })")
        fresh(quiet=False); assert data()['phase'] == 'briefing' and data()['timer'] == 600, 'a corrupt snapshot is ignored'
        print('PASS save: timer/zone/target/state restore after reload and keep running; v5 export carries it; corrupt snapshots ignored; v4 Story code unchanged')

        assert not errors, errors
        browser.close()
        print('ALL EP05 CHECKS PASSED')


if __name__ == '__main__':
    run()
