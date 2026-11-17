"""전국 사건 지도(map/) 스모크 테스트.
- transcript 핀의 quote가 reviewed transcript 원문에 실제로 있는지(공백 무시) 확인한다.
- 미확인 신고(report)에 사건 제목·수칙 문구가 섞이지 않았는지 확인한다.
- 지도가 진행 상태를 읽기만 하고 저장 데이터를 바꾸지 않는지, 바로가기와 연결 종료 시 닫힘을 확인한다.
Express 서버와 다른 스모크 테스트와 같은 Playwright/Chromium 설정이 필요하다.
"""
import os
import re
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')
ROOT = Path(__file__).resolve().parent.parent
REVIEWED = ROOT / 'docs' / 'transcripts' / 'reviewed'
squash = lambda s: re.sub(r'\s+', '', s)


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                    headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1366, 'height': 768}); errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/?devunlock=0', wait_until='load')
        data = page.evaluate('DARKWEB_MAP')
        titles = page.evaluate('EPISODE_TITLES')

        # 1) canon 근거
        assert sorted(c['ep'] for c in data['cases']) == list(range(1, 11))
        for c in data['cases']:
            assert c['source'] in ('transcript', 'estimated'), c
            refs = [(c['quote'], c['transcript'])] if c['source'] == 'transcript' else []
            if c.get('link'):
                refs.append((c['link']['quote'], c['link']['transcript']))
            for quote, name in refs:
                text = (REVIEWED / name).read_text(encoding='utf-8', errors='replace')
                assert squash(quote) in squash(text), (c['ep'], quote, name)
            if c['source'] == 'estimated':
                assert 'place' not in c and 'quote' not in c, c
        assert {c['ep'] for c in data['cases'] if c['source'] == 'transcript'} == {1, 2, 4, 5, 8}

        # 2) 미확인 신고는 사건 본문을 담지 않는다
        rule_files = [ROOT / f'{n}화.txt' for n in range(1, 11)]
        rules = squash(''.join(f.read_text(encoding='utf-8', errors='replace') for f in rule_files))
        for r in data['reports']:
            blob = r['region'] + r['text']
            for t in titles.values():
                assert t not in blob, (r['id'], t)
            if r['text']:
                assert squash(r['text']) not in rules, r['id']

        # 3) 창 동작 + 저장 데이터 불변
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();")
        before = page.evaluate("[localStorage.getItem('yuyeon98.save.v1'), JSON.stringify(FieldSave.get())]")
        page.locator('#darkweb-map-icon').click()
        assert page.locator('#darkwebMapWindow').is_visible()
        assert page.locator('.dwm-pin').count() == 5 and page.locator('.dwm-est').count() == 4
        assert page.locator('.dwm-report').count() == len(data['reports'])
        assert '전국 사건 지도' in page.inner_text('#darkweb-taskbar-items')
        page.locator('.dwm-pin[data-ep="1"]').click()
        assert '부산 기장군' in page.inner_text('#dwm-detail')
        assert page.locator('.dwm-pin[data-ep="1"]').get_attribute('data-state') == 'none'
        page.locator('.dwm-est[data-ep="6"]').click()
        assert '위치 추정 중' in page.inner_text('#dwm-detail')
        page.locator('#dwm-detail button', has_text='사건 파일 열기').click()
        assert page.locator('#darkwebFolderWindowEP6').is_visible()
        page.locator('.dwm-row[data-key="r0412"]').click()
        assert '경기 파주시' in page.inner_text('#dwm-detail')
        assert page.locator('#darkwebMapWindow').evaluate('e => e.scrollWidth <= e.clientWidth + 1')
        after = page.evaluate("[localStorage.getItem('yuyeon98.save.v1'), JSON.stringify(FieldSave.get())]")
        assert before == after, '지도가 저장 데이터를 바꿨다'

        # Story 클리어 기록이 있으면 '조사 완료'로 표시(읽기 전용 반영)
        page.evaluate('GameSave.markClear(1); DarkwebMap.refresh()')
        assert page.locator('.dwm-pin[data-ep="1"]').get_attribute('data-state') == 'story'

        page.evaluate('disconnectDarkWeb()')
        page.wait_for_timeout(100)
        assert not page.locator('#darkwebMapWindow').is_visible()
        assert not errors, errors
        browser.close()
    print('darkweb map smoke: ok')


if __name__ == '__main__':
    run()
