"""Darkweb 수신 문자(darkweb-texts.js) 스모크 테스트.
- 메신저 기본 탭은 상황실(기존 동작 유지), 수신 문자 탭은 입력창 대신 '회신할 수 없는 번호입니다.'
- 지도 첫 열람 → 알림 → 클릭 시 수신 문자 탭, 읽음 처리, 같은 문자는 다시 오지 않음
- Field 사망 문자에 실제 사건명, 접속 소급은 1통까지, 오발송 2통, 휴면 안내
- 저장 데이터(GameSave/FieldSave) 불변, 기록 초기화 시 문자도 삭제
"""
import os
from playwright.sync_api import sync_playwright

BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')
ENTER = "document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme();"


def ids(page):
    return [t['id'] for t in page.evaluate('DarkwebTexts.get().received') if t['at']]


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                    headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1366, 'height': 768}); errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/?devunlock=0', wait_until='load')
        page.evaluate('localStorage.clear()'); page.reload(wait_until='load')
        page.evaluate(ENTER)

        # 메신저 기본 동작 유지
        page.evaluate('openMessenger()')
        assert page.locator('#messenger-input').is_visible() and page.locator('#messenger-chat').is_visible()
        assert not page.locator('#messenger-noreply').is_visible()
        page.locator('#messenger-tab-texts').click()
        assert page.locator('#messenger-noreply').is_visible() and not page.locator('#messenger-input').is_visible()
        assert '수신된 문자가 없습니다' in page.inner_text('#messenger-texts')
        page.evaluate('closeMessenger()')
        page.evaluate('openMessenger()')
        assert page.locator('#messenger-input').is_visible(), '다시 열면 상황실 탭'
        page.evaluate('closeMessenger()')

        before = page.evaluate("[localStorage.getItem('yuyeon98.save.v1'), JSON.stringify(FieldSave.get())]")

        # 지도 첫 열람 → 알림
        page.evaluate('DarkwebMap.open()')
        page.wait_for_selector('#dwt-toast.show', timeout=6000)
        assert '위치 정보 이용 안내' in page.inner_text('#dwt-toast')
        assert page.locator('#darkweb-messenger-icon.dwt-unread').count() == 1
        page.locator('#dwt-toast').click()
        assert page.locator('#messenger-texts').is_visible()
        assert '[Web발신]' in page.inner_text('#messenger-texts') and '이미 확인했습니다' in page.inner_text('#messenger-texts')
        assert page.locator('#darkweb-messenger-icon.dwt-unread').count() == 0
        assert page.inner_text('#messenger-tab-texts') == '수신 문자'
        page.evaluate('closeMessenger(); DarkwebMap.close(); DarkwebMap.open()')
        page.wait_for_timeout(3000)
        assert ids(page) == ['map'], '같은 문자는 한 번만'
        page.evaluate('DarkwebMap.close()')

        # Field 사망(실제 사건명)
        page.evaluate("FieldSave.death('EP03')")
        page.evaluate("disconnectDarkWeb()")
        page.evaluate(ENTER)  # 재접속 → 소급 1통
        page.wait_for_timeout(3500)
        got = ids(page)
        assert got == ['map', 'field-death'], got
        page.evaluate('DarkwebTexts.openTexts()')
        assert '베리 해피 종합병원 근무는 어떠셨나요?' in page.inner_text('#messenger-texts')
        page.evaluate('closeMessenger()')

        # 생환 → 다음 접속 1통, 그 다음 접속에 오발송 2통(수신 3통 이상)
        page.evaluate("FieldSave.clear('EP01', {})")
        page.evaluate("disconnectDarkWeb()"); page.evaluate(ENTER); page.wait_for_timeout(3500)
        assert ids(page)[-1] == 'field-clear'
        page.evaluate("disconnectDarkWeb()"); page.evaluate(ENTER); page.wait_for_timeout(8000)
        assert ids(page)[-2:] == ['misfire', 'misfire-fix'], ids(page)
        texts = page.evaluate('DarkwebTexts.get().received')
        assert texts[-2]['body'][-1].endswith('표시해 두었'), '오발송 문자는 중간에 끊긴다'

        # 휴면: 마지막 접속을 3일 전으로
        page.evaluate("disconnectDarkWeb(); (() => { const s = JSON.parse(localStorage.getItem('yuyeon98.texts.v1')); s.lastVisit = Date.now() - 3 * 86400000 - 1000; localStorage.setItem('yuyeon98.texts.v1', JSON.stringify(s)); })()")
        page.reload(wait_until='load'); page.evaluate(ENTER); page.wait_for_timeout(3500)
        t = page.evaluate('DarkwebTexts.get().received')[-1]
        assert t['id'] == 'dormant' and t['body'][0].startswith('3일 동안'), t

        # 문자 기능은 Story 저장을 바꾸지 않는다(FieldSave는 위에서 테스트가 직접 바꿨으므로 Story만 비교)
        after = page.evaluate("localStorage.getItem('yuyeon98.save.v1')")
        assert before[0] == after, 'Story 저장 데이터가 바뀜'

        # 기록 초기화
        page.evaluate('GameSave.reset()')
        assert page.evaluate('DarkwebTexts.get().received.length') == 0
        assert not errors, errors
        browser.close()
    print('darkweb texts smoke: ok')


if __name__ == '__main__':
    run()
