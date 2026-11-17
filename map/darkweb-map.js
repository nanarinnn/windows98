// 전국 사건 지도 창(Darkweb). 데이터는 map-data.js(DARKWEB_MAP).
// 진행 상태(GameSave / FieldSave)는 읽기만 한다. 저장 데이터와 진행 조건을 바꾸지 않는다.
window.DarkwebMap = (() => {
    const NS = 'http://www.w3.org/2000/svg';
    const LON0 = 125.7, LAT0 = 38.8, K = 70, COS = Math.cos(36 * Math.PI / 180);
    const W = Math.round((131.05 - LON0) * K * COS), H = Math.round((LAT0 - 33.0) * K);
    const STATE_LABEL = { none: '미조사', story: '조사 완료', field: '현장 생환' };
    let win, svg, listEl, detailEl, tickerEl, tooltip, selected = null, tickTimer = null, tickIndex = 0;

    const $ = id => document.getElementById(id);
    const P = ([lon, lat]) => [(lon - LON0) * K * COS, (LAT0 - lat) * K];
    const el = (tag, attrs = {}, parent) => {
        const node = document.createElementNS(NS, tag);
        for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
        if (parent) parent.append(node);
        return node;
    };
    const h = (tag, cls, text) => {
        const node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text != null) node.textContent = text;
        return node;
    };
    const title = n => (typeof EPISODE_TITLES !== 'undefined' && EPISODE_TITLES[n]) || `EP.${n}`;
    const epId = n => `EP${String(n).padStart(2, '0')}`;
    const epLabel = n => `[EP.${String(n).padStart(2, '0')}]`;

    function progress(n) {
        let field = false, story = false;
        try { field = (window.FieldSave?.get().cleared || []).includes(epId(n)); } catch (e) { /* 읽기 실패는 미조사로 표시 */ }
        try { story = typeof GameSave !== 'undefined' && (GameSave.ep(n).clears || 0) > 0; } catch (e) { /* 동일 */ }
        return field ? 'field' : story ? 'story' : 'none';
    }

    function drawMap() {
        svg.replaceChildren();
        const defs = el('defs', {}, svg);
        const grid = el('pattern', { id: 'dwm-grid', width: 20, height: 20, patternUnits: 'userSpaceOnUse' }, defs);
        el('path', { d: 'M20 0H0V20', fill: 'none', stroke: '#1d0000', 'stroke-width': 1 }, grid);
        el('rect', { width: W, height: H, fill: 'url(#dwm-grid)' }, svg);

        // EP.09 — 전국 수신 범위(핀 없음)
        const nation = el('g', { class: 'dwm-nation', 'data-ep': 9 }, svg);
        const land = el('g', { class: 'dwm-land' }, svg);
        el('polygon', { points: DARKWEB_MAP.mainland.map(P).map(p => p.join(',')).join(' ') }, land);
        for (const isl of DARKWEB_MAP.islands) {
            const [x, y] = P(isl.c);
            el('ellipse', { cx: x, cy: y, rx: Math.max(isl.rx * K * COS, 2.5), ry: Math.max(isl.ry * K, 2) }, land);
        }
        // 휴전선은 해안선 다각형의 북쪽 변을 점선으로 덧그린다.
        const north = DARKWEB_MAP.mainland.slice(-5).concat([DARKWEB_MAP.mainland[0]]);
        el('polyline', { class: 'dwm-dmz', points: north.map(P).map(p => p.join(',')).join(' ') }, svg);
        nation.append(...[0, 1, 2].map(i => el('circle', { class: 'dwm-wave', cx: W * 0.42, cy: H * 0.5, r: 30, style: `animation-delay:${i * 1.6}s` })));
        const nationLabel = el('text', { class: 'dwm-nation-label', x: 8, y: 16 }, svg);
        nationLabel.textContent = `${epLabel(9)} 수신 범위: 전국`;
        nationLabel.dataset.ep = 9;

        const estimated = el('g', {}, svg), links = el('g', {}, svg), reports = el('g', {}, svg), pins = el('g', {}, svg);
        const byEp = Object.fromEntries(DARKWEB_MAP.cases.map(c => [c.ep, c]));
        for (const c of DARKWEB_MAP.cases) {
            const state = progress(c.ep);
            if (c.nationwide) { nation.dataset.state = state; continue; }
            const [x, y] = P(c.c);
            if (c.source === 'estimated') {
                const g = el('g', { class: 'dwm-est', 'data-ep': c.ep, 'data-state': state, tabindex: 0 }, estimated);
                el('circle', { cx: x, cy: y, r: c.r * K }, g);
                el('text', { x, y: y + 4 }, g).textContent = '?';
                bind(g, { kind: 'case', ep: c.ep });
            } else {
                const g = el('g', { class: 'dwm-pin', 'data-ep': c.ep, 'data-state': state, tabindex: 0 }, pins);
                if (c.ring) el('circle', { class: 'dwm-ring', cx: x, cy: y, r: c.ring * K }, g);
                el('circle', { class: 'dwm-halo', cx: x, cy: y, r: 9 }, g);
                el('circle', { class: 'dwm-dot', cx: x, cy: y, r: 4.5 }, g);
                const below = c.label === 'below-left';
                const label = el('text', { x: below ? x - 8 : x + 8, y: below ? y + 16 : y - 7, 'text-anchor': below ? 'end' : 'start' }, g);
                label.textContent = epLabel(c.ep);
                bind(g, { kind: 'case', ep: c.ep });
            }
            if (c.link && byEp[c.link.to]) {
                const [x2, y2] = P(byEp[c.link.to].c);
                el('line', { class: 'dwm-link', 'data-ep': c.ep, x1: x, y1: y, x2, y2 }, links);
            }
        }
        for (const r of DARKWEB_MAP.reports) {
            const [x, y] = P(r.c);
            const g = el('g', { class: 'dwm-report' + (r.redacted ? ' redacted' : ''), 'data-id': r.id, tabindex: 0 }, reports);
            el('rect', { x: x - 3, y: y - 3, width: 6, height: 6 }, g);
            bind(g, { kind: 'report', id: r.id });
        }
    }

    function bind(node, target) {
        node.addEventListener('click', () => select(target));
        node.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(target); } });
        node.addEventListener('pointerenter', e => showTip(target, e));
        node.addEventListener('pointermove', e => moveTip(e));
        node.addEventListener('pointerleave', hideTip);
    }

    function tipText(target) {
        if (target.kind === 'report') {
            const r = DARKWEB_MAP.reports.find(x => x.id === target.id);
            return `${r.region} · 접수 ${r.code} · ${r.status}`;
        }
        const c = DARKWEB_MAP.cases.find(x => x.ep === target.ep);
        const where = c.source === 'transcript' ? c.place : c.nationwide ? '전국' : '위치 추정 중';
        return `${epLabel(c.ep)} ${title(c.ep)} · ${where} · ${STATE_LABEL[progress(c.ep)]}`;
    }
    function showTip(target, e) { tooltip.textContent = tipText(target); tooltip.style.display = 'block'; moveTip(e); }
    function moveTip(e) {
        const box = win.querySelector('.dwm-mapbox').getBoundingClientRect();
        const x = e.clientX - box.left, y = e.clientY - box.top;
        tooltip.style.left = Math.max(4, Math.min(x + 12, box.width - tooltip.offsetWidth - 4)) + 'px';
        tooltip.style.top = (y + 14 + tooltip.offsetHeight > box.height ? y - tooltip.offsetHeight - 8 : y + 14) + 'px';
    }
    function hideTip() { tooltip.style.display = 'none'; }

    function renderList() {
        listEl.replaceChildren();
        const group = (name, items) => {
            listEl.append(h('div', 'dwm-group', name));
            for (const it of items) listEl.append(it);
        };
        const row = (target, text, state) => {
            const b = h('button', 'dwm-row', text);
            if (state) b.dataset.state = state;
            b.dataset.key = keyOf(target);
            b.onclick = () => select(target);
            return b;
        };
        const cases = DARKWEB_MAP.cases;
        group('확정 위치', cases.filter(c => c.source === 'transcript').map(c => row({ kind: 'case', ep: c.ep }, `${epLabel(c.ep)} ${title(c.ep)}`, progress(c.ep))));
        group('위치 추정 중', cases.filter(c => c.source === 'estimated').map(c => row({ kind: 'case', ep: c.ep }, `${epLabel(c.ep)} ${title(c.ep)}`, progress(c.ep))));
        group('미확인 신고', DARKWEB_MAP.reports.map(r => row({ kind: 'report', id: r.id }, `${r.code} ${r.region}`)));
    }

    const keyOf = t => t.kind === 'case' ? `ep${t.ep}` : t.id;

    function select(target) {
        selected = target;
        const key = keyOf(target);
        win.querySelectorAll('[data-key]').forEach(n => n.classList.toggle('active', n.dataset.key === key));
        svg.querySelectorAll('.selected').forEach(n => n.classList.remove('selected'));
        const sel = target.kind === 'case' ? `[data-ep="${target.ep}"]` : `[data-id="${target.id}"]`;
        svg.querySelectorAll(sel).forEach(n => n.classList.add('selected'));
        renderDetail();
    }

    function renderDetail() {
        detailEl.replaceChildren();
        if (!selected) { detailEl.append(h('p', 'dwm-hint', '지도 위 표식이나 목록을 선택하십시오.')); return; }
        const line = (k, v, cls) => { const p = h('p', 'dwm-line' + (cls ? ' ' + cls : '')); p.append(h('span', 'dwm-k', k), h('span', 'dwm-v', v)); detailEl.append(p); };
        if (selected.kind === 'report') {
            const r = DARKWEB_MAP.reports.find(x => x.id === selected.id);
            detailEl.append(h('h3', null, `미확인 신고 ${r.code}`));
            line('지역', r.region);
            line('내용', r.redacted ? '████████████' : r.text, r.redacted ? 'redacted' : '');
            line('처리', r.status);
            detailEl.append(h('p', 'dwm-note', '본부 정식 사건으로 분류되지 않은 접수 기록입니다.'));
            return;
        }
        const c = DARKWEB_MAP.cases.find(x => x.ep === selected.ep);
        const state = progress(c.ep);
        detailEl.append(h('h3', null, `${epLabel(c.ep)} ${title(c.ep)}`));
        if (c.source === 'transcript') {
            line('위치', c.place);
            line('근거', `“${c.quote}”`, 'quote');
        } else if (c.nationwide) {
            line('위치', '전국 · 수신 범위');
        } else {
            line('위치', '위치 추정 중');
            detailEl.append(h('p', 'dwm-note', '표시 범위는 관측 오차를 포함한 추정치이며 확정 정보가 아닙니다.'));
            if (c.link) line('연관', `${epLabel(c.link.to)} “${c.link.quote}”`, 'quote');
        }
        line('조사', STATE_LABEL[state], 'state-' + state);
        const actions = h('div', 'dwm-actions');
        const openCase = h('button', null, '사건 파일 열기');
        openCase.onclick = () => { const fn = window[`openDarkWebFolderEP${c.ep}`]; if (typeof fn === 'function') fn(); };
        const openField = h('button', null, '현장 관측 시스템');
        openField.onclick = () => window.FieldUI?.open();
        actions.append(openCase, openField);
        detailEl.append(actions);
    }

    function startTicker() {
        stopTicker();
        const reports = DARKWEB_MAP.reports.filter(r => !r.redacted);
        const tick = () => {
            const r = reports[tickIndex++ % reports.length];
            tickerEl.textContent = `▶ 접수 ${r.code} · ${r.region} · ${r.status}`;
            svg.querySelectorAll('.dwm-report.ping').forEach(n => n.classList.remove('ping'));
            const node = svg.querySelector(`[data-id="${r.id}"]`);
            if (node) { void node.getBBox(); node.classList.add('ping'); }
        };
        tick();
        tickTimer = setInterval(tick, 4200);
    }
    function stopTicker() { if (tickTimer) clearInterval(tickTimer); tickTimer = null; }

    function refresh() {
        drawMap(); renderList();
        const fixed = DARKWEB_MAP.cases.filter(c => c.source === 'transcript').length;
        $('dwm-count').textContent = `확정 ${fixed} · 추정 ${DARKWEB_MAP.cases.length - fixed} · 미확인 신고 ${DARKWEB_MAP.reports.length}`;
        if (selected) select(selected); else renderDetail();
    }

    function open() {
        refresh();
        win.style.display = 'flex';
        highestZIndex++;
        win.style.zIndex = highestZIndex;
        updateDarkWebTaskbar();
        startTicker();
        window.DarkwebTexts?.trigger('map');
    }
    function close() {
        hideTip(); stopTicker();
        win.style.display = 'none';
        updateDarkWebTaskbar();
    }

    window.addEventListener('load', () => {
        win = $('darkwebMapWindow');
        if (!win || !window.DARKWEB_MAP) return;
        svg = $('dwm-svg'); listEl = $('dwm-list'); detailEl = $('dwm-detail'); tickerEl = $('dwm-ticker'); tooltip = $('dwm-tooltip');
        svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
        darkWebWindowsList.push({ id: 'darkwebMapWindow', title: '🗺️ 전국 사건 지도' });
        $('dwm-close').onclick = close;
        const icon = $('darkweb-map-icon');
        icon.onclick = open;
        icon.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
        // 본부 연결 종료/블루스크린 때 함께 닫는다(기존 disconnect 코드는 건드리지 않음).
        const observer = new MutationObserver(() => {
            if (win.style.display !== 'none' && ($('darkweb-overlay').style.display === 'none' || $('bsod-overlay')?.style.display === 'block')) close();
        });
        for (const node of [$('darkweb-overlay'), $('bsod-overlay')]) if (node) observer.observe(node, { attributes: true, attributeFilter: ['style'] });
        if (typeof GameSave !== 'undefined') GameSave.onChange?.(() => { if (win.style.display !== 'none') refresh(); });
        window.FieldCore?.onChange?.(s => { if (s && s.status !== 'active' && win.style.display !== 'none') refresh(); });
    });

    return { open, close, refresh };
})();
