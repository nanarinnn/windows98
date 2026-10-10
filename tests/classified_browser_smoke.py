"""PUBLIC CLASSIFIED 01 + AUTHOR meta reaction browser smoke test. Requires Python Playwright and Chromium plus the Express server:
    npm start   then   AUTHOR_TEST_SECRET=<author code> python tests/classified_browser_smoke.py
The AUTHOR code is NOT stored in the repository: it is read from the AUTHOR_TEST_SECRET environment variable (the AUTHOR cases are skipped,
and reported as skipped, when it is absent). Case/format variants are derived from it. Uses isolated browser storage, no real save.
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')
SECRET = os.environ.get('AUTHOR_TEST_SECRET', '')
STORY_KEY = 'yuyeon98.save.v1'
SENTENCE = '연결한 건 내가 아니야.'


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
        context = browser.new_context(viewport={'width': 1280, 'height': 900}, bypass_csp=True)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))

        def boot():
            page.goto(BASE + '/?devunlock=0', wait_until='load')
            page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")
            page.evaluate("window.__pn = performance.now(); performance.now = () => window.__pn")

        boot()

        def click(id): page.locator('#' + id).click()
        def has(id): return page.locator('#' + id).count() > 0
        def state(): return page.evaluate('FieldCore.get()')
        def data(): return state()['data']
        def action(name, value=None): page.evaluate('([n, v]) => FieldCore.action(n, v)', [name, value])
        def step(seconds): page.evaluate('(n) => { let left = n; while (left > 0 && FieldCore.get().status === "active") { FieldCore.step(Math.min(.5, left)); left -= .5; } }', seconds)
        def log_text(): return page.locator('#field-log').inner_text()
        def tabs():
            page.evaluate("openNotebook('board')")
            return [t.inner_text() for t in page.locator('.nb-tab').all()]
        def classified_state(): return page.evaluate('Classified.get()')

        def play_ep06_to_clear():
            """A plain, quiet day through the real Field actions (no anomalies, clean desk)."""
            page.evaluate("""() => { FieldEP06Data.random = name => ({ deskDirty: 0.99, b: 0.99, cOn: 0.99, eOn: 0.99, dOn: 0.99, call17: 'quiet', seat: 'clean' })[name] ?? 0.5;
                FieldUI.close(); FieldUI.open(); }""")
            click('field-dispatch-new-EP06' if has('field-dispatch-new-EP06') else 'field-dispatch-EP06')
            action('startHomeroom')
            for _ in range(3): action('call')
            action('absent')
            while data()['att'] != 'done': action('call')
            action('endHomeroom')
            for phase in ('class1', 'class2'):
                while data()['phase'] == phase:
                    action('obj', 'board'); step(5.2)
                    if data()['phase'] == 'break': step(41)
                    if data()['phase'] == 'listening': step(66)
            assert data()['phase'] == 'closing', data()['phase']
            action('endClosing')
            assert state()['status'] == 'cleared'

        story_before = page.evaluate(f"localStorage.getItem('{STORY_KEY}')")
        page.evaluate("for (const id of ['EP01', 'EP02', 'EP03', 'EP04', 'EP05']) FieldSave.clear(id, { patrols: {}, elapsed: 700, injuries: [] })")
        click('field-open')

        # --- 1. Before any discovery: the CLASSIFIED system does not exist ----------------------------------------------------------
        assert 'CLASSIFIED' not in ' '.join(tabs()) and not page.evaluate("document.body.innerText.includes('CLASSIFIED')")
        assert page.evaluate("Classified.get()") == {'v': 1, 'discovered': [], 'viewed': []} and page.evaluate("CLASSIFIED_TOTAL") == 3
        print('PASS 1 no CLASSIFIED menu or text before the first discovery; default state is empty')

        # --- 2. EP06 clear first (EP07 needs no CLASSIFIED) -----------------------------------------------------------------------------
        play_ep06_to_clear()
        assert page.evaluate("FieldSave.get().cleared.includes('EP06') && FieldSave.unlocked('EP07')"), 'EP07 unlocks without any CLASSIFIED'
        assert classified_state()['discovered'] == []
        assert page.evaluate("!GameSave.get().flags.finaleSeen && !GameSave.get().flags.jayUnlocked")
        assert not has('f6-recheck-17'), 'no hidden button on the cleared screen'
        outcome = page.locator('#field-outcome').inner_text()
        assert 'CLASSIFIED' not in outcome and '찾기' not in outcome and '다음 에피소드' not in outcome, outcome
        print('PASS 2 EP06 clear -> EP07 unlock with no CLASSIFIED involved; nothing on the clear screen hints at it')

        # --- 3. Post-clear free inspection -> classified-01 -----------------------------------------------------------------------------
        page.evaluate("FieldEP06UI.post.delay = 0")
        assert page.locator('#f6-seat-17').is_enabled() and page.locator('#f6-board').is_disabled(), 'only desk 17 stays live after the clear'
        click('f6-seat-17')
        assert '책상과 의자가 깨끗하게 정돈되어 있다' in log_text() and has('f6-recheck-17') and page.locator('#f6-recheck-17').inner_text() == '17번 자리를 다시 확인한다'
        assert classified_state()['discovered'] == []
        click('f6-recheck-17'); assert has('xref-classified-01') and 'CROSS-REFERENCE' in page.locator('#xref-classified-01').inner_text()
        xr = page.evaluate("CLASSIFIED_ENTRIES[0].crossRef")
        doc6 = (ROOT / '6화.txt').read_text(encoding='utf-8'); doc1 = (ROOT / '1화.txt').read_text(encoding='utf-8')
        assert xr['left']['text'] in doc6 and all(line in doc1 for line in xr['right']['text'].split(chr(10))), 'both records are quoted verbatim'
        click('xref-tok-3'); assert '대조 결과 없음' in page.locator('#xref-foot').inner_text() and classified_state()['discovered'] == []
        for i in [0, 5, 6]: click('xref-tok-%d' % i)
        assert classified_state()['discovered'] == [], 'the player has to link every shared element'
        click('xref-tok-7'); page.wait_for_function("Classified.has('classified-01')")
        assert page.locator('#xref-classified-01 .xref-end').inner_text() == '두 사건의 관계는 확인되지 않았습니다.'
        assert page.locator('#xref-classified-01 .xref-hit.xref-on').count() >= 4
        log = log_text()
        for line in ['[기록 대조 중...]', '[자동 연계 실패] 열람 권한이 없습니다.']:
            assert line in log, line
        toast = page.locator('.classified-toast').inner_text()
        assert '[CLASSIFIED TRACE RECOVERED]' in toast and '연결되지 않아야 할 두 기록이' in toast and '같은 위치를 가리키고 있습니다.' in toast and 'CLASSIFIED 1 / 3' in toast
        assert classified_state()['discovered'] == ['classified-01'] and page.evaluate("FieldSave.get().cleared.includes('EP06')")
        click('f6-recheck-17'); step(0)
        assert classified_state()['discovered'] == ['classified-01'] and log_text().count('[기록 대조 중...]') == 1 and '이미 대조한 기록이다' in log_text()
        print('PASS 3 desk 17 re-inspection after the clear -> CROSS-REFERENCE (player links 2019 / 부산광역시 / 기장군 / 태양해안) -> [CLASSIFIED TRACE RECOVERED] 1 / 3; repeated inspection grants nothing twice')

        # --- 4. Notebook ------------------------------------------------------------------------------------------------------------------
        assert tabs()[-1] == 'CLASSIFIED'
        page.locator('.nb-tab', has_text='CLASSIFIED').click()
        body = re.sub(r'[ 	]+', ' ', page.locator('#notebook-body').inner_text())
        assert '[ CLASSIFIED ]' in body and '복구된 분류 보류 기록 1 / 3' in body and '■ 01 태양해안 기록 대조' in body and '미확보' not in body and '02' not in body and '03' not in body
        assert 'AUTHOR' not in body and '제작자' not in body
        page.locator('.nb-classified-entry').click()
        doc = page.locator('#classified-document').inner_text()
        for line in ['[분류 보류 기록 01]', '청림고등학교 2학년 3반 17번', '박예림', '부산광역시 기장군 태양해안', '2019', '해안관리-2019-031', '[접근 권한 없음]', '두 사건의 관계는 확인되지 않았습니다.']:
            assert line in doc, line
        for forbidden in ['원인', '은폐', '동일 사건', '동일 존재', '때문에']:
            assert forbidden not in doc, forbidden
        assert doc.rstrip().endswith('두 사건의 관계는 확인되지 않았습니다.') and classified_state()['viewed'] == ['classified-01']
        print('PASS 4 notebook: CLASSIFIED section appears after the first discovery (1 / 3; undefined slots are not listed); the document keeps "두 사건의 관계는 확인되지 않았습니다." and states no cause')

        # --- 5. Reload, Save Code, old save ---------------------------------------------------------------------------------------------------
        page.reload(wait_until='load'); boot()
        assert classified_state()['discovered'] == ['classified-01'] and tabs()[-1] == 'CLASSIFIED'
        code = page.evaluate("GameSave.exportCode()"); story_code = page.evaluate("GameSave.exportStoryCode()")
        page.evaluate("Classified.reset()"); assert classified_state()['discovered'] == [] and 'CLASSIFIED' not in ' '.join(tabs())
        assert page.evaluate("(c) => GameSave.importCode(c)", code) and classified_state()['discovered'] == ['classified-01']
        assert page.evaluate("GameSave.exportStoryCode()") == story_code
        page.evaluate("Classified.reset()")
        old_code = page.evaluate("GameSave.exportStoryCode()")                       # a v4 code has no classified layer: current state is kept
        page.evaluate("Classified.discover('classified-01', { announce: false })")
        assert page.evaluate("(c) => GameSave.importCode(c)", old_code) and classified_state()['discovered'] == ['classified-01'], 'older codes never erase a discovery'
        page.evaluate("localStorage.removeItem('yuyeon98.classified.v1')"); page.reload(wait_until='load'); boot()
        assert classified_state() == {'v': 1, 'discovered': [], 'viewed': []}, 'an old save without the key loads normally'
        page.evaluate("localStorage.setItem('yuyeon98.classified.v1', JSON.stringify({ v: 1, discovered: ['classified-01', 'classified-02', 'x'], viewed: ['classified-03'] }))")
        page.reload(wait_until='load'); boot(); assert classified_state() == {'v': 1, 'discovered': ['classified-01', 'classified-02'], 'viewed': []}, 'unknown ids are dropped'
        page.evaluate("Classified.discover('classified-01', { announce: false })")
        page.evaluate("GameSave.reset()"); assert classified_state()['discovered'] == [] and page.evaluate("AuthorRoute.get().unlocked === false")
        print('PASS 5 discovery survives reload and Save Code v5; old codes/saves load; unknown ids dropped; the explicit reset clears CLASSIFIED')

        # --- 6. AUTHOR hash and input rules (the code itself never lives in the repo) ----------------------------------------------------------
        assert 'f7dda4fd1a2aaaae283a1382d8e0f5f39abe70d410d9cf1a438e58c0aaa220ae' in (ROOT / 'field/field-author.js').read_text(encoding='utf-8')
        scan = '\n'.join(path.read_text(encoding='utf-8', errors='ignore') for pattern in ('*.js', '*.html', 'field/**/*.js') for path in ROOT.glob(pattern) if 'node_modules' not in str(path))
        if SECRET:
            assert SECRET not in scan and SECRET.lower() not in scan.lower(), 'the AUTHOR code must not appear in runtime source'
            assert page.evaluate("async (s) => AuthorRoute.matches(s)", SECRET) is True
            assert page.evaluate("async (s) => AuthorRoute.matches(s)", f'  {SECRET}  ') is True, 'trim'
            for wrong in [SECRET.lower(), SECRET.capitalize(), SECRET.replace('-', ''), SECRET.replace('0813', '813'), SECRET.upper() + 'x']:
                assert page.evaluate("async (s) => AuthorRoute.matches(s)", wrong) is False, wrong
            print('PASS 6 AUTHOR: exact code matches (trim -> NFKC -> SHA-256), lower/capitalized/hyphenless/shortened variants fail; no plaintext in the runtime source')
        else:
            print('SKIP 6 AUTHOR code cases (set AUTHOR_TEST_SECRET)')

        # --- 7. AUTHOR locked: CLASSIFIED works, the AUTHOR file and its sentence are absent -----------------------------------------------------
        page.evaluate("GameSave.reset()"); boot()
        assert page.locator('#author-note-icon').is_hidden()
        assert not page.evaluate("(s) => document.documentElement.innerText.includes(s) || document.getElementById('author-note-text').value.includes(s)", SENTENCE)
        page.evaluate("Classified.discover('classified-01', { announce: false })")
        assert classified_state()['discovered'] == ['classified-01'] and page.locator('#author-note-icon').is_hidden()
        assert not page.evaluate("(s) => document.documentElement.innerText.includes(s) || document.getElementById('author-note-text').value.includes(s)", SENTENCE)
        print('PASS 7 a normal player discovers CLASSIFIED 01 but never sees the AUTHOR file or traces')

        if SECRET:
            def author_note():
                page.locator('#author-note-icon').click()
                text = page.locator('#author-note-text').input_value()
                page.locator('#author-note-close').click(); return text
            BASE_NOTE = '누군가 이 창을 다시 열어 주었다.\n남겨 둔 문장 하나는, 여기까지 읽어 준 사람에게.\n\n영원을 약속하지는 못하겠지만, 지금 이 순간을 너와 함께'
            # --- 8. AUTHOR first, CLASSIFIED discovered later (real in-game path): the file keeps its base text only --------------------------
            page.evaluate("GameSave.reset()"); boot()
            assert page.evaluate("async (s) => AuthorRoute.tryImport(s)", SECRET) is True
            assert page.locator('#author-note-icon').is_visible() and classified_state()['discovered'] == [], 'AUTHOR does not unlock CLASSIFIED'
            assert author_note() == BASE_NOTE
            assert 'CLASSIFIED' not in ' '.join(tabs()), 'AUTHOR still has no CLASSIFIED menu before discovering one'
            page.evaluate("for (const id of ['EP01', 'EP02', 'EP03', 'EP04', 'EP05']) FieldSave.clear(id, { patrols: {}, elapsed: 700, injuries: [] })")
            click('field-open'); play_ep06_to_clear(); page.evaluate("FieldEP06UI.post.delay = 0")
            click('f6-seat-17'); click('f6-recheck-17')
            for i in [0, 5, 6, 7]: click('xref-tok-%d' % i)
            page.wait_for_function("Classified.has('classified-01')")
            assert 'AUTHOR' not in page.locator('.classified-toast').inner_text(), 'no AUTHOR popup on discovery'
            body = page.evaluate("openNotebook('classified'), document.getElementById('notebook-body').innerText")
            assert 'AUTHOR' not in body and 'BONUS' not in body and 'ACCESS' not in body
            page.evaluate("Classified.discover('classified-02', { announce: false }); Classified.discover('classified-03', { announce: false })")
            assert author_note() == BASE_NOTE, 'no line is appended for any CLASSIFIED'
            print('PASS 8 AUTHOR first -> CLASSIFIED 01/02/03 discovered -> [제작자에게.txt] keeps exactly its base text (no appended line, no popup)')
            # --- 9. CLASSIFIED first, AUTHOR later --------------------------------------------------------------------------------------------
            page.evaluate("GameSave.reset()"); boot()
            for n in ['01', '02', '03']: page.evaluate("(id) => Classified.discover(id, { announce: false })", 'classified-' + n)
            assert page.locator('#author-note-icon').is_hidden()
            assert page.evaluate("async (s) => AuthorRoute.tryImport(s)", SECRET) is True and author_note() == BASE_NOTE
            page.reload(wait_until='load'); boot(); assert author_note() == BASE_NOTE
            print('PASS 9 CLASSIFIED first -> AUTHOR later -> base text only; survives a reload')
            # --- 10. No reaction table or removed sentences remain; AUTHOR never discovers a CLASSIFIED --------------------------------------
            src = (ROOT / 'field/field-author.js').read_text(encoding='utf-8')
            assert 'AUTHOR_CLASSIFIED_REACTIONS' not in src and SENTENCE not in src and '네가 묻기 전부터' not in src
            page.evaluate("GameSave.reset()"); boot()
            assert page.evaluate("async (s) => AuthorRoute.tryImport(s)", SECRET) is True and classified_state()['discovered'] == []
            page.evaluate("GameSave.reset()")
            print('PASS 10 the CLASSIFIED reaction lines are gone from the source; unlocking AUTHOR never discovers a CLASSIFIED')
        else:
            print('SKIP 8-10 AUTHOR reaction cases (set AUTHOR_TEST_SECRET)')

        # --- 12. CLASSIFIED 02: EP08 guide re-opened -> 관련 문구 조회 -> EP03 record -> PAIR CROSS-REFERENCE ------------------------
        page.evaluate("GameSave.reset()"); boot()
        R = ROOT / 'docs/transcripts/reviewed'
        ep03 = (R / 'EP03_베리_해피_종합병원.txt').read_text(encoding='utf-8'); ep08 = (R / 'EP08_유성_워터파크.txt').read_text(encoding='utf-8')
        ep09 = (R / 'EP09_안전_안내_문자.txt').read_text(encoding='utf-8')
        for cid, left_src, right_src in [('classified-02', ep08, ep03), ('classified-03', ep03, ep09)]:
            pr = page.evaluate("(id) => Classified.entry(id).pairRef", cid)
            for side, src in [('left', left_src), ('right', right_src)]:
                for line in pr[side]['lines']:
                    assert line['text'] in src, (cid, line['text'])
                    assert all(ph['t'] in line['text'] for ph in line['phrases'])
        TARGET = '치료 프로세스에 협조하지 않는 환자들에게 인내심을 가지는 친절한 병원이 아님을 명심하여 주십시오.'
        assert TARGET in ep08
        def clear_ep(*ids):
            page.evaluate("(ids) => ids.forEach(id => FieldSave.clear(id, { patrols: {}, elapsed: 600, injuries: [] }))", list(ids))
        def fresh_field():
            page.evaluate("FieldUI.close(); FieldUI.open()")
        def open_guide():
            fresh_field(); click('field-guide-EP08-record'); assert has('frec-doc')
        def pick_sentence(text):
            page.locator('#frec-doc .frec-s', has_text=text).first.click(); click('frec-lookup')
        def hits(): return page.locator('#frec-hits').inner_text()
        def pref_click(cid, p): click(f'pref-{cid}-{p}')
        def pref_foot(cid): return page.locator(f'#pref-foot-{cid}').inner_text()
        def drop_toasts(): page.evaluate("document.querySelectorAll('.classified-toast').forEach(t => t.remove())")
        fresh_field(); assert not has('field-guide-EP08-record'), 'no record document without a real EP08 return'
        clear_ep('EP08')
        open_guide()
        content = page.locator('#field-content').inner_text()
        assert 'CLASSIFIED' not in content and '찾기' not in content
        assert page.locator('#frec-lookup').is_disabled()
        pick_sentence('물을 마시지 마십시오'); assert '관련 기록이 없습니다' in hits()
        pick_sentence(TARGET); assert '열람 권한이 없는 기록 1건' in hits() and not has('frec-open-EP03'), 'EP03 not returned from yet'
        clear_ep('EP03')
        open_guide(); pick_sentence(TARGET); assert '[EP.03 베리 해피 종합병원] 현장 생환 기록' in hits()
        assert classified_state()['discovered'] == [], 'a lookup never discovers by itself'
        click('frec-open-EP03'); assert has('pref-classified-02') and 'CROSS-REFERENCE' in page.locator('#pref-classified-02').inner_text()
        pref_click('classified-02', 'l1'); pref_click('classified-02', 'l2')
        assert page.locator('#pref-classified-02-l1').get_attribute('aria-pressed') == 'false' and page.locator('#pref-classified-02-l2').get_attribute('aria-pressed') == 'true', 'same side re-selects'
        pref_click('classified-02', 'r1'); assert pref_foot('classified-02') == '대조 근거 부족'
        pref_click('classified-02', 'l0'); pref_click('classified-02', 'r1'); assert pref_foot('classified-02') == '대조 근거 부족'
        pref_click('classified-02', 'r9'); pref_click('classified-02', 'l1'); assert pref_foot('classified-02') == '대조 근거 부족'
        pref_click('classified-02', 'l1'); pref_click('classified-02', 'r1')
        assert pref_foot('classified-02') == '연결 1 · 대응' and '[1]' in page.locator('#pref-classified-02-r1').inner_text()
        assert classified_state()['discovered'] == [] and state() is None
        page.evaluate("FieldUI.close()"); assert classified_state()['discovered'] == [], 'leaving mid-way grants nothing'
        open_guide(); pick_sentence(TARGET); click('frec-open-EP03')
        assert page.locator('#pref-classified-02 .pref-on').count() == 0, 'a re-entry starts clean'
        for a, b in [('r1', 'l1'), ('l2', 'r2')]: pref_click('classified-02', a); pref_click('classified-02', b)
        page.wait_for_function("Classified.has('classified-02')")
        result = page.locator('#pref-classified-02 .pref-result').inner_text()
        for line in ['[조사 결과]', '이용 안내문 안에서 고객이 환자로 지칭됩니다.', '두 기록 모두 수술 대상과 날짜를 다루고 있습니다.', '두 시설의 관계는 확인되지 않았습니다.']:
            assert line in result, line
        toast = page.locator('.classified-toast').last.inner_text(); assert 'CLASSIFIED 1 / 3' in toast and '환자라고 부르고 있습니다.' in toast
        assert classified_state()['discovered'] == ['classified-02'] and 'CLASSIFIED' in ' '.join(tabs())
        page.evaluate("closeNotebook()"); drop_toasts()
        open_guide(); pick_sentence('환자를 수술하러'); click('frec-open-EP03'); assert '이미 대조한 기록입니다' in hits()
        for a, b in [('l1', 'r1'), ('l2', 'r2')]: pref_click('classified-02', a); pref_click('classified-02', b)
        assert classified_state()['discovered'] == ['classified-02'] and page.locator('.classified-toast').count() == 0, 'repeat grants nothing'
        page.evaluate("openNotebook('classified')"); page.locator('.nb-classified-entry', has_text='02').click()
        doc = page.locator('#classified-document').inner_text()
        for line in ['[분류 보류 기록 02]', TARGET, '대응 1:', '대응 2:', '두 시설의 관계는 확인되지 않았습니다.']:
            assert line in doc, line
        for forbidden in ['같은 시설', '이송', '공동 운영', '원인']:
            assert forbidden not in doc, forbidden
        page.evaluate("closeNotebook()")
        print('PASS 12 C02: EP08 guide re-open (real EP08 return), 관련 문구 조회 (no EP03 return -> locked), EP03 record -> pair cross-reference; wrong pairs show 대조 근거 부족; leaving mid-way grants nothing; 1 / 3; re-view grants nothing')

        # --- 12b. The EP08 clear screen also offers the guide ----------------------------------------------------------------------------
        page.evaluate("Classified.reset()"); clear_ep('EP07'); fresh_field(); click('field-dispatch-EP08')
        page.evaluate("FieldCore.win('[test] clear'); FieldCore.refresh()")
        assert has('field-guide-EP08') and page.locator('#field-guide-EP08').inner_text() == '이용 안내문 다시 열기'
        click('field-guide-EP08'); assert has('frec-doc') and state() is None
        print('PASS 12b the EP08 clear screen has "이용 안내문 다시 열기"; the HQ record keeps the same document reachable later')

        # --- 14. CLASSIFIED 03: terminal search -> both return records open -> 문장 대조 --------------------------------------------------
        page.evaluate("FieldUI.close(); GameSave.reset()"); boot()
        def term(q):
            page.evaluate("(q) => runTerminalCommand(q)", q); page.wait_for_function("!terminalState.busy")
        def tout(): return page.locator('#terminal-output').inner_text()
        page.evaluate("openTerminal()"); page.wait_for_function("!terminalState.busy")
        clear_ep('EP03')
        term('구조 요원'); assert '현장 생환 기록 1건' in tout() and '[EP.03 베리 해피 종합병원 · 현장 생환 기록]' in tout() and 'EP.09' not in tout()
        page.locator('[id^="trec-open-EP03-"]').last.click()
        assert '정부에서 투입되는 구조 요원들은 귀하의 모든 개인 정보를 알고 있습니다.' in tout() and not has('trec-compare'), 'one record = an ordinary lookup'
        clear_ep('EP09')
        page.locator('.trec-term', has_text='개인 정보').last.click(); page.wait_for_function("!terminalState.busy")
        term('위치'); assert '[EP.09 안전 안내 문자 · 현장 생환 기록]' in tout()
        assert classified_state()['discovered'] == [], 'searching never discovers'
        page.locator('[id^="trec-open-EP09-"]').last.click(); assert has('trec-compare')
        assert classified_state()['discovered'] == [], 'opening both records never discovers'
        click('trec-compare'); assert has('pref-classified-03') and 'pref-stack' in page.locator('#pref-classified-03').get_attribute('class')
        pref_click('classified-03', 'l1'); pref_click('classified-03', 'r1'); assert pref_foot('classified-03') == '대조 근거 부족', 'opposite meaning is not "same"'
        pref_click('classified-03', 'l2'); pref_click('classified-03', 'r2'); assert pref_foot('classified-03') == '대조 근거 부족'
        pref_click('classified-03', 'r9'); pref_click('classified-03', 'l9'); assert pref_foot('classified-03') == '대조 근거 부족'
        pref_click('classified-03', 'l1'); pref_click('classified-03', 'r2'); assert pref_foot('classified-03') == '연결 1 · 공통'
        pref_click('classified-03', 'r1'); pref_click('classified-03', 'l2'); assert pref_foot('classified-03') == '연결 2 · 대비 · 정상 절차 / 경고 조건'
        page.wait_for_function("Classified.has('classified-03')")
        result = page.locator('#pref-classified-03 .pref-result').inner_text()
        for line in ['두 기록은 구조 요원이 대상자의 정보를 이미 알고 있다고 안내합니다.', '요원이라는 주장만으로는 상대를 확인할 수 없습니다.', '두 사건에서 정보를 요구한 인원들의 관계는 확인되지 않았습니다.']:
            assert line in result, line
        assert 'CLASSIFIED 1 / 3' in page.locator('.classified-toast').last.inner_text()
        drop_toasts()
        term('0050-0200'); assert '0050-0200 (본부 번호)' in tout() or '열람 권한이 없습니다' in tout(), 'the existing HQ-number response is kept'
        assert classified_state()['discovered'] == ['classified-03']
        page.evaluate("closeTerminal()")
        print('PASS 14 C03: terminal search lists real return records; one record is a plain lookup; EP03 + EP09 open -> 문장 대조; 공통 / 대비 pairs; opposite phrases never linked as same; 1 / 3')

        # --- 15. Third discovery is silent (any order); 11 / 10 appears only on a later visit ---------------------------------------------
        clear_ep('EP08'); fresh_field(); field_before = page.evaluate("JSON.stringify(FieldSave.get())")
        page.evaluate("Classified.discover('classified-01')")
        assert 'CLASSIFIED 2 / 3' in page.locator('.classified-toast').last.inner_text(), 'the second toast is kept'
        drop_toasts()
        open_guide(); pick_sentence(TARGET); click('frec-open-EP03')
        for a, b in [('l1', 'r1'), ('l2', 'r2')]: pref_click('classified-02', a); pref_click('classified-02', b)
        page.wait_for_function("Classified.count() === 3")
        assert '두 시설의 관계는 확인되지 않았습니다.' in page.locator('#pref-classified-02 .pref-result').inner_text(), 'the conclusion still shows'
        page.wait_for_timeout(50)
        assert page.locator('.classified-toast').count() == 0 and page.locator('text=SECRET COMPLETE').count() == 0 and page.locator('text=UNLOCK').count() == 0, 'third discovery: no toast, no notice'
        page.evaluate("FieldUI.catalog()"); assert not has('field-dispatch-1110'), 'never inserted into the list that is already open'
        page.wait_for_timeout(5); fresh_field(); assert has('field-dispatch-1110') and '11 / 10' in page.locator('.field-case-1110').inner_text()
        body = re.sub(r'[ \t]+', ' ', page.evaluate("openNotebook('classified'), document.getElementById('notebook-body').innerText"))
        assert '3 / 3' in body and 'COMPLETE' not in body; page.evaluate("closeNotebook()")
        assert page.evaluate("JSON.stringify(FieldSave.get())") == field_before, '11 / 10 never touches the Field record'
        page.reload(wait_until='load'); boot(); page.evaluate("FieldUI.open()"); assert has('field-dispatch-1110'), 'after a reload'
        code = page.evaluate("GameSave.exportCode()"); page.evaluate("FieldUI.close(); Classified.reset()")
        assert page.evaluate("(c) => GameSave.importCode(c)", code)
        page.evaluate("FieldUI.open()"); assert has('field-dispatch-1110'), 'after a Save Code import'
        print('PASS 15 third discovery (any record) is silent: conclusion shown, 3 / 3, no toast; 11 / 10 row only on a later visit, also after reload and Save Code import; Field record untouched')

        # --- 16. 11 / 10 sequence ------------------------------------------------------------------------------------------------------------
        page.evaluate("Object.assign(ElevenTenView.timing, { loading: 30, blank: 30, flicker: 30, follow: 30, early: 60, idle: 120, residual: 400 })")
        def e11_to_scene3():
            click('field-dispatch-1110'); page.wait_for_selector('#e11-loading'); page.wait_for_selector('#e11-open')
            case = page.locator('#e11-case').inner_text()
            assert '사건명' in case and '관측 위치' in case and '문서 번호' in case and '11 / 10' in case and 'EP' not in case
            click('e11-open'); ov = page.locator('#e11-overlay').inner_text(); assert ov in ep03, 'EP03 sentence verbatim'
            assert page.locator('#e11-screen video').get_attribute('src').endswith('ep8_idle.mp4')
            click('e11-src'); src = page.locator('#e11-src-list').inner_text(); assert '화면: EP08' in src and '문서: EP03' in src
            click('e11-next'); ph = page.locator('#e11-phone').inner_text()
            assert '안전 안내 문자. 특별재난관리본부.' in ph and '귀하는 금일 수신한 통화로 관리 대상자로 분류되었습니다.' in ph and '귀하는 금일 수신한 통화로 관리 대상자로 분류되었습니다.' in ep09
            assert '[수신음]' in page.locator('#e11-sig').inner_text()
            click('e11-next2')
        fresh_field(); e11_to_scene3()
        page.wait_for_timeout(800); assert '[자동문 알림음]' not in page.locator('#e11-sig').inner_text(), 'EP07 never returned from: no chime'
        page.evaluate("FieldUI.close()"); assert page.evaluate("ElevenTenView.active()") is False and page.evaluate("Classified.eleven()") is None and not has('e11')
        clear_ep('EP07')
        fresh_field(); e11_to_scene3(); page.wait_for_selector('text=[자동문 알림음]')
        for k in ['screen', 'doc', 'comm']: click('e11-src-' + k)
        srcs = page.locator('#e11-sources').inner_text(); assert 'EP08' in srcs and 'EP03' in srcs and 'EP09' in srcs
        click('e11-compare'); click('e11-subject')
        acts = page.locator('#e11-acts').inner_text()
        for label in ['문서 열람', '출처 선택', '기록 대조']: assert re.search(label + r'\s+\d{2}:\d{2}:\d{2}', acts), acts
        assert '127.0.0.1' not in acts and 'Mozilla' not in acts
        click('e11-next3'); page.wait_for_selector('#e11-toggle')
        assert page.locator('#e11-mini').get_attribute('aria-hidden') == 'true' and page.locator('#e11-mini button, #e11-mini input, #e11-mini a').count() == 0
        mini_hidden = lambda: page.evaluate("document.querySelector('#e11-mini .e11-mini-table').hidden")
        click('e11-toggle'); page.wait_for_timeout(70); assert not mini_hidden(), 'the inner table follows the player'
        click('e11-toggle'); page.wait_for_timeout(70); assert mini_hidden()
        click('e11-toggle'); page.wait_for_selector('#e11-next4')
        assert mini_hidden() and page.locator('#e11-real-table').is_visible(), 'once, the inner table folds before the player'
        assert page.evaluate("Classified.eleven()") is None
        click('e11-next4'); assert '관측 위치를 확인할 수 없습니다.' in page.locator('#e11-end').inner_text()
        assert page.locator('#field-content', has_text='CLEAR').count() == 0 and page.locator('text=TRUE END').count() == 0
        e = page.evaluate("Classified.eleven()"); assert e and set(e['acts']) == {'read', 'pick', 'compare'}
        page.wait_for_selector('#field-dispatch-1110'); assert page.evaluate("ElevenTenView.active()") is False
        fs = page.evaluate("FieldSave.get()"); assert sorted(fs['cleared']) == ['EP03', 'EP07', 'EP08', 'EP09'] and 'EP11' not in str(fs)
        click('field-dispatch-1110'); click('e11-file'); txt = page.locator('#e11-residual-text').inner_text()
        for line in ['관측 기록: 11 / 10', '관측 위치: 미확인', '화면 출처와 문서 출처는 대조되었습니다.', '관측 대상은 확인되지 않았습니다.', '문서 열람', '출처 선택']:
            assert line in txt, line
        assert re.search(r'기록 대조 \d{2}:\d{2}:\d{2}$', txt.strip()), txt
        click('e11-replay'); page.wait_for_selector('#e11-open'); page.evaluate("FieldUI.close()")
        assert page.evaluate("Classified.eleven()")['acts'] == e['acts'], 'an aborted replay keeps the saved record'
        size = len(page.evaluate("localStorage.getItem('yuyeon98.classified.v1')"))
        page.evaluate("FieldUI.open()"); click('field-dispatch-1110'); click('e11-replay'); page.wait_for_selector('#e11-open')
        click('e11-open'); click('e11-src'); click('e11-next'); click('e11-next2')
        for k in ['screen', 'doc', 'comm']: click('e11-src-' + k)
        click('e11-compare'); click('e11-subject'); click('e11-next3'); page.wait_for_selector('#e11-toggle'); click('e11-toggle'); page.wait_for_selector('#e11-next4'); click('e11-next4')
        page.wait_for_selector('#field-dispatch-1110')
        assert abs(len(page.evaluate("localStorage.getItem('yuyeon98.classified.v1')")) - size) <= 2, 'replays never grow the record'
        code = page.evaluate("GameSave.exportCode()"); page.evaluate("FieldUI.close(); Classified.reset()")
        assert page.evaluate("(c) => GameSave.importCode(c)", code) and page.evaluate("Classified.eleven()") is not None, 'the residual record travels in the Save Code'
        page.evaluate("FieldUI.open()"); click('field-dispatch-1110'); click('e11-replay'); page.wait_for_selector('#e11-open')
        page.evaluate("GameSave.reset()"); assert page.evaluate("ElevenTenView.active()") is False and not has('e11'), 'reset stops the sequence'
        assert page.evaluate("Classified.eleven()") is None
        page.wait_for_timeout(300); assert not has('e11') and page.evaluate("Classified.eleven()") is None, 'no late timer revives it'
        print('PASS 16 11 / 10: loading without case data, EP08 screen + EP03 sentence, sources, EP09 overlay, chime only with an EP07 return, observed-subject actions with real time, inert inner window folding once ahead, residual file; mid-exit saves nothing; replay bounded; Save Code; reset stops it')

        # --- 17. The dev unlock never satisfies discovery; narrow screen -------------------------------------------------------------------
        page.evaluate("FieldUI.close()")
        page.goto(BASE + '/', wait_until='load')
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")
        assert page.evaluate("FieldSave.devUnlock") is True and page.evaluate("Classified.eligible('classified-02') || Classified.eligible('classified-03')") is False
        page.evaluate("FieldUI.open()"); assert not has('field-guide-EP08-record') and not has('field-dev-panel')
        page.evaluate("openTerminal()"); page.wait_for_function("!terminalState.busy"); term('구조 요원'); assert '현장 생환 기록' not in tout(); page.evaluate("closeTerminal(); FieldUI.close()")
        boot()
        page.set_viewport_size({'width': 390, 'height': 844})
        clear_ep('EP03', 'EP08')
        open_guide(); pick_sentence(TARGET); click('frec-open-EP03')
        cols = page.evaluate("getComputedStyle(document.querySelector('#pref-classified-02 .pref-cols')).gridTemplateColumns")
        assert len(cols.split()) == 1, cols
        page.set_viewport_size({'width': 1280, 'height': 900}); page.evaluate("FieldUI.close(); GameSave.reset()")
        print('PASS 17 the dev unlock alone opens no record, no lookup and no discovery (no test presets); at 390px the two records stack')

        # --- 13. AUTHOR input handling (exact secret only from the environment) -------------------------------------------------------
        if SECRET:
            for wrong in [SECRET.lower(), SECRET + 'x', SECRET.replace('-', ''), '']:
                assert page.evaluate("async (s) => AuthorRoute.matches(s)", wrong) is False, 'case-sensitive, exact'
            width = ''.join(chr(ord(c) + 0xFEE0) if '!' <= c <= '~' else c for c in SECRET)
            assert page.evaluate("async (s) => AuthorRoute.matches(s)", '  ' + width + '\n') is True, 'trim -> NFKC'
            for path in list(ROOT.glob('*.js')) + list(ROOT.glob('field/**/*.js')) + list(ROOT.glob('*.html')) + list(ROOT.glob('*.md')) + list(ROOT.glob('tests/*.py')):
                assert SECRET not in path.read_text(encoding='utf-8', errors='ignore'), 'plaintext secret in ' + str(path)
            print('PASS 13 AUTHOR: wrong / lower-case / partial fail, full-width + spaces normalize, no plaintext secret anywhere in the source')

        # --- 11. Story / Field independence ---------------------------------------------------------------------------------------------------
        assert page.evaluate("!GameSave.get().flags.finaleSeen && !GameSave.get().flags.jayUnlocked")
        print('PASS 11 CLASSIFIED / AUTHOR never touch finaleSeen, jayUnlocked or the Story flags')

        assert not errors, errors
        browser.close()
        print('ALL CLASSIFIED CHECKS PASSED')


if __name__ == '__main__':
    run()
