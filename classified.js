// PUBLIC CLASSIFIED: optional hidden discoveries open to every player (there is no permission state and no access code).
// A CLASSIFIED entry is discovered only by meeting its discovery condition in the game world. Entries are independent of each
// other (no order, no prerequisite) and never affect Story, Field unlocks, J, the blue screen, LOOP 02, finaleSeen or endings.
// Progress lives in its own browser key and its own additive Save Code v5 layer; AUTHOR state is never mixed into it.
// Total is 3: 01 (EP06 × EP01, same-element `crossRef`), 02 (EP08 × EP03) and 03 (EP03 × EP09) (phrase-pair `pairRef`).
// Undiscovered entries are never shown to the player (no locked rows, no ???, no 0/3 before the first discovery).
// Quotes are copied verbatim from docs/transcripts/reviewed; the `result` lines are investigation results, not canon quotes.
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
    },
    {
        // EP08 × EP03. Entry: the EP08 guide re-opened after a real EP08 clear (clear screen or the HQ record) -> select a sentence
        // that calls the customer a patient -> 관련 문구 조회 -> open the EP03 record (real EP03 clear) -> PAIR CROSS-REFERENCE.
        id: 'classified-02', number: '02', title: '수술 일정 기록 대조',
        requires: ['EP03', 'EP08'],
        document: [
            '[분류 보류 기록 02]',
            '',
            '출처 1: EP08 유성 워터파크 이용 안내문',
            '“치료 프로세스에 협조하지 않는 환자들에게 인내심을 가지는 친절한 병원이 아님을 명심하여 주십시오.”',
            '“탕 안에서 수분을 섭취한 고객은 수술 대상으로 분류됩니다.”',
            '“날짜를 특정하여 답하신 고객께서는 해당 날짜에 반드시 수술을 받게 됨을 확인하였습니다.”',
            '',
            '출처 2: EP03 베리 해피 종합병원',
            '“베리 해피 종합병원에 편입되는 환자는 수술이 예정된 국내 모든 입원 환자 중 무작위로 편입된다.”',
            '“귀하의 첫 수술은 편입 다음 날부터 7일 차 사이에 임의의 날짜로 이미 지정되어 있습니다.”',
            '',
            '----------------------------------------',
            '',
            '대응 1: 수술 대상으로 분류됩니다 ↔ 수술이 예정된 국내 모든 입원 환자',
            '대응 2: 해당 날짜에 반드시 수술을 받게 됨 ↔ 임의의 날짜로 이미 지정되어 있습니다',
            '',
            '----------------------------------------',
            '',
            '이용 안내문 안에서 고객이 환자로 지칭됩니다.',
            '두 기록 모두 수술 대상과 날짜를 다루고 있습니다.',
            '두 시설의 관계는 확인되지 않았습니다.'
        ].join('\n'),
        announce: ['이용 안내문이 고객을', '환자라고 부르고 있습니다.'],
        pairRef: {
            left: { title: 'EP08 · 유성 워터파크 이용 안내문', lines: [
                { text: '치료 프로세스에 협조하지 않는 환자들에게 인내심을 가지는 친절한 병원이 아님을 명심하여 주십시오.', phrases: [{ id: 'l0', t: '환자들에게' }, { id: 'l9', t: '친절한 병원이 아님' }] },
                { text: '탕 안에서 수분을 섭취한 고객은 수술 대상으로 분류됩니다.', phrases: [{ id: 'l1', t: '수술 대상으로 분류됩니다' }] },
                { text: '날짜를 특정하여 답하신 고객께서는 해당 날짜에 반드시 수술을 받게 됨을 확인하였습니다.', phrases: [{ id: 'l2', t: '해당 날짜에 반드시 수술을 받게 됨' }] }
            ] },
            right: { title: 'EP03 · 베리 해피 종합병원', lines: [
                { text: '베리 해피 종합병원에 편입되는 환자는 수술이 예정된 국내 모든 입원 환자 중 무작위로 편입된다.', phrases: [{ id: 'r1', t: '수술이 예정된 국내 모든 입원 환자' }] },
                { text: '귀하의 첫 수술은 편입 다음 날부터 7일 차 사이에 임의의 날짜로 이미 지정되어 있습니다.', phrases: [{ id: 'r2', t: '임의의 날짜로 이미 지정되어 있습니다' }] },
                { text: '본 병원에서 귀하의 목표는 탈출이 아닌 생존입니다.', phrases: [{ id: 'r9', t: '탈출이 아닌 생존' }] }
            ] },
            pairs: [{ a: 'l1', b: 'r1', label: '대응' }, { a: 'l2', b: 'r2', label: '대응' }],
            result: ['이용 안내문 안에서 고객이 환자로 지칭됩니다.', '두 기록 모두 수술 대상과 날짜를 다루고 있습니다.', '두 시설의 관계는 확인되지 않았습니다.']
        }
    },
    {
        // EP03 × EP09. Entry: the classified terminal's ordinary search (구조 요원 / 개인 정보 / 위치 ...) lists Field return records
        // (real EP03 / EP09 clears only); opening both records side by side offers 문장 대조 -> PAIR CROSS-REFERENCE.
        id: 'classified-03', number: '03', title: '구조 요원 확인 절차 대조',
        requires: ['EP03', 'EP09'],
        document: [
            '[분류 보류 기록 03]',
            '',
            '출처 1: EP03 베리 해피 종합병원',
            '“정부에서 투입되는 구조 요원들은 귀하의 모든 개인 정보를 알고 있습니다. 본부 요원임을 강조하거나 당신의 정보와 안내문을 요구하지 않습니다.”',
            '',
            '출처 2: EP09 안전 안내 문자',
            '“본부의 전화번호 0050-0200으로 요원이라 하며 귀하의 위치를 물어오는 경우.”',
            '“본부는 대상자가 된 이들의 현재 위치를 즉시 파악 가능한 시스템을 구축하여 항시 대비하고 있습니다.”',
            '',
            '----------------------------------------',
            '',
            '공통: 모든 개인 정보를 알고 있습니다 ↔ 현재 위치를 즉시 파악 가능한',
            '대비: 본부 요원임을 강조하거나 당신의 정보와 안내문을 요구하지 않습니다 ↔ 요원이라 하며 귀하의 위치를 물어오는 경우',
            '',
            '----------------------------------------',
            '',
            '두 기록은 구조 요원이 대상자의 정보를 이미 알고 있다고 안내합니다.',
            '요원이라는 주장만으로는 상대를 확인할 수 없습니다.',
            '두 사건에서 정보를 요구한 인원들의 관계는 확인되지 않았습니다.'
        ].join('\n'),
        announce: ['요원이라는 주장만으로는', '상대를 확인할 수 없습니다.'],
        pairRef: {
            left: { title: 'EP03 · 베리 해피 종합병원', lines: [
                { text: '정부에서 투입되는 구조 요원들은 귀하의 모든 개인 정보를 알고 있습니다.', phrases: [{ id: 'l1', t: '모든 개인 정보를 알고 있습니다' }] },
                { text: '본부 요원임을 강조하거나 당신의 정보와 안내문을 요구하지 않습니다.', phrases: [{ id: 'l2', t: '본부 요원임을 강조하거나 당신의 정보와 안내문을 요구하지 않습니다' }] },
                { text: '면회는 각 병동 1층 면회실에서 진행됩니다.', phrases: [{ id: 'l9', t: '1층 면회실' }] }
            ] },
            right: { title: 'EP09 · 안전 안내 문자', lines: [
                { text: '본부의 전화번호 0050-0200으로 요원이라 하며 귀하의 위치를 물어오는 경우.', phrases: [{ id: 'r9', t: '0050-0200' }, { id: 'r1', t: '요원이라 하며 귀하의 위치를 물어오는 경우' }] },
                { text: '본부는 대상자가 된 이들의 현재 위치를 즉시 파악 가능한 시스템을 구축하여 항시 대비하고 있습니다.', phrases: [{ id: 'r2', t: '현재 위치를 즉시 파악 가능한' }] }
            ] },
            // A = the same guidance in both records; B = the normal procedure vs. the warning condition (never shown as "same")
            pairs: [{ a: 'l1', b: 'r2', label: '공통' }, { a: 'l2', b: 'r1', label: '대비 · 정상 절차 / 경고 조건' }],
            result: ['두 기록은 구조 요원이 대상자의 정보를 이미 알고 있다고 안내합니다.', '요원이라는 주장만으로는 상대를 확인할 수 없습니다.', '두 사건에서 정보를 요구한 인원들의 관계는 확인되지 않았습니다.']
        }
    }
];

window.Classified = (() => {
    const KEY = 'yuyeon98.classified.v1';
    const ids = () => window.CLASSIFIED_ENTRIES.map(entry => entry.id);   // read live: a later entry only has to be appended
    const listeners = new Set();
    // + completeAt once every slot is found (11/10 hook); + eleven = { doneAt, acts } once 11 / 10 was watched to the end
    const blank = () => ({ v: 1, discovered: [], viewed: [] });
    const ACTS = ['read', 'pick', 'compare'];   // 문서 열람 / 출처 선택 / 기록 대조: the only things the residual file remembers
    let state = blank(), storageError = false;
    function sanitize(saved) {
        if (!saved || typeof saved !== 'object' || Array.isArray(saved) || saved.v !== 1) return null;
        const list = value => (Array.isArray(value) ? [...new Set(value.filter(id => ids().includes(id)))] : []);
        const discovered = list(saved.discovered);
        const clean = { v: 1, discovered, viewed: list(saved.viewed).filter(id => discovered.includes(id)) };
        if (Number.isSafeInteger(saved.completeAt) && saved.completeAt > 0 && discovered.length >= window.CLASSIFIED_TOTAL) clean.completeAt = saved.completeAt;
        const e = saved.eleven;
        if (clean.completeAt && e && typeof e === 'object' && !Array.isArray(e) && Number.isSafeInteger(e.doneAt) && e.doneAt > 0) {
            const acts = {};
            for (const k of ACTS) if (Number.isSafeInteger(e.acts?.[k]) && e.acts[k] > 0) acts[k] = e.acts[k];
            clean.eleven = { doneAt: e.doneAt, acts };
        }
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
        // Returns true only for a new discovery (re-inspection never grants twice). Whichever record is found third, its toast is
        // skipped: the count simply becomes 3 / 3 (no SECRET COMPLETE, no 11/10 notice).
        discover(id, opts = {}) {
            if (!ids().includes(id) || state.discovered.includes(id)) return false;
            state.discovered.push(id);
            const last = state.discovered.length >= window.CLASSIFIED_TOTAL;
            if (last && !state.completeAt) state.completeAt = Date.now();
            persist();
            if (opts.announce !== false && !last) announce(id);
            return true;
        },
        // Discovery eligibility = real Field return records (FieldSave.cleared). The dev-server episode unlock never counts.
        eligible(id) {
            const e = entry(id); if (!e) return false;
            const cleared = window.FieldSave ? FieldSave.get().cleared : [];
            return (e.requires || []).every(ep => cleared.includes(ep));
        },
        // 11 / 10 completion: saved only when the sequence was watched to the end; replays overwrite the same three times.
        eleven: () => (state.eleven ? JSON.parse(JSON.stringify(state.eleven)) : null),
        completeEleven(acts) {
            if (!state.completeAt) return false;
            const clean = {};
            for (const k of ACTS) if (Number.isSafeInteger(acts?.[k]) && acts[k] > 0) clean[k] = acts[k];
            state.eleven = { doneAt: Date.now(), acts: clean }; persist(); return true;
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
        // PAIR CROSS-REFERENCE for an entry with `pairRef`: two records side by side, specific phrases are buttons. Select a phrase on
        // one side, then one on the other side: a defined pair is linked (numbered marker + label, not only colour); anything else shows
        // "대조 근거 부족" and the selection resets (no death, no penalty, retry freely). When every pair is linked the investigation
        // result appears (visually separate from the quotes) and onDone() runs once. Click/tap only; no hover, no drag.
        pairReference(id, host, onDone, opts = {}) {
            const e = entry(id); if (!e || !e.pairRef || !host) return null;
            const x = e.pairRef, linked = new Map();   // pair index -> true
            let pick = null, done = false;
            const box = document.createElement('div'); box.className = 'pref' + (opts.stack ? ' pref-stack' : ''); box.id = 'pref-' + id;
            const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
            const col = (side, rec) => {
                const lines = rec.lines.map(line => {
                    let html = esc(line.text);
                    line.phrases.forEach(ph => { html = html.replace(esc(ph.t), `<button type="button" class="pref-tok" data-live data-side="${side}" data-p="${ph.id}" id="pref-${id}-${ph.id}" aria-pressed="false">${esc(ph.t)}</button>`); });
                    return `<p class="pref-quote">“${html}”</p>`;
                }).join('');
                return `<div class="pref-col"><b>${esc(rec.title)}</b>${lines}</div>`;
            };
            box.innerHTML = `<div class="pref-head">CROSS-REFERENCE</div><p class="pref-help">한쪽 기록의 구절을 고른 뒤, 다른 쪽 기록에서 대응하는 구절을 고르십시오.</p>`
                + `<div class="pref-cols">${col('a', x.left)}${col('b', x.right)}</div><div class="pref-foot" id="pref-foot-${id}" role="status"></div>`;
            const foot = box.querySelector('.pref-foot');
            const tok = p => box.querySelector(`.pref-tok[data-p="${p}"]`);
            const clearPick = () => { if (pick) tok(pick.p)?.setAttribute('aria-pressed', 'false'); pick = null; };
            box.querySelectorAll('.pref-tok').forEach(btn => btn.addEventListener('click', () => {
                if (done) return;
                const side = btn.dataset.side, p = btn.dataset.p;
                if (btn.classList.contains('pref-on')) { foot.textContent = '이미 연결한 구절입니다.'; return; }
                if (!pick || pick.side === side) { clearPick(); pick = { side, p }; btn.setAttribute('aria-pressed', 'true'); foot.textContent = `선택: ${btn.textContent}`; return; }
                const a = side === 'a' ? p : pick.p, b = side === 'b' ? p : pick.p;
                const i = x.pairs.findIndex(pr => pr.a === a && pr.b === b);
                clearPick();
                if (i < 0) { foot.textContent = '대조 근거 부족'; return; }
                linked.set(i, true);
                for (const q of [a, b]) { const el = tok(q); el.classList.add('pref-on'); el.insertAdjacentHTML('beforeend', `<sup class="pref-mark">[${i + 1}]</sup>`); }
                foot.textContent = `연결 ${i + 1} · ${x.pairs[i].label}`;
                if (linked.size === x.pairs.length) {
                    done = true;
                    const end = document.createElement('div'); end.className = 'pref-result';
                    const head = document.createElement('div'); head.className = 'pref-result-head'; head.textContent = '[조사 결과]';
                    end.append(head, ...x.result.map(t => { const p = document.createElement('div'); p.textContent = t; return p; }));
                    box.append(end);
                    if (onDone) onDone();
                }
            }));
            host.append(box);
            return box;
        },
        storageError: () => storageError,
        onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); }
    };
})();

// 11 / 10 hook. When all three records are found, the row "11 / 10" appears in the Field Observation list the next time the
// list is opened after that moment (the player has gone back to HQ). No notice, no popup, no Story/J/LOOP/AUTHOR/10-10 gate;
// it never counts toward 10 / 10 and never touches FieldSave. The sequence itself lives in field/field-1110.js (presentation
// only, no new canon).
window.ElevenTen = {
    ready: () => window.CLASSIFIED_ENTRIES.length >= window.CLASSIFIED_TOTAL && window.Classified.count() >= window.CLASSIFIED_TOTAL,
    // openedAt = when the Field Observation window was opened this time
    visible(openedAt) { const at = window.Classified.completeAt(); return this.ready() && at > 0 && openedAt > at; },
    route: 'OBSERVATION-11',
    open(host, opts) { if (!this.ready() || !host) return false; if (window.ElevenTenView) return window.ElevenTenView.start(host, opts); host.textContent = 'OBSERVATION DATA LOADING'; return true; }
};
