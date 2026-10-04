"""Full-record deletion and AUTHOR visibility checks in isolated browser storage."""
import os
from playwright.sync_api import sync_playwright

BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')
FIELD_BLANK = {'v':1,'cleared':[],'unlocked':['EP01'],'deaths':{},'records':{}}
AUTHOR_BLANK = {'v':1,'unlocked':False,'authorAccessLevel':0,'authorTraces':[]}


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                    headless=True, args=['--no-sandbox'])
        context = browser.new_context(); page = context.new_page(); errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('dialog', lambda dialog: dialog.accept())
        # Inspect the icon synchronously at DOM insertion, before state-dependent update.
        page.add_init_script('''(() => {
            const original=Element.prototype.append;
            Element.prototype.append=function(...nodes) {
                for(const node of nodes) if(node?.id==='author-note-icon')
                    window.authorInitialDisplay=node.style.display;
                return original.apply(this,nodes);
            };
        })();''')

        def enter():
            page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); openNotebook('record');")

        def unlock():
            # Random ephemeral fixture, never the real AUTHOR secret.
            value = page.evaluate('''async () => {
                window.testAuthorInput=crypto.randomUUID();
                const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(testAuthorInput));
                AuthorRoute.setHashOverride(Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,'0')).join(''));
                return testAuthorInput;
            }''')
            page.locator('#save-code-input').fill(value)
            page.locator('#save-code-import').click()
            page.wait_for_function("document.getElementById('save-code-status').textContent==='[RECORD RESTORED]' && !document.getElementById('save-code-import').disabled")
            assert page.locator('#author-note-icon').is_visible()

        def open_note():
            page.evaluate('closeNotebook()'); page.locator('#author-note-icon').click()
            assert page.locator('#author-note-text').is_visible()
            assert page.evaluate('AuthorRoute.get().authorTraces') == ['creator-note']

        page.goto(BASE, wait_until='load'); enter()
        assert page.evaluate('authorInitialDisplay') == 'none'
        assert not page.locator('#author-note-icon').is_visible()
        assert page.evaluate('AuthorRoute.get()') == AUTHOR_BLANK
        unlock(); open_note()
        # Standalone AUTHOR reset hides both icon and OPEN note synchronously, without reload.
        page.evaluate('AuthorRoute.reset()')
        assert not page.locator('#author-note-icon').is_visible()
        assert not page.locator('#authorNoteWindow').is_visible()
        assert page.evaluate('AuthorRoute.get()') == AUTHOR_BLANK
        assert page.evaluate('AuthorRoute.matches(testAuthorInput)')
        enter(); unlock(); open_note()  # The same trace can be awarded again.
        page.evaluate("GameSave.markClear(1); GameSave.markDeath(1); GameSave.addClue(CLUES[0].id); FieldSave.clear('EP01',{patrols:{0:true},elapsed:720,injuries:[]}); FieldSave.death('EP01'); FieldCore.dispatch('EP01');")
        assert page.evaluate('FieldCore.get().status === "active"')
        # Capture synchronous results of the actual UI handler before its existing reload.
        page.evaluate('''() => {
            const original=GameSave.reset;
            GameSave.reset=() => {
                original();
                sessionStorage.setItem('reset-test-snapshot',JSON.stringify({
                    field:FieldSave.get(),author:AuthorRoute.get(),story:GameSave.get(),
                    run:FieldCore.get(),icon:document.getElementById('author-note-icon').style.display,
                    note:document.getElementById('authorNoteWindow').style.display
                }));
            };
            openNotebook('record');
        }''')
        with page.expect_navigation(wait_until='load'):
            page.get_by_role('button', name='모든 진행 기록 삭제', exact=True).click()
        snapshot = page.evaluate("JSON.parse(sessionStorage.getItem('reset-test-snapshot'))")
        assert snapshot['field'] == FIELD_BLANK and snapshot['author'] == AUTHOR_BLANK
        assert snapshot['run'] is None and snapshot['icon'] == 'none' and snapshot['note'] == 'none'
        for name in ['eps','clues','deductions','achievements','secrets','flags']:
            assert snapshot['story'][name] == {}
        assert snapshot['story']['workerNo'] == 0
        enter()
        assert page.evaluate('authorInitialDisplay') == 'none'
        assert not page.locator('#author-note-icon').is_visible()
        assert page.evaluate('FieldSave.get()') == FIELD_BLANK
        assert page.evaluate('AuthorRoute.get()') == AUTHOR_BLANK
        assert page.evaluate("JSON.parse(localStorage.getItem('yuyeon98.field.v1'))") == FIELD_BLANK
        assert page.evaluate("JSON.parse(localStorage.getItem('yuyeon98.author.v1'))") == AUTHOR_BLANK
        page.wait_for_timeout(350)
        assert page.evaluate('FieldSave.get()') == FIELD_BLANK
        unlock(); open_note()
        assert page.evaluate('AuthorRoute.get().authorTraces') == ['creator-note']
        page.reload(wait_until='load'); enter()
        assert page.locator('#author-note-icon').is_visible()  # New unlock still persists.
        # Field's own reset must also disconnect safely, without resetting Story/AUTHOR.
        page.evaluate("FieldSave.clear('EP01',{patrols:{},elapsed:720}); FieldSave.death('EP01'); FieldCore.dispatch('EP01'); FieldSave.reset();")
        assert page.evaluate('FieldCore.get()') is None
        assert page.evaluate('FieldSave.get()') == FIELD_BLANK
        assert page.evaluate('AuthorRoute.get().unlocked')
        assert not errors, errors
        context.close(); browser.close()
    print('PASS AUTHOR pre-insertion hiding, hash entry/re-entry, immediate note/icon removal, trace re-award; real reset UI clears Story/Field/AUTHOR and live session, reload persistence, independent Field reset')


if __name__ == '__main__':
    run()
