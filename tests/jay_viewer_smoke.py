"""[요원 제이의 기록] presentation-layer smoke test (jay-viewer.js). Requires Python Playwright and Chromium plus the Express
server:  npm start   then   python tests/jay_viewer_smoke.py
Isolated browser storage; no real save is read or changed.
Checks: unlock conditions and Field independence unchanged, the record text never altered, scroll stages 1->4, ghost/echo
text copied from the record only, closing / reaching the end still runs the existing triggerLoopShutdown() flow.
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')


def run():
    html = (ROOT / 'index.html').read_text(encoding='utf-8')
    source = re.search(r'<textarea id="jay-report-textarea"[^>]*>([\s\S]*?)</textarea>', html).group(1).replace('\r\n', '\n')
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
        page = browser.new_context(viewport={'width': 1280, 'height': 900}).new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/?devunlock=0', wait_until='load')
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")

        def value(): return page.evaluate("document.getElementById('jay-report-textarea').value").replace('\r\n', '\n')
        def stage(): return page.evaluate("JayViewer.stage")
        def flags(): return page.evaluate("JSON.parse(localStorage.getItem('yuyeon98.save.v1') || '{}').flags || {}")

        # --- unlock conditions untouched; Field clears do not unlock J ------------------------------------------------------
        assert page.locator('#jay-report-icon').is_hidden() and not flags().get('jayUnlocked')
        page.evaluate("for (let n = 1; n <= 10; n++) FieldSave.clear('EP' + String(n).padStart(2, '0'), { patrols: {}, elapsed: 1, injuries: [] })")
        page.reload(wait_until='load')
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")
        assert page.locator('#jay-report-icon').is_hidden() and not flags().get('jayUnlocked'), 'Field 10/10 is not a J condition'
        assert value() == source, 'the record text is the textarea content as written'
        print('PASS unlock: J stays hidden without the Story condition even with Field 10/10; text identical to the source')

        # --- the existing Story path opens it ------------------------------------------------------------------------------
        page.evaluate("unlockJayReport(); openJayReport()")
        assert page.locator('#jayReportWindow').is_visible() and stage() == 1 and 'jv-s1' in page.locator('#jayReportWindow').get_attribute('class')
        markers = page.evaluate("JayViewer.STAGE_MARKERS.map(m => m.marker)")
        assert all(m in source for m in markers), 'stage markers are phrases of the record itself'
        ta = page.locator('#jay-report-textarea')
        seen = []
        for frac in [0.0, 0.2, 0.5, 0.8, 0.95]:
            page.evaluate("(f) => { const t = document.getElementById('jay-report-textarea'); t.scrollTop = (t.scrollHeight - t.clientHeight) * f; t.dispatchEvent(new Event('scroll')); }", frac)
            page.wait_for_timeout(50); seen.append(stage())
        assert seen == sorted(seen) and seen[0] == 1 and seen[-1] == 4 and 2 in seen and 3 in seen, seen
        assert 'jv-s4' in page.locator('#jayReportWindow').get_attribute('class')
        assert value() == source, 'effects never touch the text'
        print('PASS stages: normal -> observe -> imitate -> assimilate follow the reading position', seen)

        # --- ghost / echo only reuse the record's own words ----------------------------------------------------------------
        for _ in range(30):
            page.evaluate("const t = document.getElementById('jay-report-textarea'); t.scrollTop -= 7; t.dispatchEvent(new Event('scroll')); t.scrollTop += 9; t.dispatchEvent(new Event('scroll'));")
        ghost = page.evaluate("document.querySelector('.jv-ghost').textContent")
        assert ghost == '' or ghost in source, ghost
        page.evaluate("(() => { const t = document.getElementById('jay-report-textarea'); const i = t.value.indexOf('우리 병동'); t.setSelectionRange(i, i + 12); t.dispatchEvent(new Event('select')); })()")
        echo = page.evaluate("document.querySelector('.jv-echo').textContent")
        assert echo and echo in source, echo
        texts = page.evaluate("[...document.querySelectorAll('.jv-layer *')].map(e => e.textContent).filter(Boolean)")
        assert all(t in source or t == '특별재난관리본부' for t in texts), texts
        print('PASS ghost/echo: only text copied from the record (plus the HQ watermark)')

        # --- re-open replays the same presentation; closing keeps the Story transition --------------------------------------
        page.evaluate("document.getElementById('jayReportWindow').style.display = 'none'")
        page.evaluate("openJayReport()")
        page.wait_for_timeout(80)
        assert stage() == 1 and page.evaluate("document.getElementById('jay-report-textarea').scrollTop") == 0, 'reopening replays from the top'
        assert not page.evaluate("loopShutdownTriggered")
        page.evaluate("closeJayReport()")
        assert page.evaluate("loopShutdownTriggered") and flags().get('finaleSeen'), 'closing still runs triggerLoopShutdown()'
        print('PASS close: the existing blue screen / LOOP trigger and finaleSeen are unchanged')

        # --- reaching the end still waits and shuts down (fresh page) -------------------------------------------------------
        p2 = browser.new_context(viewport={'width': 1280, 'height': 900}).new_page()
        p2.goto(BASE + '/?devunlock=0', wait_until='load')
        p2.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); unlockJayReport(); openJayReport();")
        p2.evaluate("const t = document.getElementById('jay-report-textarea'); t.scrollTop = t.scrollHeight; t.dispatchEvent(new Event('scroll'));")
        p2.wait_for_timeout(5000)
        assert p2.evaluate("loopShutdownTriggered"), 'scrolling to the end still triggers the shutdown after the pause'
        code = p2.evaluate("GameSave.exportCode()"); assert p2.evaluate("(c) => GameSave.importCode(c)", code)
        p2.context.close()
        print('PASS end: scrolling to the end -> existing 4.5 s wait -> shutdown; Save Code round-trip unaffected')

        assert not errors, errors
        browser.close()
        print('ALL JAY VIEWER CHECKS PASSED')


if __name__ == '__main__':
    run()
