"""Compare Field title/controls with the unchanged notebook in a real browser.
Requires the Express server and the same Playwright/Chromium setup as other smoke tests.
Screenshots are optional and written outside the checkout via UI_SCREENSHOT_DIR.
"""
import os
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                    headless=True, args=['--no-sandbox'])
        context = browser.new_context(viewport={'width':1280, 'height':1000})
        page = context.new_page(); errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE, wait_until='load')
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); openNotebook('record'); FieldUI.open();")
        metrics = page.evaluate('''() => {
            const props = ['fontFamily','fontSize','fontWeight','letterSpacing','lineHeight',
                'paddingTop','paddingBottom','paddingLeft','paddingRight','display','alignItems','justifyContent','gap','boxSizing'];
            const results = [];
            for (const id of ['notebookWindow','fieldWindow']) {
                const header = document.querySelector('#'+id+' .window-header');
                const title = header.querySelector('span');
                const baseline = document.createElement('span');
                baseline.style.cssText = 'display:inline-block;width:0;height:0'; title.append(baseline);
                const hr = header.getBoundingClientRect(); const parts = {};
                for (const [key, el] of [['header',header],['title',title],['close',header.querySelector('.window-buttons').firstElementChild]]) {
                    const s = getComputedStyle(el); const r = el.getBoundingClientRect();
                    parts[key] = { ...Object.fromEntries(props.map(p => [p,s[p]])), height:r.height, offsetY:r.y-hr.y };
                    if (key === 'close') parts[key].rightInset = hr.right-r.right;
                }
                parts.baseline = baseline.getBoundingClientRect().y-hr.y; baseline.remove();
                const range = document.createRange(); const text = title.firstChild;
                const space = text.textContent.indexOf(' '); range.setStart(text,space);range.setEnd(text,space+1);
                parts.iconSpaceWidth = range.getBoundingClientRect().width;
                results.push(parts);
            }
            return results;
        }''')
        for part in ['header','title','close']:
            assert metrics[0][part] == metrics[1][part], (part, metrics)
        assert metrics[0]['baseline'] == metrics[1]['baseline']
        assert metrics[0]['iconSpaceWidth'] == metrics[1]['iconSpaceWidth']
        assert page.locator('#field-close').get_attribute('aria-label') == '연결 종료'
        # Test-only placement shows both title bars without changing repository window dimensions.
        page.evaluate("Object.assign(document.getElementById('notebookWindow').style,{top:'40px',left:'30px'}); Object.assign(document.getElementById('fieldWindow').style,{top:'110px',left:'30px'});")
        screenshot_dir = os.environ.get('UI_SCREENSHOT_DIR')
        if screenshot_dir:
            target = Path(screenshot_dir); target.mkdir(parents=True, exist_ok=True)
            page.screenshot(path=str(target/'darkweb-titlebars.png'))
        page.locator('#field-dispatch-EP01').click()
        assert page.evaluate("getComputedStyle(document.getElementById('field-tab-map')).fontSize === getComputedStyle(document.querySelector('.nb-tab')).fontSize")
        assert page.evaluate("getComputedStyle(document.getElementById('field-tab-map')).fontWeight === getComputedStyle(document.querySelector('.nb-tab')).fontWeight")
        assert page.evaluate("getComputedStyle(document.getElementById('field-item')).fontFamily === getComputedStyle(document.getElementById('notebookWindow')).fontFamily")
        assert page.evaluate("getComputedStyle(document.getElementById('field-status')).fontSize === '11px'")
        assert page.evaluate("getComputedStyle(document.getElementById('field-log')).fontFamily === 'monospace'")
        page.locator('#field-tab-rules').click()
        assert page.evaluate("getComputedStyle(document.querySelector('.field-rules')).fontFamily === 'monospace'")
        page.locator('#field-close').click(); assert page.evaluate('FieldCore.get()') is None
        for tab in ['board','clues','deductions','achievements','record']:
            page.evaluate('(tab) => openNotebook(tab)', tab)
            assert page.locator('#notebook-body').is_visible()
        page.evaluate('closeNotebook()'); assert not page.locator('#notebookWindow').is_visible()
        for width in [390,320]:
            mobile = browser.new_context(viewport={'width':width,'height':844}, is_mobile=True, has_touch=True)
            m = mobile.new_page(); m.on('pageerror', lambda error: errors.append(str(error)))
            m.goto(BASE, wait_until='load')
            m.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); FieldUI.open();")
            assert m.locator('#fieldWindow .window-header').evaluate('e => e.scrollWidth <= e.clientWidth')
            assert m.locator('#field-close').is_visible()
            m.locator('#field-dispatch-EP01').click(); m.locator('#field-tab-rules').click()
            assert m.locator('#field-content').evaluate('e => e.scrollWidth <= e.clientWidth + 1')
            m.locator('#field-close').click(); mobile.close()
        assert not errors, errors
        print(f"PASS notebook/Field identical title metrics: height {metrics[0]['header']['height']}px, baseline {metrics[0]['baseline']}px, title/close typography and alignment; notebook tabs and mobile 390/320px")
        context.close(); browser.close()


if __name__ == '__main__':
    run()
