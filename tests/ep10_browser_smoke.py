"""EP10 (인어왕국 행복 공장 / BUILD: one merman toy along one production line) Field browser smoke test. Requires Python
Playwright and Chromium plus the Express server:
    npm start   then   python tests/ep10_browser_smoke.py
Uses isolated browser storage and the production FieldCore.step clock (the wall clock FieldCore reads is frozen, so
only step() advances time). FieldEP10Data.random(name) is pinned to index 0 unless forced: worker 4817, head layout 0,
badLine -1 (only the 4th line is wrong), arm layout 0, whisper 0. No real save is read or changed.
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')
STORY_KEY = 'yuyeon98.save.v1'
DEFAULT = {'worker': 4817, 'heads': 0, 'badLine': 0, 'arms': 0, 'whisper': 0, 'tangleAt': 2}


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
        D = page.evaluate('FieldEP10Data')
        T = D['tuning']

        def click(id): page.locator('#' + id).click()
        def tap(id): page.locator('#' + id).tap()
        def has(id): return page.locator('#' + id).count() > 0
        def state(): return page.evaluate('FieldCore.get()')
        def data(): return state()['data']
        def st(): return data()['st']
        def act(name, value=None): page.evaluate('([n, v]) => FieldCore.action(n, v)', [name, value])
        def log_text(): return page.locator('#field-log').inner_text()
        def step(seconds): page.evaluate('(n) => { let left = n; while (left > 0 && FieldCore.get().status === "active") { FieldCore.step(Math.min(.25, left)); left -= .25; } }', seconds)
        def fresh(**force):
            page.evaluate("""(force) => { window.__force = force;
                FieldEP10Data.random = name => (name in window.__force ? window.__force[name] : 0);
                FieldUI.close(); FieldUI.open(); }""", dict(DEFAULT, **force))
            click('field-dispatch-EP10')
            assert state()['status'] == 'active' and data()['stage'] == 'intro'
        def dead(code):
            s = state(); assert s['status'] == 'dead' and data()['failCode'] == code, (code, s['status'], data()['failCode'], s.get('reason'))
            assert '[작업 기록 중단]' in s['reason']
            return s['reason']

        # correct play, station by station
        def do_intro():
            for _ in range(4): click('f10-press')
        def do_locker():
            click('f10-open-locker'); click('f10-read'); click('f10-key-right'); click('f10-clothes-in')
            for i in range(3): click('f10-wear-%d' % i)
            step(T['lockerSong'] + .5); click('f10-lock'); click('f10-leave')
        def do_head():
            n = 0
            while st()['phase'] != 'done':
                n += 1; assert n < 20
                click('f10-lift'); h = st()['heads'][st()['idx']]
                if h.get('mouth'):
                    step(T['mouthWarn'] + .2); click('f10-put-down')
                    act('fingers', True); step(T['mouthHold'] + .2); act('fingers', False)
                    click('f10-sticker-left'); click('f10-sticker-right'); click('f10-red-box'); continue
                click('f10-eyes'); click('f10-rotate'); click('f10-hair'); click('f10-lips')
                click('f10-pass' if h['eyes'] == 'same' and h['hair'] == 'clear' and not h['teeth'] else 'f10-reject')
            click('f10-next')
        def do_voice(skip_fix=False):
            for i in range(4):
                click('f10-press')
                if data()['toy']['voices'][i] == 'wrong' and not skip_fix:
                    click('f10-correct'); page.locator('#f10-say').fill(D['lines'][i]); click('f10-say-send')
            click('f10-next')
        def do_arms():
            spare = st()['spareNo']
            for side in ['left', 'right']:
                i = [k for k, a in enumerate(st()[side]) if a['no'] == spare][0]
                click('f10-arm-%s-%d' % (side, i)); step(1)
                if st()['holding']['act'] in D['danger']:
                    click('f10-crush'); click('f10-spare'); step(1)
                click('f10-pin')
            click('f10-next')
        def do_tail():
            click('f10-flip'); click('f10-hand')
            while st()['stitches'] < T['stitches']:
                if st()['tangle']: click('f10-pull-thread')
                click('f10-stitch')
            click('f10-knot'); click('f10-next')
        def do_final():
            click('f10-assemble'); click('f10-stand')
            for c in ['eyes', 'hair', 'teeth']: click('f10-check-' + c)
            for _ in range(3): click('f10-press')
            step(T['finalPause'] + .3); click('f10-press'); step(T['inspecting'] + .3)
        STAGE_DO = {'intro': do_intro, 'locker': do_locker, 'head': do_head, 'voice': do_voice, 'arms': do_arms, 'tail': do_tail}
        def to(stage, **force):
            fresh(**force)
            while data()['stage'] != stage:
                STAGE_DO[data()['stage']](); assert state()['status'] == 'active', state().get('reason')

        story_before = page.evaluate(f"localStorage.getItem('{STORY_KEY}')")
        globals_js = "JSON.stringify([typeof jayUnlocked !== 'undefined' ? jayUnlocked : null, typeof finaleSeen !== 'undefined' ? finaleSeen : null, localStorage.getItem('yuyeon98.author.v1'), localStorage.getItem('yuyeon98.classified.v1'), GameSave.workerNo()])"
        globals_before = page.evaluate(globals_js)

        # --- 0. Rule document: original transcript -> 10화.txt -> Story window -> Field panel --------------------------------
        story_doc = page.evaluate("document.querySelector('#darkwebReportWindowEP10 textarea').value").replace('\r\n', '\n').strip()
        txt = (ROOT / '10화.txt').read_text(encoding='utf-8').replace('\r\n', '\n').strip()
        assert story_doc == txt, 'index.html Story window must equal 10화.txt'
        original = (ROOT / 'docs/transcripts/raw/EP10_인어왕국_행복_공장_original.txt').read_text(encoding='utf-8-sig')
        flat = lambda v: re.sub(r'\s+', '', v)
        for marker in ['정상적으로 작업을 종료하기 전까지는 공장 밖으로 나가려 하지 마십시오', '하늘색 작업복, 분홍색 앞치마, 흰색 장갑',
                       '다른 사물함을 열지 마십시오', '착용을 마치면 사물함만 바라보십시오', '8조각으로 접힌 채 발견되었습니다',
                       '입술 사이로 치아가 보여서는 안 됩니다', '입술 사이에 검지와 중지를 넣으십시오', '양쪽 볼에 불량 스티커를 붙여 빨간 상자에 넣으십시오',
                       '우리 같이 바다로 가자', '반짝반짝 조개를 찾아보자', '몸체를 마주 본 채 틀린 대사의 정상 문장을 끝까지 직접 말하십시오',
                       '입술이나 턱에 손가락이 닿아도 말을 멈추지 마십시오', '입은 양쪽 귀 밑까지 찢어진 채 굳어 있었습니다',
                       '같은 번호가 적힌 한 쌍만 사용하십시오', '작업복 소매를 붙잡거나 손등을 더듬어도 뿌리치지 마십시오', '오른쪽 압착 홈에 넣고 은색 페달을 밟아',
                       '파란 회수통에 버리고 같은 번호의 예비 팔을 사용하십시오', '손가락마다 작은 플라스틱 손이 하나씩 달려 있었습니다',
                       '노래가 끝나기 전에 마지막 매듭까지 묶으십시오', '실이 꼬여도 안쪽을 들여다보지 마십시오', '허리 아래부터 초록색 비늘 같은 각질이 돋아났습니다',
                       '양쪽 눈이 같은 방향을 보는지', '인형을 그대로 두고 뒤쪽 출입문으로 나가십시오', '검수 등이 빨간색으로 켜지면 인형을 다시 분해하지 마십시오',
                       '웃을 때에만 목소리가 인어왕자와 같아집니다', '피부 안쪽으로 눌린 것처럼 남으며']:
            assert marker in txt, marker
            assert flat(marker) in flat(original), 'not in the original: ' + marker
        for forbidden in ['216-091', '시행 일자', '부착 위치', '역관절', '적출', '여덟 각', '외부 게시 불가', '양손이 잘려']:
            assert forbidden not in txt, forbidden
        assert page.evaluate("EPISODE_DOCS[10]") == '완구회수-2026-0915'
        assert page.evaluate("CLUES.filter(c => c.ep === 10).every(c => document.querySelector('#darkwebReportWindowEP10 textarea').value.includes(c.quote))")
        assert page.evaluate("MESSENGER_GENERIC.hq.filter(m => m.ep === 10).every(m => document.querySelector('#darkwebReportWindowEP10 textarea').value.includes(m.quote))")
        for code in D['canonFailures']:
            if code == 'RED': key = '재작업을 중단시킨 사례는 확인되지 않았습니다'
            else: key = D['failures'][code].split('습니다. ')[-1][:20] if '습니다. ' in D['failures'][code] else D['failures'][code][:20]
            assert flat(key.replace('여기서 살아줄 거지', '')) in flat(txt), (code, key)
        print('PASS 0 rule document: 10화.txt rebuilt from the original (no invented metadata/consequences) == Story window; clue/messenger quotes valid')

        # --- 1. Unlock ---------------------------------------------------------------------------------------------------------
        click('field-open')
        assert page.locator('#field-dispatch-EP10').inner_text() == '연결 제한' and page.locator('#field-dispatch-EP10').is_disabled()
        page.evaluate("for (let n = 1; n <= 8; n++) FieldSave.clear('EP' + String(n).padStart(2, '0'), { patrols: {}, elapsed: 100, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP10').inner_text() == '연결 제한'
        page.evaluate("FieldSave.clear('EP09', { patrols: {}, elapsed: 100, injuries: [] }); FieldUI.close(); FieldUI.open()")
        assert page.locator('#field-dispatch-EP10').inner_text() == '파견 가능'
        page.evaluate("""(() => { window.__hooks = []; const add = (kind, fn) => FieldCore.hooks.add(kind, fn);
            add('onEpisodeStart', id => window.__hooks.push(['onEpisodeStart', id]));
            add('onMajorEvent', (id, event) => window.__hooks.push(['onMajorEvent', id, event]));
            add('onEpisodeClear', id => window.__hooks.push(['onEpisodeClear', id])); })()""")
        print('PASS 1 EP10 locked until EP09 clear, then dispatchable')

        # --- 2. Intro + locker room ----------------------------------------------------------------------------------------
        fresh(); click('f10-press'); click('f10-press'); click('f10-press'); assert data()['stage'] == 'intro' and '친구가 되어' not in log_text()
        click('f10-press'); assert '"여기서 살아줄 거지"' in log_text() and data()['stage'] == 'locker'
        click('f10-other-locker'); dead('OTHER_LOCKER')
        fresh(); do_intro(); click('f10-open-locker'); click('f10-read'); assert '"4817."' in log_text(); click('f10-key-left'); dead('WRONG_WRIST')
        fresh(); do_intro(); click('f10-open-locker'); click('f10-read'); click('f10-key-right'); click('f10-clothes-in'); assert '♪' in page.locator('#f10-status').inner_text()
        assert not re.search(r'\d+\s*초|\d{1,2}:\d{2}', page.locator('#f10-hud').inner_text().replace('4817', '')), 'the song is the timer: no countdown'
        step(T['behindAt'][1] + .3); assert '내 이름을 부른다' in log_text(); click('f10-turn-back'); assert '8조각' in dead('TURNED_BACK')
        fresh(); do_intro(); click('f10-open-locker'); click('f10-read'); click('f10-key-right'); click('f10-clothes-in')
        for i in range(3): click('f10-wear-%d' % i)
        click('f10-leave'); dead('LEFT_EARLY')
        fresh(); do_intro(); do_locker(); assert data()['stage'] == 'head' and '작업자 4817' not in page.locator('#f10-hud').inner_text()
        assert page.locator('#f10-worker').inner_text().startswith('4817 / 검수 완료')
        print('PASS locker: open locker, read the number aloud, key on the RIGHT wrist, change while the song plays; turning back = canon; other locker/left wrist/leaving early fail; HUD turns into a work counter')

        # --- 3. Head inspection ---------------------------------------------------------------------------------------------
        to('head'); click('f10-lift'); step(T['mouthWarn'] + .2); assert st()['phase'] == 'open'; click('f10-throw'); dead('HEAD_HELD')
        to('head'); click('f10-lift'); step(T['mouthWarn'] + 3.3); dead('HEAD_HELD')
        to('head'); click('f10-lift'); step(T['mouthWarn'] + .2); click('f10-put-down'); act('fingers', True); step(2); act('fingers', False); dead('HEAD_FINGERS')
        to('head'); click('f10-lift'); step(T['mouthWarn'] + .2); click('f10-put-down')
        page.locator('#f10-fingers').hover(); page.mouse.down(); step(T['mouthHold'] + .2); page.mouse.up()
        assert '축축하다' in log_text() and st()['phase'] == 'stick'; click('f10-red-box'); assert st()['phase'] == 'stick', 'both stickers first'
        click('f10-sticker-left'); click('f10-sticker-right'); click('f10-red-box'); assert st()['idx'] == 1 and data()['counts']['rejected'] == 1
        click('f10-lift'); click('f10-lips'); assert '치아가 보인다' in log_text(); click('f10-reject')
        click('f10-lift'); click('f10-hair'); assert '앞에서만 봐서는' in log_text(); click('f10-rotate'); click('f10-hair'); click('f10-pass')
        assert data()['toy']['head'] == {'eyes': 'same', 'hair': 'clear', 'teeth': False}
        print('PASS head: lift from the front, rotate, check eyes/hair/lips; an opening mouth: put down, two fingers held (wet/tongue) until it closes, both stickers, red box; throwing/holding/pulling out fail')

        # --- 4. Voice test --------------------------------------------------------------------------------------------------
        to('voice')
        for _ in range(3): click('f10-press')
        assert data()['toy']['voices'][:3] == ['ok', 'ok', 'ok']; click('f10-press'); assert '"여기서 살아줄 거지."' in log_text()
        click('f10-correct'); step(T['whisperAt'] + .2); assert '먼저 속삭인다. "여기서' in log_text() and '천을 끄는 소리' in log_text()
        page.locator('#f10-say').fill('여기서 친구가 되어 줄 거지'); click('f10-say-send'); assert '귀 밑까지' in dead('VOICE_4')
        to('voice')
        for _ in range(4): click('f10-press')
        click('f10-correct'); click('f10-turn-away'); dead('VOICE_TURNED')
        to('voice')
        for _ in range(4): click('f10-press')
        click('f10-correct'); step(T['correctTime'] + .3); dead('VOICE_4')
        to('voice', badLine=1); click('f10-press'); assert data()['toy']['voices'][0] == 'wrong'
        click('f10-correct'); page.locator('#f10-say').fill('안녕 나는 인어공주야'); click('f10-say-send'); assert '목소리를 잃었으며' in dead('VOICE_1')
        to('voice');
        for _ in range(4): click('f10-press')
        click('f10-correct'); step(T['touchAt'] + .2); assert '턱에 차가운 손가락' in log_text()
        page.locator('#f10-say').fill('친구가 되어 줄 거지.'); click('f10-say-send'); assert data()['toy']['voices'][3] == 'corrected' and state()['status'] == 'active'
        print('PASS voice: the same body, four presses; a wrong line -> face it, say the whole normal sentence (typed) through cloth/whisper/touch; repeating the whisper, turning away or running out fail (line 1 / line 4 canon)')

        # --- 5. Arms --------------------------------------------------------------------------------------------------------
        to('arms'); click('f10-arm-left-0'); step(1); assert '따라 접혔다가 펴진다' in log_text(); click('f10-pin')   # unsettling but normal
        click('f10-arm-right-1'); step(1); assert '다섯 개가 동시에' in log_text(); click('f10-pin'); assert '플라스틱 손' in dead('ARM_GRABBED')
        to('arms'); click('f10-arm-right-1'); step(1 + T['armDanger']); dead('ARM_GRABBED')
        to('arms'); click('f10-arm-right-0'); step(1); assert '소매를 붙잡는다' in log_text(); click('f10-shake'); dead('ARM_SHAKE')
        to('arms'); click('f10-arm-left-0'); step(1); click('f10-pin'); click('f10-arm-right-0'); step(1); click('f10-pin'); dead('ARM_PAIR')
        to('arms'); click('f10-arm-left-0'); step(1); click('f10-pin'); click('f10-arm-right-1'); step(1); click('f10-crush')
        assert '은색 페달' in log_text() and data()['counts']['rejected'] >= 2; click('f10-spare'); step(1); click('f10-pin')
        assert data()['toy']['leftArm']['no'] == data()['toy']['rightArm']['no'] == 7 and data()['ready']
        print('PASS arms: same-number pair; following fingers / sleeve grab / hand stroking are attached as they are; five fingers converging or reaching out = crush groove + silver pedal + blue bin + spare; attaching it, waiting, shaking off or mismatching fail')

        # --- 6. Tail --------------------------------------------------------------------------------------------------------
        to('tail'); click('f10-hand'); click('f10-stitch'); assert '점선이 맞지 않는다' in log_text() and st()['stitches'] == 0
        click('f10-hand-out'); click('f10-flip'); click('f10-hand'); click('f10-stitch'); click('f10-hand-out'); dead('TAIL_UNFINISHED')
        to('tail'); click('f10-flip'); click('f10-hand')
        while not st()['tangle']: click('f10-stitch')
        assert '실이 꼬였다' in log_text() and '홍보곡이 다시' in log_text(); click('f10-look-inside'); assert '비늘 같은 각질' in dead('TAIL_LOOK')
        to('tail'); click('f10-flip'); click('f10-hand'); click('f10-stitch'); click('f10-squeeze'); dead('TAIL_SQUEEZE')
        to('tail'); click('f10-flip'); click('f10-hand')
        for _ in range(T['sewSongAt']): click('f10-stitch')
        step(T['sewSong'] + .3); dead('TAIL_UNFINISHED')
        to('tail'); do_tail(); assert data()['toy']['tailComplete'] and '미지근하다' in log_text() and '끌려 들어간다' in log_text()
        print('PASS tail: scales down, one hand inside (wet, lukewarm, pulled) while the other sews; the promo song is the timer (no countdown); tangled thread -> pull thread only; looking inside / letting go / squeezing / song ending first fail')

        # --- 7. Final assembly, GREEN, corridor, clear ------------------------------------------------------------------------
        to('final'); click('f10-assemble'); assert page.locator('#f10-toy').get_attribute('class') == 'f10-whole' and '꼬리' in page.locator('#f10-toy').inner_text()
        click('f10-stand')
        for _ in range(3): click('f10-press')
        assert st()['phase'] == 'pause' and page.locator('#f10-press').is_disabled(), 'a pause before the 4th button'
        step(T['finalPause'] + .3); click('f10-press'); assert st()['phase'] == 'inspect' and 'f10-silent' in page.locator('#f10-stage').get_attribute('class')
        step(T['inspecting'] + .3); assert st()['phase'] == 'green' and data()['toy']['finalFace'] and data()['toy']['finalVoice']
        click('f10-take-doll'); dead('TOOK_DOLL')
        def to_corridor():
            to('final'); do_final(); click('f10-leave-doll'); assert data()['stage'] == 'corridor'
        to_corridor(); assert page.locator('#f10-hud').is_hidden() and page.locator('#f10-line').is_hidden()
        click('f10-walk'); click('f10-speak'); dead('SPOKE')
        to_corridor(); click('f10-walk'); click('f10-turn-back'); dead('STOPPED')
        to_corridor(); click('f10-walk'); step(T['stopLimit'] + .3); dead('STOPPED')
        to_corridor()
        for i in range(T['corridorSteps']):
            click('f10-walk'); step(.5)
        s = state(); assert s['status'] == 'cleared', s.get('reason')
        assert '홍보곡이 다시 시작된다' in log_text() and '"4817."' in log_text().split('[통로]', 1)[1]
        epi = page.locator('#f10-epilogue').inner_text()
        assert 'FIELD OBSERVATION' in epi and '10 / 10' in epi and '웃을 때에만' in epi and '오른쪽 손목 안쪽' in epi and '제거한 사례는 확인되지 않았습니다' in epi
        whole = page.locator('#field-content').inner_text()
        assert 'TRUE END' not in whole and 'CONGRATULATIONS' not in whole.upper()
        save = page.evaluate('FieldSave.get()'); assert 'EP10' in save['cleared'] and save['unlocked'][-1] != 'EP11'
        assert page.evaluate(f"localStorage.getItem('{STORY_KEY}')") == story_before, 'Story save untouched'
        assert page.evaluate(globals_js) == globals_before, 'J / LOOP / AUTHOR / CLASSIFIED / Story worker number untouched'
        hooks = page.evaluate('window.__hooks'); assert ['onEpisodeClear', 'EP10'] in hooks and all(len(h) <= 3 for h in hooks)
        print('PASS final: the whole toy for the first time; eyes/hair/teeth, three presses, silence, the fourth; inspecting (sound off) -> GREEN; leave the doll; corridor without HUD: walk on mouth shut (speaking/turning/stopping fail) -> 10 / 10 + HQ record; no TRUE END; only Field EP10 recorded')

        # --- 8. An earlier mistake turns the lamp red ------------------------------------------------------------------------
        def red_run(mistake):
            fresh(); do_intro(); do_locker()
            if mistake == 'head':
                click('f10-lift'); step(T['mouthWarn'] + .2); click('f10-put-down'); act('fingers', True); step(T['mouthHold'] + .2); act('fingers', False)
                click('f10-sticker-left'); click('f10-sticker-right'); click('f10-red-box')
                click('f10-lift'); click('f10-pass'); assert data()['toy']['head']['teeth']; click('f10-next')   # passed a head with teeth showing
                do_voice()
            else:
                do_head(); do_voice(skip_fix=True); assert data()['toy']['voices'][3] == 'wrong'
            do_arms(); do_tail(); do_final()
        red_run('head'); assert st()['phase'] == 'red' and data()['toy']['finalFace'] is False
        click('f10-disassemble'); dead('DISASSEMBLE')
        red_run('voice'); assert st()['phase'] == 'red' and data()['toy']['finalVoice'] is False and data()['toy']['finalFace'] is True
        step(3.3); assert '재작업을 중단시킨 사례는 확인되지 않았습니다' in dead('RED')
        print('PASS toy state: the head passed at station 1 and the line left uncorrected at station 2 are what the final inspection sees -> RED (do not disassemble; canon rework notice)')

        # --- 9. Save / retry / mobile ----------------------------------------------------------------------------------------
        cleared = page.evaluate("FieldSave.get().cleared.slice()")
        fresh(); do_intro(); click('f10-other-locker'); dead('OTHER_LOCKER'); click('field-retry')
        assert state()['status'] == 'active' and data()['stage'] == 'intro' and page.evaluate("FieldSave.get().cleared.slice()") == cleared
        code = page.evaluate("GameSave.exportCode()"); story_code = page.evaluate("GameSave.exportStoryCode()")
        assert page.evaluate("(c) => GameSave.importCode(c)", code) and page.evaluate("FieldSave.get().cleared.includes('EP10')") and page.evaluate("GameSave.exportStoryCode()") == story_code
        page.set_viewport_size({'width': 390, 'height': 844}); fresh()
        for _ in range(4): tap('f10-press')
        tap('f10-open-locker'); tap('f10-read'); tap('f10-key-right'); assert data()['st']['key'] == 'right'
        box = page.locator('#fieldWindow').bounding_box(); assert box['x'] >= 0 and box['x'] + box['width'] <= 390
        print('PASS retry resets only the run; v5 save carries the EP10 clear; 390px touch')

        assert not errors, errors
        browser.close()
        print('ALL EP10 CHECKS PASSED')


if __name__ == '__main__':
    run()
