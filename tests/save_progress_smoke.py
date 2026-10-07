"""Save transport adversarial/legacy browser checks; no user data or real AUTHOR secret."""
import os
from playwright.sync_api import sync_playwright

BASE = os.environ.get('FIELD_TEST_URL', 'http://127.0.0.1:3000')


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
                                    headless=True, args=['--no-sandbox'])
        context = browser.new_context(); page = context.new_page(); errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto(BASE + '/?devunlock=0', wait_until='load')
        page.evaluate('''() => {
            window.unpack = code => {
                const b = Uint8Array.from(atob(code.replace(/\\s/g,'').replace(/-/g,'+').replace(/_/g,'/')), c => c.charCodeAt(0));
                if (b[0] !== 5) throw Error('not v5');
                return JSON.parse(new TextDecoder().decode(b.slice(1,-1)));
            };
            window.pack = payload => {
                const b = [5, ...new TextEncoder().encode(JSON.stringify(payload))];
                b.push(b.reduce((a,n)=>(a+n)&255,0));
                return btoa(String.fromCharCode(...b)).replace(/=+$/,'');
            };
            GameSave.markClear(1); GameSave.markDeath(1); GameSave.addClue(CLUES[0].id);
            GameSave.addDeduction(DEDUCTIONS[0].id); GameSave.addAchievement(ACHIEVEMENTS[0].id);
            GameSave.addSecret(SECRETS[0]); GameSave.setFlag('jayUnlocked', true);
            GameSave.setFlag('finaleSeen', true); GameSave.ensureWorkerNo();
            FieldSave.clear('EP01', {patrols:{0:true,7:true},elapsed:720,injuries:['치아 6개']});
            FieldSave.death('EP01');
            AuthorRoute.importProgress({v:1,unlocked:true,authorAccessLevel:1,authorTraces:['creator-note','ep01-observation']});
        }''')
        # Copy regenerates the code even when Field changed after opening the record tab.
        page.evaluate("document.getElementById('darkweb-terminal').style.display='none'; document.getElementById('darkweb-overlay').style.display='block'; confirmDarkWebWarning(); closeDarkWebReadme(); openNotebook('record');")
        page.evaluate("window.copyText=(value,done)=>{window.copiedSave=value;done();}; FieldSave.death('EP01');")
        page.get_by_role('button', name='복사', exact=True).click()
        assert page.evaluate('copiedSave === GameSave.exportCode()')
        page.evaluate('closeNotebook()')
        snapshot = page.evaluate('({story:GameSave.exportStoryCode(),field:FieldSave.get(),author:AuthorRoute.get()})')
        code = page.evaluate('GameSave.exportCode()')
        payload = page.evaluate('unpack(GameSave.exportCode())')
        assert set(payload) == {'v', 'story', 'field', 'author', 'classified'}   # classified is an additive layer
        assert payload['v'] == 5 and payload['story'] == snapshot['story']
        assert payload['field'] == snapshot['field'] and payload['author'] == snapshot['author']
        assert set(payload['author']) == {'v','unlocked','authorAccessLevel','authorTraces'}
        assert 'f7dda4fd1a2aaaae283a1382d8e0f5f39abe70d410d9cf1a438e58c0aaa220ae' not in str(payload)
        assert not any(term in str(payload) for term in ['AUTHOR_SAVE_HASH','hashOverride','secret','inventory','controls','stage','minute'])
        # Resume only persistent layers; full Story bit/flag/worker semantics still round-trip.
        fresh = browser.new_context(); target = fresh.new_page(); target.goto(BASE + '/?devunlock=0', wait_until='load')
        assert target.evaluate('(code)=>GameSave.importCode(code)', code)
        assert target.evaluate('GameSave.exportStoryCode()') == snapshot['story']
        assert target.evaluate('FieldSave.get()') == snapshot['field']
        assert target.evaluate('AuthorRoute.get()') == snapshot['author']
        target.reload(wait_until='load')
        assert target.evaluate('GameSave.exportCode()') == code
        assert target.evaluate("GameSave.flag('jayUnlocked') && GameSave.flag('finaleSeen') && GameSave.workerNo() > 0")
        fresh.close()
        # Real legacy v2/v3/v4 fixtures must preserve both existing namespaces.
        for version in [2,3,4]:
            assert page.evaluate('''version => {
                const b=[version,1,1,0,0]; if(version>=3)b.push(0);
                b.push(2,1,1,0); if(version>=4)b.push(0,0);
                b.push(b.reduce((a,n)=>(a+n)&255,0));
                return GameSave.importCode(btoa(String.fromCharCode(...b)).replace(/=+$/,''));
            }''', version)
            assert page.evaluate('GameSave.ep(1).clears === 2 && GameSave.hasClue(CLUES[0].id)')
            assert page.evaluate('FieldSave.get()') == snapshot['field']
            assert page.evaluate('AuthorRoute.get()') == snapshot['author']
        # v1 JSON import remains available as well.
        assert page.evaluate("GameSave.importCode(btoa(unescape(encodeURIComponent(JSON.stringify(GameSave.get())))))")
        assert page.evaluate('FieldSave.get()') == snapshot['field']
        assert page.evaluate('AuthorRoute.get()') == snapshot['author']
        # Missing v5 layers also preserve progress. Invalid roots are ignored independently.
        for bad in [None, [], 'bad', 7, {'v':99}, {'v':1,'unlocked':'true'}]:
            assert page.evaluate('''bad => {
                const payload={v:5,story:GameSave.exportStoryCode(),field:bad,author:bad};
                // A field object with valid v=1 is intentionally sanitizable; test author-only case separately.
                if (bad?.v === 1) delete payload.field;
                return GameSave.importCode(pack(payload));
            }''', bad)
            assert page.evaluate('FieldSave.get()') == snapshot['field']
            assert page.evaluate('AuthorRoute.get()') == snapshot['author']
        for layer in ['field','author',None]:
            assert page.evaluate('''layer => {
                const payload=unpack(GameSave.exportCode());
                if(layer) delete payload[layer]; else {delete payload.field;delete payload.author;}
                return GameSave.importCode(pack(payload));
            }''', layer)
            assert page.evaluate('FieldSave.get()') == snapshot['field']
            assert page.evaluate('AuthorRoute.get()') == snapshot['author']
        # Valid-schema bad entries are sanitized, not copied into local storage.
        assert page.evaluate('''() => GameSave.importCode(pack({v:5,story:GameSave.exportStoryCode(),
            field:{v:1,cleared:['EP01','EP01','EP11',{},null],unlocked:['bad'],
                deaths:{EP01:3,EP02:-1,EP03:'9',EP04:1.5,EP05:4},
                records:{EP01:{patrols:{0:true,1:'true',99:true},elapsed:-1,at:'bad',injuries:['치아 6개',42],
                    stage:'live',inventory:{secret:1}},EP02:{elapsed:123}},controls:{eyes:true}},
            author:{v:1,unlocked:true,authorAccessLevel:999,authorTraces:['creator-note','creator-note','bad',null],
                AUTHOR_SAVE_HASH:'do-not-copy',input:'do-not-copy'}}))''')
        assert page.evaluate('FieldSave.get()') == {'v':1,'cleared':['EP01'],'unlocked':['EP01','EP02'],
            'deaths':{'EP01':3,'EP05':4},'records':{'EP01':{'patrols':{'0':True},'injuries':['치아 6개']}}}
        assert page.evaluate('AuthorRoute.get()') == {'v':1,'unlocked':True,'authorAccessLevel':1,'authorTraces':['creator-note']}
        # Explicit empty new layers restore their defaults rather than silently retaining old progress.
        assert page.evaluate('''() => GameSave.importCode(pack({v:5,story:GameSave.exportStoryCode(),
            field:{v:1,cleared:[],unlocked:['EP01'],deaths:{},records:{}},
            author:{v:1,unlocked:false,authorAccessLevel:1,authorTraces:['creator-note']}}))''')
        assert page.evaluate('FieldSave.get().cleared.length === 0 && !FieldSave.unlocked("EP02") && !AuthorRoute.get().unlocked')
        # Export during a live shift still carries only persistent records; valid import ends it.
        page.evaluate("FieldCore.dispatch('EP01'); FieldCore.step(12); FieldCore.action('select','money');")
        assert page.evaluate('FieldCore.get().status === "active"')
        assert page.evaluate('unpack(GameSave.exportCode()).field') == page.evaluate('FieldSave.get()')
        assert page.evaluate('GameSave.importCode(GameSave.exportCode())')
        assert page.evaluate('FieldCore.get()') is None
        before = page.evaluate('GameSave.exportCode()')
        # Corrupt envelope, unsupported version and invalid Story fail before ANY state writes.
        for bad in ['invalid', '', None, code[:-1], 'A'*150001]:
            assert not page.evaluate('(bad)=>GameSave.importCode(bad)', bad)
            assert page.evaluate('GameSave.exportCode()') == before
        for bad_story in ['bad', None, {}, '']:
            assert not page.evaluate('''story => GameSave.importCode(pack({v:5,story,
                field:{v:1,cleared:['EP09']},author:{v:1,unlocked:true}}))''', bad_story)
            assert page.evaluate('GameSave.exportCode()') == before
        assert not errors, errors
        context.close(); browser.close()
    print('PASS v5 Story/Field/AUTHOR Unicode round-trip + reload, v2/v3/v4 layer preservation, malformed/missing/empty layers, corrupt-envelope no-write, secret/hash exclusion')


if __name__ == '__main__':
    run()
