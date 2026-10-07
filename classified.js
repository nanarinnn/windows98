// PUBLIC CLASSIFIED: optional hidden discoveries open to every player (there is no permission state and no access code).
// A CLASSIFIED entry is discovered only by meeting its discovery condition in the game world. Entries are independent of each
// other (no order, no prerequisite) and never affect Story, Field unlocks, J, the blue screen, LOOP 02, finaleSeen or endings.
// Progress lives in its own browser key and its own additive Save Code v5 layer; AUTHOR state is never mixed into it.
// Target total is 3. Only classified-01 exists; 02 and 03 are intentionally undefined until their canon is reviewed.
window.CLASSIFIED_TOTAL = 3;
window.CLASSIFIED_ENTRIES = [
    {
        id: 'classified-01', number: '01', title: '태양해안 기록 대조',
        // Shown in the notebook once discovered. It only states that two existing records point at the same place;
        // it never states a cause, an identity or a cover-up.
        document: [
            '[분류 보류 기록 01]',
            '',
            '대상:',
            '청림고등학교 2학년 3반 17번',
            '박예림',
            '',
            '실종 장소:',
            '부산광역시 기장군 태양해안',
            '',
            '실종 연도:',
            '2019',
            '',
            '----------------------------------------',
            '',
            '관련 기록 검색 결과',
            '',
            '해안관리-2019-031',
            '',
            '----------------------------------------',
            '',
            '해당 기록과 학생 실종 사건의',
            '자동 연계가 차단되어 있습니다.',
            '',
            '차단 사유:',
            '[접근 권한 없음]',
            '',
            '두 사건의 관계는 확인되지 않았습니다.'
        ].join('\n'),
        announce: ['연결되지 않아야 할 두 기록이', '같은 위치를 가리키고 있습니다.']
    }
];

window.Classified = (() => {
    const KEY = 'yuyeon98.classified.v1';
    const IDS = window.CLASSIFIED_ENTRIES.map(entry => entry.id);
    const listeners = new Set();
    const blank = () => ({ v: 1, discovered: [], viewed: [] });
    let state = blank(), storageError = false;
    function sanitize(saved) {
        if (!saved || typeof saved !== 'object' || Array.isArray(saved) || saved.v !== 1) return null;
        const list = value => (Array.isArray(value) ? [...new Set(value.filter(id => IDS.includes(id)))] : []);
        const discovered = list(saved.discovered);
        return { v: 1, discovered, viewed: list(saved.viewed).filter(id => discovered.includes(id)) };
    }
    try { state = sanitize(JSON.parse(localStorage.getItem(KEY))) || blank(); } catch (error) { storageError = true; }
    function persist() {
        try { localStorage.setItem(KEY, JSON.stringify(state)); storageError = false; }
        catch (error) { storageError = true; }
        listeners.forEach(fn => { try { fn(); } catch (error) { /* ignore */ } });
    }
    const entry = id => window.CLASSIFIED_ENTRIES.find(e => e.id === id);
    // Same toast style as the notebook toasts, with line breaks; clicking opens the notebook's CLASSIFIED section.
    function announce(id) {
        const e = entry(id); if (!e) return;
        const host = document.getElementById('darkweb-overlay') || document.body;
        const toast = document.createElement('div');
        toast.className = 'nb-toast classified-toast';
        toast.style.cssText = 'position:absolute; right:16px; top:44px; z-index:99999; background:#1a0000; border:2px solid #ff0000; color:#ff3333; font-family:monospace; font-size:11px; padding:10px 14px; max-width:300px; cursor:pointer; white-space:pre-line; box-shadow:0 0 12px #ff0000;';
        toast.textContent = `[CLASSIFIED TRACE RECOVERED]\n\n${e.announce.join('\n')}\n\nCLASSIFIED ${state.discovered.length}/${window.CLASSIFIED_TOTAL}`;
        toast.addEventListener('click', () => { if (window.openNotebook) openNotebook('classified'); toast.remove(); });
        host.appendChild(toast);
        setTimeout(() => toast.remove(), 9000);
    }
    return {
        total: window.CLASSIFIED_TOTAL,
        entries: () => window.CLASSIFIED_ENTRIES,
        entry,
        has: id => state.discovered.includes(id),
        count: () => state.discovered.length,
        viewed: id => state.viewed.includes(id),
        // Returns true only for a new discovery (re-inspection never grants twice).
        discover(id, opts = {}) {
            if (!IDS.includes(id) || state.discovered.includes(id)) return false;
            state.discovered.push(id); persist();
            if (opts.announce !== false) announce(id);
            return true;
        },
        markViewed(id) {
            if (!state.discovered.includes(id) || state.viewed.includes(id)) return;
            state.viewed.push(id); persist();
        },
        get: () => JSON.parse(JSON.stringify(state)),
        exportProgress: () => sanitize(state),
        importProgress(saved) {
            const clean = sanitize(saved);
            if (!clean) return false;
            state = clean; persist(); return true;
        },
        reset() { state = blank(); persist(); },
        storageError: () => storageError,
        onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    };
})();
