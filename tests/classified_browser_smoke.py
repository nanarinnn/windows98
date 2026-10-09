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
        page.reload(wait_until='load'); boot(); assert classified_state() == {'v': 1, 'discovered': ['classified-01'], 'viewed': []}, 'unknown ids are dropped'
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
        print('PASS 7 a normal player discovers CLASSIFIED 01 but never sees the AUTHOR file, traces or the AUTHOR sentence')

        if SECRET:
            def author_note():
                page.locator('#author-note-icon').click()
                text = page.locator('#author-note-text').input_value()
                page.locator('#author-note-close').click(); return text
            BASE_NOTE = '누군가 이 창을 다시 열어 주었다.\n남겨 둔 문장 하나는, 여기까지 읽어 준 사람에게.\n\n영원을 약속하지는 못하겠지만, 지금 이 순간을 너와 함께'
            # --- 8. Case A: AUTHOR first, classified later (also through the real in-game path) -----------------------------------------------
            page.evaluate("GameSave.reset()"); boot()
            assert page.evaluate("async (s) => AuthorRoute.tryImport(s)", SECRET) is True
            assert page.locator('#author-note-icon').is_visible() and classified_state()['discovered'] == [], 'AUTHOR does not unlock CLASSIFIED'
            assert author_note() == BASE_NOTE, 'before the discovery: the base text only'
            assert 'CLASSIFIED' not in ' '.join(tabs()), 'AUTHOR still has no CLASSIFIED menu before discovering one'
            page.evaluate("for (const id of ['EP01', 'EP02', 'EP03', 'EP04', 'EP05']) FieldSave.clear(id, { patrols: {}, elapsed: 700, injuries: [] })")
            click('field-open'); play_ep06_to_clear(); page.evaluate("FieldEP06UI.post.delay = 0")
            click('f6-seat-17'); click('f6-recheck-17')
            for i in [0, 5, 6, 7]: click('xref-tok-%d' % i)
            page.wait_for_function("Classified.has('classified-01')")
            toast = page.locator('.classified-toast').inner_text()
            assert 'AUTHOR' not in toast and SENTENCE not in toast and not page.evaluate("(s) => document.getElementById('author-note-text').value.includes(s)", SENTENCE), 'no AUTHOR popup on discovery'
            body = page.evaluate("openNotebook('classified'), document.getElementById('notebook-body').innerText")
            assert 'AUTHOR' not in body and 'BONUS' not in body and 'ACCESS' not in body
            assert author_note() == BASE_NOTE + '\n\n' + SENTENCE, 'reopened after the discovery: the sentence is appended'
            assert page.evaluate("document.getElementById('author-note-text').value.endsWith('연결한 건 내가 아니야.')")
            page.evaluate("Classified.reset()"); assert author_note() == BASE_NOTE
            print('PASS 8 AUTHOR first -> CLASSIFIED 01 discovered in-game -> re-opening the file appends the sentence (no popup); before the discovery only the base text')
            # --- 9. Case B: CLASSIFIED first, AUTHOR later --------------------------------------------------------------------------------------
            page.evaluate("GameSave.reset()"); boot()
            page.evaluate("Classified.discover('classified-01', { announce: false })")
            assert page.locator('#author-note-icon').is_hidden()
            assert page.evaluate("async (s) => AuthorRoute.tryImport(s)", SECRET) is True
            assert author_note() == BASE_NOTE + '\n\n' + SENTENCE
            page.reload(wait_until='load'); boot(); assert author_note() == BASE_NOTE + '\n\n' + SENTENCE
            print('PASS 9 CLASSIFIED first -> AUTHOR unlocked later -> the same sentence is shown; survives a reload')
            # --- 10. The reaction table is the only place the sentence exists and AUTHOR gets no automatic discovery ------------------------------
            src = (ROOT / 'field/field-author.js').read_text(encoding='utf-8')
            assert 'AUTHOR_CLASSIFIED_REACTIONS' in src and src.count(SENTENCE) == 1
            page.evaluate("GameSave.reset()"); boot()
            assert page.evaluate("async (s) => AuthorRoute.tryImport(s)", SECRET) is True and classified_state()['discovered'] == []
            page.evaluate("GameSave.reset()")
            print('PASS 10 reaction table architecture; unlocking AUTHOR never discovers a CLASSIFIED')
        else:
            print('SKIP 8-10 AUTHOR reaction cases (set AUTHOR_TEST_SECRET)')

        # --- 12. 3 / 3 and the 11 / 10 hook (simulated: 02/03 are undefined in the game) --------------------------------------------------
        page.evaluate("GameSave.reset()"); boot()
        assert page.evaluate("ElevenTen.ready()") is False and page.evaluate("CLASSIFIED_ENTRIES.length") == 1, 'today 3 / 3 is unreachable'
        field_before = page.evaluate("JSON.stringify(FieldSave.get())")
        page.evaluate("""for (const n of ['02', '03']) CLASSIFIED_ENTRIES.push({ id: 'classified-' + n, number: n, title: 'TEST', document: 'TEST', announce: ['TEST'] })""")
        click('field-open'); assert not has('field-dispatch-1110')
        for n in ['01', '02', '03']: page.evaluate("(id) => Classified.discover(id, { announce: false })", 'classified-' + n)
        assert page.evaluate("Classified.count()") == 3 and page.evaluate("Classified.completeAt()") > 0
        assert page.locator('text=SECRET COMPLETE').count() == 0 and page.locator('text=11/10 UNLOCKED').count() == 0, 'no popup at 3 / 3'
        page.evaluate("FieldUI.close(); FieldUI.open()")
        page.wait_for_timeout(5); page.evaluate("FieldUI.close(); FieldUI.open()")
        assert has('field-dispatch-1110') and '11 / 10' in page.locator('.field-case-1110').inner_text(), 'the row appears quietly on a later visit'
        body = re.sub(r'[ \t]+', ' ', page.evaluate("openNotebook('classified'), document.getElementById('notebook-body').innerText"))
        assert '3 / 3' in body and 'COMPLETE' not in body
        assert page.evaluate("JSON.stringify(FieldSave.get())") == field_before, '11 / 10 never touches the Field record (10 / 10 stays 10 / 10)'
        page.evaluate("closeNotebook(); FieldUI.close(); CLASSIFIED_ENTRIES.splice(1); Classified.reset()")
        print('PASS 12 3 / 3 quietly; 11 / 10 row only on a later Field Observation visit; Field record untouched; unreachable with 02/03 undefined')

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
