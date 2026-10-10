// Re-opened field documents (PUBLIC CLASSIFIED 02 path). After a real EP08 return (clear screen, or the HQ record row in the
// Field Observation list) the EP08 이용 안내문 can be read again. Every sentence is selectable; 관련 문구 조회 is an ordinary
// lookup. A sentence that calls the customer a patient / the facility a hospital lists the EP03 return record; opening it (real
// EP03 return only) starts the PAIR CROSS-REFERENCE of classified-02. Nothing here changes Field, Story, J or LOOP records.
window.FieldRecords = (() => {
    const GUIDES = { EP08: { n: 8, selector: '#darkwebReportWindowEP8 textarea', label: '이용 안내문' } };
    const RELATED = { EP08: [{ match: /환자|병원/, ep: 'EP03', n: 3, classified: 'classified-02' }] };
    let token = 0;
    const el = (tag, text, attrs = {}) => { const e = document.createElement(tag); if (text != null) e.textContent = text; Object.assign(e, attrs); return e; };
    const cleared = id => (window.FieldSave ? FieldSave.get().cleared.includes(id) : false);
    // Split a document into sentences without changing a single character (the joined pieces equal the source text).
    function sentences(text) {
        const out = [];
        for (const part of text.split(/(\n)/)) {
            if (part === '\n' || !part) { if (part) out.push({ nl: true }); continue; }
            let pieces = part.match(/[^.?!]+[.?!]+["”’)]*\s*|[^.?!]+$/g) || [part];
            if (pieces.join('') !== part) pieces = [part];   // never drop or alter a character
            pieces.forEach(t => out.push({ t }));
        }
        return out;
    }
    function openGuide(id, host) {
        const g = GUIDES[id]; if (!g || !host || !cleared(id)) return false;
        const my = ++token;
        host.replaceChildren();
        host.append(el('h2', `[EP.${String(g.n).padStart(2, '0')}] ${EPISODE_TITLES[g.n]} · ${g.label}`));
        host.append(el('small', '생환 기록에 보관된 문서입니다. 문장을 선택하면 관련 문구를 조회할 수 있습니다.'));
        const source = document.querySelector(g.selector);
        const doc = el('div', null, { className: 'frec-doc', id: 'frec-doc' });
        let selected = null;
        const sel = el('span', '선택한 문장 없음', { className: 'frec-sel', id: 'frec-sel' });
        const lookup = el('button', '관련 문구 조회', { type: 'button', id: 'frec-lookup', disabled: true });
        const back = el('button', '관측 목록', { type: 'button', id: 'frec-back' });
        const hits = el('div', null, { id: 'frec-hits' });
        sentences(source ? source.value : '').forEach((s, i) => {
            if (s.nl) { doc.append('\n'); return; }
            if (!s.t.trim()) { doc.append(s.t); return; }
            const b = el('button', s.t, { type: 'button', className: 'frec-s', id: 'frec-s-' + i });
            b.setAttribute('aria-pressed', 'false');
            b.onclick = () => {
                doc.querySelectorAll('.frec-s[aria-pressed="true"]').forEach(x => x.setAttribute('aria-pressed', 'false'));
                b.setAttribute('aria-pressed', 'true'); selected = s.t.trim();
                sel.textContent = `선택한 문장: “${selected}”`; lookup.disabled = false; hits.replaceChildren();
            };
            doc.append(b);
        });
        lookup.onclick = () => {
            if (!selected || my !== token) return;
            hits.replaceChildren();
            const box = el('div', null, { className: 'frec-hits' });
            box.append(el('p', `> 관련 문구 조회: “${selected}”`));
            const found = (RELATED[id] || []).filter(r => r.match.test(selected));
            if (!found.length) box.append(el('p', '> 관련 기록이 없습니다.'));
            found.forEach(r => {
                if (!cleared(r.ep)) { box.append(el('p', '> 열람 권한이 없는 기록 1건 (생환 기록 없음)')); return; }
                const row = el('p', `> [EP.${String(r.n).padStart(2, '0')} ${EPISODE_TITLES[r.n]}] 현장 생환 기록 `);
                const open = el('button', '기록 열기', { type: 'button', id: 'frec-open-' + r.ep });
                open.onclick = () => openRelated(id, r, box, my);
                row.append(open); box.append(row);
            });
            hits.append(box);
        };
        back.onclick = () => window.FieldUI?.catalog();
        host.append(doc, el('div', null, { className: 'frec-bar' }), hits);
        host.querySelector('.frec-bar').append(sel, lookup, back);
        return true;
    }
    function openRelated(id, r, box, my) {
        if (my !== token || box.querySelector('.pref')) return;
        if (!window.Classified || !Classified.eligible(r.classified)) { box.append(el('p', '> 열람 권한이 없습니다.')); return; }
        const already = Classified.has(r.classified);
        box.append(el('p', already ? '> 이미 대조한 기록입니다.' : '> 기록 대조 중...'));
        const view = Classified.pairReference(r.classified, box, () => {
            if (my !== token) return;   // the document was closed or replaced meanwhile
            if (!already) Classified.discover(r.classified);
        });
        view?.scrollIntoView({ block: 'nearest' });
    }
    return { openGuide, has: id => !!GUIDES[id], stop() { token += 1; } };
})();
