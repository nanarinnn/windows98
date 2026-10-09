// PUBLIC CLASSIFIED: optional hidden discoveries open to every player (there is no permission state and no access code).
// A CLASSIFIED entry is discovered only by meeting its discovery condition in the game world. Entries are independent of each
// other (no order, no prerequisite) and never affect Story, Field unlocks, J, the blue screen, LOOP 02, finaleSeen or endings.
// Progress lives in its own browser key and its own additive Save Code v5 layer; AUTHOR state is never mixed into it.
// Target total is 3. Only classified-01 exists; 02 and 03 are intentionally undefined until their canon is reviewed.
// Adding one later = one more entry here with the same `crossRef` shape (no UI code changes). Undefined slots are never
// shown to the player (no locked rows, no ???, no 0/3 before the first discovery).
window.CLASSIFIED_TOTAL = 3;
window.CLASSIFIED_SLOTS = ['classified-01', 'classified-02', 'classified-03'];
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
        announce: ['연결되지 않아야 할 두 기록이', '같은 위치를 가리키고 있습니다.'],
        // CROSS-REFERENCE: two existing records side by side (sentences copied verbatim from 6화.txt / 1화.txt). The player
        // links the shared elements; the conclusion never states a cause.
        crossRef: {
            left: { title: 'EP06 · 2학년 3반 17번', text: '2019년 청림고등학교 2학년 3반 17번 박예림 학생이 수학여행 부산광역시 기장군 태양해안 중 실종되었다.' },
            right: { title: 'EP01 · 해안관리-2019-031', text: '[ 부산광역시 태양해안 관리 본부 ]\n문서 번호: 해안관리-2019-031\n- 야간 근무자(오후 8시~10시 사이 사무실 문을 연 인원 중 극히 드문 확률로 이동)는 주 6일 근무 완료 시 기장군 내 무작위 지점으로 귀환합니다.' },
            tokens: ['2019년', '청림고등학교', '2학년 3반 17번', '박예림', '수학여행', '부산광역시', '기장군', '태양해안'],
            common: { '2019년': '2019', '부산광역시': '부산광역시', '기장군': '기장군', '태양해안': '태양해안' },
            conclusion: '두 사건의 관계는 확인되지 않았습니다.'
        }
    }
];

window.Classified = (() => {
    const KEY = 'yuyeon98.classified.v1';
    const ids = () => window.CLASSIFIED_ENTRIES.map(entry => entry.id);   // read live: a later entry only has to be appended
    const listeners = new Set();
    const blank = () => ({ v: 1, discovered: [], viewed: [] });   // + completeAt once every defined slot is found (11/10 hook)
    let state = blank(), storageError = false;
    function sanitize(saved) {
        if (!saved || typeof saved !== 'object' || Array.isArray(saved) || saved.v !== 1) return null;
        const list = value => (Array.isArray(value) ? [...new Set(value.filter(id => ids().includes(id)))] : []);
        const discovered = list(saved.discovered);
        const clean = { v: 1, discovered, viewed: list(saved.viewed).filter(id => discovered.includes(id)) };
        if (Number.isSafeInteger(saved.completeAt) && saved.completeAt > 0 && discovered.length >= window.CLASSIFIED_TOTAL) clean.completeAt = saved.completeAt;
        return clean;
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
        toast.textContent = `[CLASSIFIED TRACE RECOVERED]\n\n${e.announce.join('\n')}\n\nCLASSIFIED ${state.discovered.length} / ${window.CLASSIFIED_TOTAL}`;
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
            if (!ids().includes(id) || state.discovered.includes(id)) return false;
            state.discovered.push(id);
            if (state.discovered.length >= window.CLASSIFIED_TOTAL && !state.completeAt) state.completeAt = Date.now();   // quietly; no popup
            persist();
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
        completeAt: () => state.completeAt || 0,
        // CROSS-REFERENCE view for an entry with `crossRef`. Clicking a phrase of the left record lights the same element in the
        // right one; once every shared element is linked the conclusion appears and onDone() runs (the caller discovers).
        crossReference(id, host, onDone) {
            const e = entry(id); if (!e || !e.crossRef || !host) return null;
            const x = e.crossRef, linked = new Set(), need = Object.keys(x.common);
            const box = document.createElement('div'); box.className = 'xref'; box.id = 'xref-' + id;
            const esc = s => String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
            let left = esc(x.left.text);
            x.tokens.forEach((tok, i) => { left = left.replace(esc(tok), `<button type="button" class="xref-tok" data-live data-i="${i}" id="xref-tok-${i}">${esc(tok)}</button>`); });
            let right = esc(x.right.text).replace(/\n/g, '<br>');
            Object.values(x.common).forEach((tok, i) => { right = right.split(esc(tok)).join(`<span class="xref-hit" data-k="${esc(tok)}">${esc(tok)}</span>`); });
            box.innerHTML = `<div class="xref-head">CROSS-REFERENCE</div><div class="xref-cols"><div class="xref-col"><b>${esc(x.left.title)}</b><p>${left}</p></div>`
                + `<div class="xref-col"><b>${esc(x.right.title)}</b><p>${right}</p></div></div><div class="xref-foot" id="xref-foot"></div>`;
            const foot = box.querySelector('#xref-foot');
            box.querySelectorAll('.xref-tok').forEach(btn => btn.addEventListener('click', () => {
                const tok = x.tokens[Number(btn.dataset.i)], match = x.common[tok];
                if (!match) { btn.classList.add('xref-miss'); foot.textContent = `${tok} — 대조 결과 없음`; return; }
                if (linked.has(tok)) return;
                linked.add(tok); btn.classList.add('xref-on');
                box.querySelectorAll(`.xref-hit[data-k="${match}"]`).forEach(s => s.classList.add('xref-on'));
                foot.textContent = `일치: ${[...linked].map(k => x.common[k]).join(' · ')}`;
                if (need.every(k => linked.has(k))) {
                    const end = document.createElement('div'); end.className = 'xref-end'; end.textContent = x.conclusion;
                    box.append(end); onDone && onDone();
                }
            }));
            host.append(box);
            return box;
        },
        storageError: () => storageError,
        onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    };
})();

// 11 / 10 hook. Not reachable today: classified-02/03 are undefined, so CLASSIFIED never reaches 3 / 3. When every slot is
// defined and found, the row "11 / 10" appears in the Field Observation list the next time the list is opened after that
// moment (the player has gone back to HQ). No notice, no popup, no Story/J/LOOP gate; it never counts toward 10 / 10 and
// never touches FieldSave. The content itself is to be designed later (presentation only, no new canon).
window.ElevenTen = {
    ready: () => window.CLASSIFIED_ENTRIES.length >= window.CLASSIFIED_TOTAL && window.Classified.count() >= window.CLASSIFIED_TOTAL,
    // openedAt = when the Field Observation window was opened this time
    visible(openedAt) { const at = window.Classified.completeAt(); return this.ready() && at > 0 && openedAt > at; },
    route: 'OBSERVATION-11',
    open(host) { if (!this.ready() || !host) return false; host.textContent = 'OBSERVATION DATA LOADING'; return true; }
};
