"""AUTHOR UI integration. All input codes/hashes are generated in isolated browser memory.
Requires the same running Express server, Playwright and Chromium as field_browser_smoke.py.
No real author secret or user save is used. The supplied hash is checked as configuration;
positive Web Crypto flows use an ephemeral test-only code/hash override.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')


def run():
    source = (Path(__file__).resolve().parents[1] / 'field/field-author.js').read_text()
    assert "const AUTHOR_SAVE_HASH = 'f7dda4fd1a2aaaae283a1382d8e0f5f39abe70d410d9cf1a438e58c0aaa220ae';" in source
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                    headless=True, args=['--no-sandbox'])
        context = browser.new_context()
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('dialog', lambda dialog: dialog.accept())

        def enter():
            page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); openNotebook('record');")

        def import_ui(code):
            page.locator('#save-code-input').fill(code)
            page.locator('#save-code-import').click()

        page.goto(BASE, wait_until='load'); enter()
        assert page.evaluate('AuthorRoute.get()') == {'v':1, 'unlocked':False, 'authorAccessLevel':0, 'authorTraces':[]}
        assert not page.locator('#author-note-icon').is_visible()
        assert page.evaluate("AuthorRoute.normalize('  Ａｂ　Ｃ  ')") == 'Ab C'
        assert page.evaluate("AuthorRoute.normalize('Ab') !== AuthorRoute.normalize('ab')")
        # NFKC introduces a leading space here: trimming must happen BEFORE normalization.
        assert page.evaluate("AuthorRoute.normalize(' ¨X ')") == ' \u0308X'
        assert not page.evaluate("AuthorRoute.setHashOverride('not-a-hash')")
        assert not page.evaluate("AuthorRoute.tryImport('nonmatching-input')")
        # Legacy format fixtures with one episode and clue. Check the real UI and reload path.
        for version in [2, 3, 4]:
            code = page.evaluate(r'''version => {
                const b = [version,1,1,0,0];
                if (version >= 3) b.push(0);
                b.push(2,1,1,0); // EP01 clear/death, first clue, no J/ending flags
                if (version >= 4) b.push(0,0);
                b.push(b.reduce((a,n) => (a+n)&255,0));
                return btoa(String.fromCharCode(...b)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
            }''', version)
            with page.expect_navigation(wait_until='load'):
                import_ui(code)
            assert page.evaluate('GameSave.ep(1).clears === 2 && GameSave.ep(1).deaths === 1')
            assert page.evaluate('GameSave.hasClue(CLUES[0].id)')
            assert not page.evaluate('AuthorRoute.get().unlocked')
            enter()
        exported = page.evaluate('GameSave.exportStoryCode()')
        with page.expect_navigation(wait_until='load'): import_ui(exported)
        assert page.evaluate('GameSave.exportStoryCode()') == exported
        enter()
        story_before = page.evaluate('JSON.stringify(GameSave.get())')
        field_before = page.evaluate('JSON.stringify(FieldSave.get())')
        import_ui('invalid-input')
        page.wait_for_function("document.getElementById('save-code-status').textContent === '올바르지 않은 코드입니다.'")
        assert page.evaluate('JSON.stringify(GameSave.get())') == story_before
        # Ephemeral test-only data: a new random code/hash for each browser run.
        page.evaluate('''async () => {
            window.testAuthorInput = crypto.randomUUID();
            const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(AuthorRoute.normalize(testAuthorInput)));
            window.testAuthorHash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2,'0')).join('');
            AuthorRoute.setHashOverride(testAuthorHash);
        }''')
        assert not page.evaluate('AuthorRoute.matches(testAuthorInput.toUpperCase())')
        assert not page.evaluate("AuthorRoute.matches('other-input')")
        # Crypto errors must not consume a normal code or unlock the route.
        assert page.evaluate('''async code => {
            const original = crypto.subtle.digest;
            crypto.subtle.digest = () => Promise.reject(new Error('test unavailable'));
            try { return !(await AuthorRoute.tryImport(testAuthorInput)) && GameSave.importCode(code); }
            finally { crypto.subtle.digest = original; }
        }''', exported)
        enter()
        story_before = page.evaluate('JSON.stringify(GameSave.get())')
        page.evaluate('''() => {
            window.authorMessages = [];
            const node = document.getElementById('save-code-status');
            new MutationObserver(() => authorMessages.push(node.textContent)).observe(node, {childList:true});
        }''')
        code = page.evaluate("'　' + Array.from(testAuthorInput, c => String.fromCharCode(c.charCodeAt(0)+0xFEE0)).join('') + '　'")
        import_ui(code)
        page.wait_for_function("document.getElementById('save-code-import') && !document.getElementById('save-code-import').disabled && document.getElementById('save-code-status').textContent === '[RECORD RESTORED]'")
        assert page.evaluate('authorMessages') == ['[UNKNOWN SAVE FORMAT]', '[IDENTITY RECORD FOUND]', '[RECORD RESTORED]']
        assert page.locator('#save-code-input').input_value() == ''
        assert page.evaluate('AuthorRoute.get().unlocked && AuthorRoute.get().authorAccessLevel === 1')
        assert page.evaluate('JSON.stringify(GameSave.get())') == story_before
        assert page.evaluate('JSON.stringify(FieldSave.get())') == field_before
        assert page.evaluate('GameSave.exportStoryCode()') == exported
        assert page.locator('#author-note-icon').is_visible()
        page.evaluate('closeNotebook()')
        for _ in range(2):
            page.locator('#author-note-icon').click()
            assert page.locator('#author-note-text').is_visible()
            assert page.locator('#author-note-text').input_value() == ('누군가 이 창을 다시 열어 주었다.\n'
                '남겨 둔 문장 하나는, 여기까지 읽어 준 사람에게.\n\n'
                '영원을 약속하지는 못하겠지만, 지금 이 순간을 너와 함께')
            # The note uses the existing Darkweb document's typography, spacing and scroll region.
            assert page.evaluate('''() => {
                const props = ['fontFamily','fontSize','fontWeight','lineHeight','letterSpacing',
                    'paddingTop','paddingBottom','paddingLeft','paddingRight','marginTop','marginBottom',
                    'marginLeft','marginRight','overflowX','overflowY'];
                for (const part of ['.window-header','.window-content','textarea']) {
                    const reference = getComputedStyle(document.querySelector('#darkwebReadmeWindow '+part));
                    const note = getComputedStyle(document.querySelector('#authorNoteWindow '+part));
                    if (!props.every(key => note[key] === reference[key])) return false;
                }
                return document.getElementById('author-note-text').readOnly;
            }''')
            page.locator('#author-note-close').click()
        assert page.evaluate('AuthorRoute.get().authorTraces') == ['creator-note']
        page.evaluate('FieldUI.open()')
        page.locator('#field-dispatch-EP01').click()
        assert '[수신 여백]' in page.locator('#field-log').inner_text()
        assert page.evaluate('FieldCore.get().duration === 720 && FieldCore.get().status === "active"')
        assert page.evaluate('JSON.stringify(FieldSave.get())') == field_before
        page.locator('#field-close').click(); page.evaluate('FieldUI.open()')
        page.locator('#field-dispatch-EP01').click()
        assert '[수신 여백]' not in page.locator('#field-log').inner_text()
        page.locator('#field-close').click()
        assert page.evaluate('AuthorRoute.get().authorTraces') == ['creator-note', 'ep01-observation']
        assert not page.evaluate("AuthorRoute.addTrace('ep01-observation')")
        page.reload(wait_until='load'); enter()
        assert page.evaluate('AuthorRoute.get().unlocked && AuthorRoute.get().authorTraces.length === 2')
        assert not page.evaluate("GameSave.flag('jayUnlocked') || GameSave.flag('finaleSeen')")
        assert page.evaluate('JSON.stringify(FieldSave.get())') == field_before
        # Normal import replaces only Story state, leaving AUTHOR metadata intact.
        with page.expect_navigation(wait_until='load'): import_ui(exported)
        assert page.evaluate('AuthorRoute.get().authorTraces.length === 2')
        enter()
        page.evaluate("phoneCurrentPhase=3; document.getElementById('phone-input').disabled=false; document.getElementById('phone-input').value='5264'; handlePhoneInputSubmit(); openJayReport(); closeJayReport();")
        assert page.evaluate("GameSave.flag('jayUnlocked') && GameSave.flag('finaleSeen')")
        assert page.evaluate('JSON.stringify(FieldSave.get())') == field_before
        page.evaluate('applyLoopDesktopState(false)')
        assert 'LOOP 02' in page.locator('#darkweb-desktop').inner_text()
        assert page.evaluate('AuthorRoute.get().authorTraces.length === 2')
        fresh = browser.new_context(); fresh_page = fresh.new_page(); fresh_page.goto(BASE, wait_until='load')
        assert not fresh_page.evaluate('AuthorRoute.get().unlocked')
        assert not fresh_page.evaluate("AuthorRoute.addTrace('creator-note')")
        assert not fresh_page.locator('#author-note-icon').is_visible()
        fresh.close()
        assert not errors, errors
        context.close(); browser.close()
    print('PASS AUTHOR normalization/hash match, staged UI, v2/v3/v4 and normal import, crypto fallback, isolated persistence/defaults, two deduplicated traces, Story/J/LOOP and Field independence')


if __name__ == '__main__':
    run()
