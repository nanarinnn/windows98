// Darkweb 수신 문자(알 수 없는 번호). 본부 메신저 안 [수신 문자] 탭 + 화면 알림.
// - 문안은 이 파일에서 새로 쓴 분위기용 텍스트다. 발신자 정체·새 canon을 만들지 않는다.
// - 플레이 기록(GameSave/FieldSave)은 읽기만 한다. 받은 문자 목록만 별도 키에 저장하며 진행 조건에 쓰지 않는다.
// - 각 문자는 한 번만 온다. 접속 시 소급 수신은 1통까지(나머지는 다음 접속).
window.DarkwebTexts = (() => {
    const KEY = 'yuyeon98.texts.v1';
    const DAY = 86400000;
    let state = load(), queue = [], busy = false, toastTimer = null, tab = 'hq';

    function blank() { return { v: 1, received: [], lastVisit: 0 }; }
    function load() {
        try {
            const s = JSON.parse(localStorage.getItem(KEY));
            if (s && s.v === 1 && Array.isArray(s.received)) return s;
        } catch (e) { /* 저장소 없음 → 빈 상태 */ }
        return blank();
    }
    function persist() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 저장 실패는 이번 세션에만 유지 */ } }

    const $ = id => document.getElementById(id);
    const has = id => state.received.some(t => t.id === id);
    const title = n => (typeof EPISODE_TITLES !== 'undefined' && EPISODE_TITLES[n]) || `EP.${n}`;
    const epNum = id => parseInt(String(id).replace(/\D/g, ''), 10);
    const pad = n => String(n).padStart(2, '0');
    const stamp = at => { const d = new Date(at); return `${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
    const visible = () => $('darkweb-overlay')?.style.display === 'block' && $('darkweb-desktop')?.style.display === 'block';

    // ---------- 문안 ----------
    // sender: 머리말의 시스템 이름(없으면 머리말 생략). link: 마지막 줄을 눌렀을 때 여는 창.
    const TEXTS = {
        map: () => ({
            sender: '전국 사건 지도', subject: '위치 정보 이용 안내',
            body: ['지도를 열어 주셔서 감사합니다.', '현재 귀하의 위치는 지도에 표시되지 않습니다.', '표시되지 않는 게 맞는지, 한 번만 더 확인해 주세요.', '지도 바깥에 계신 분들은 대개 오래 머물지 않으셨거든요.'],
            foot: '※ 본 안내는 회신하지 않으셔도 됩니다. 이미 확인했습니다.'
        }),
        'field-death': ({ ep }) => ({
            sender: '현장 관측 시스템', subject: '근무 만족도 조사',
            body: [`${title(ep)} 근무는 어떠셨나요? (1~5점)`, '마지막으로 본 화면이 기억나시나요? (예 / 아니요)', "'아니요'를 고르신 분이 가장 많습니다.", '기억은 저희가 대신 보관하고 있으니 걱정하지 마세요.'],
            foot: '응답해 주신 분께는 다음 근무가 먼저 배정됩니다.'
        }),
        'field-clear': ({ ep }) => ({
            sender: '현장 관측 시스템', subject: '귀가 확인 요청',
            body: [`${title(ep)} 근무를 무사히 마치신 걸 확인했습니다.`, '문을 나서신 것까지는 기록에 있습니다.', '지금 계신 방은 불이 켜져 있나요?', '켜져 있다면, 그 스위치는 직접 누르셨나요?'],
            foot: "확인되지 않은 귀가는 '근무 중'으로 처리됩니다."
        }),
        dormant: ({ days }) => ({
            sender: '본부 접속 관리', subject: '휴면 전환 예정 안내',
            body: [`${days}일 동안 접속 기록이 없어 연락드립니다.`, '그동안 연결을 끊고 계셨던 거죠?', '이상하네요. 이쪽에서는 계속 보였거든요.'],
            foot: '휴면 전환을 원하지 않으시면 아무것도 하지 않으셔도 됩니다.\n이미 연장해 두었습니다.'
        }),
        misfire: ({ worker }) => ({
            body: [`${worker ? `${worker}번 ` : ''}근무자님, 다음 배치지가 변경되었습니다.`, '변경된 위치는 지도에 미리 표시해 두었']
        }),
        'misfire-fix': () => ({
            body: ['방금 보낸 문자는 잘못 발송되었습니다.', '삭제해 주세요.', '아직 받으실 차례가 아닙니다.']
        }),
        files: ({ k }) => ({
            sender: '사건 파일', subject: '열람 기록 안내',
            body: [`사건 파일 ${k}건을 끝까지 읽어 주셨습니다.`, '처음보다 읽는 속도가 빨라지셨더군요.', '익숙해지신 건지, 무뎌지신 건지 궁금했습니다.', '어느 쪽이든 기록에는 같은 칸에 적힙니다.'],
            foot: '남은 파일은 [사건 파일]에서 이어서 열람하실 수 있습니다.', link: 'files'
        })
    };
    const LINKS = {
        files: () => { if (typeof openDarkWebFolder === 'function') openDarkWebFolder(); }
    };

    // ---------- 조건 ----------
    function storyClearedCount() {
        if (typeof GameSave === 'undefined') return 0;
        let k = 0;
        for (let n = 1; n <= 10; n++) if ((GameSave.ep(n).clears || 0) > 0) k++;
        return k;
    }
    function fieldSave() { try { return window.FieldSave?.get() || {}; } catch (e) { return {}; } }

    // 접속 시 소급으로 확인할 후보(우선순위 순). 조건을 만족하는 첫 1통만 보낸다.
    function backlog() {
        const fs = fieldSave();
        const out = [];
        const deadEp = Object.keys(fs.deaths || {}).find(id => fs.deaths[id] > 0);
        if (deadEp && !has('field-death')) out.push(['field-death', { ep: epNum(deadEp) }]);
        if ((fs.cleared || []).length && !has('field-clear')) out.push(['field-clear', { ep: epNum(fs.cleared[0]) }]);
        const k = storyClearedCount();
        if (k >= 5 && !has('files')) out.push(['files', { k }]);
        if (state.received.length >= 3 && !has('misfire')) out.push(['misfire', {}]);
        return out;
    }

    function onEnter() {
        const now = Date.now();
        const last = state.lastVisit;
        state.lastVisit = now; persist();
        if (last && now - last >= 2 * DAY && !has('dormant')) { send('dormant', { days: Math.floor((now - last) / DAY) }, 2500); return; }
        const first = backlog()[0];
        if (first) send(first[0], first[1], 2500);
    }

    // ---------- 수신 ----------
    function send(id, vars = {}, delay = 1800) {
        if (has(id) || !TEXTS[id]) return;
        if (id === 'misfire') vars.worker = (typeof GameSave !== 'undefined' && GameSave.workerNo()) || 0;
        const t = TEXTS[id](vars);
        state.received.push({ id, at: 0, read: false, ...t });   // at은 실제 도착 시각에 기록
        persist();
        queue.push({ id, delay });
        if (id === 'misfire') queue.push({ id: 'misfire-fix', delay: 3800, make: () => TEXTS['misfire-fix']() });
        pump();
    }
    function pump() {
        if (busy || !queue.length) return;
        busy = true;
        const job = queue.shift();
        setTimeout(() => {
            if (job.make && !has(job.id)) { state.received.push({ id: job.id, at: 0, read: false, ...job.make() }); }
            const t = state.received.find(x => x.id === job.id);
            if (t) { t.at = Date.now(); persist(); arrive(t); }
            busy = false; pump();
        }, job.delay);
    }
    function arrive(t) {
        renderList(); updateBadges();
        if (!visible()) return;
        if (isOpen()) { markRead(); return; }
        toast(t);
        window.SFX?.play?.('message');
    }

    // ---------- UI ----------
    function preview(t) { return t.sender ? `[${t.sender}] ${t.subject}` : t.body[0]; }
    function toast(t) {
        const el = $('dwt-toast');
        if (!el) return;
        $('dwt-toast-text').textContent = preview(t);
        el.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => el.classList.remove('show'), 6500);
    }
    const isOpen = () => $('messengerWindow')?.style.display === 'flex' && tab === 'texts';
    const unread = () => state.received.filter(t => t.at && !t.read).length;
    function markRead() {
        let changed = false;
        for (const t of state.received) if (t.at && !t.read) { t.read = true; changed = true; }
        if (changed) { persist(); updateBadges(); }
    }
    function updateBadges() {
        const n = unread();
        const tabBtn = $('messenger-tab-texts');
        if (tabBtn) tabBtn.textContent = n ? `수신 문자 ●${n}` : '수신 문자';
        const icon = $('darkweb-messenger-icon');
        if (icon) icon.classList.toggle('dwt-unread', n > 0);
    }
    function renderList() {
        const box = $('messenger-texts');
        if (!box) return;
        box.replaceChildren();
        const list = state.received.filter(t => t.at);
        if (!list.length) {
            const empty = document.createElement('p'); empty.className = 'dwt-empty'; empty.textContent = '수신된 문자가 없습니다.';
            box.append(empty); return;
        }
        for (const t of list) {
            const card = document.createElement('div'); card.className = 'dwt-msg'; card.dataset.id = t.id;
            const head = document.createElement('div'); head.className = 'dwt-head';
            head.textContent = '[Web발신]' + (t.sender ? `\n[${t.sender}] ${t.subject}` : '');
            const body = document.createElement('div'); body.className = 'dwt-body'; body.textContent = t.body.join('\n');
            card.append(head, body);
            if (t.foot) {
                const foot = document.createElement(t.link ? 'button' : 'div');
                foot.className = 'dwt-foot'; foot.textContent = t.foot;
                if (t.link) { foot.type = 'button'; foot.onclick = () => LINKS[t.link]?.(); }
                card.append(foot);
            }
            const time = document.createElement('div'); time.className = 'dwt-time'; time.textContent = stamp(t.at);
            card.append(time);
            box.append(card);
        }
        box.scrollTop = box.scrollHeight;
    }
    function setTab(next, focus = true) {
        tab = next;
        const texts = next === 'texts';
        $('messenger-tab-hq')?.classList.toggle('active', !texts);
        $('messenger-tab-texts')?.classList.toggle('active', texts);
        $('messenger-chat').style.display = texts ? 'none' : 'flex';
        $('messenger-inputrow').style.display = texts ? 'none' : 'flex';
        $('messenger-texts').style.display = texts ? 'block' : 'none';
        $('messenger-noreply').style.display = texts ? 'block' : 'none';
        if (texts) { renderList(); markRead(); }
        else if (focus) $('messenger-input')?.focus();
    }
    function openTexts() {
        $('dwt-toast')?.classList.remove('show');
        if (typeof openMessenger === 'function') openMessenger();
        setTab('texts');
    }

    window.addEventListener('load', () => {
        if (!$('messengerWindow')) return;
        $('messenger-tab-hq').onclick = () => setTab('hq');
        $('messenger-tab-texts').onclick = () => setTab('texts');
        $('dwt-toast').onclick = openTexts;
        $('dwt-toast').onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTexts(); } };
        renderList(); updateBadges();
        // 도착 전에 새로고침된 문자는 다시 대기열에 넣는다.
        for (const t of state.received) if (!t.at) queue.push({ id: t.id, delay: 3000 });
        if (has('misfire') && !has('misfire-fix')) queue.push({ id: 'misfire-fix', delay: 3800, make: () => TEXTS['misfire-fix']() });
        // 메신저를 새로 열면 기본은 상황실 탭(기존 동작 유지). 문자 알림으로 열 때만 수신 문자 탭.
        new MutationObserver(() => { if ($('messengerWindow').style.display === 'none' && tab !== 'hq') setTab('hq', false); })
            .observe($('messengerWindow'), { attributes: true, attributeFilter: ['style'] });
        let wasVisible = visible();
        const watch = new MutationObserver(() => {
            const now = visible();
            if (now && !wasVisible) onEnter();
            if (!now) $('dwt-toast')?.classList.remove('show');
            wasVisible = now;
        });
        for (const node of [$('darkweb-overlay'), $('darkweb-desktop')]) watch.observe(node, { attributes: true, attributeFilter: ['style'] });
        if (wasVisible) onEnter();
        window.FieldCore?.onChange?.(s => {
            if (!s) return;
            if (s.status === 'dead') send('field-death', { ep: epNum(s.id) }, 2500);
            if (s.status === 'cleared') send('field-clear', { ep: epNum(s.id) }, 3500);
        });
        if (typeof GameSave !== 'undefined') GameSave.onChange?.(() => { const k = storyClearedCount(); if (k >= 5) send('files', { k }, 3000); });
    });

    return {
        trigger: name => { if (name === 'map') send('map', {}, 2200); },
        openTexts,
        get: () => JSON.parse(JSON.stringify(state)),
        reset() { state = blank(); queue = []; persist(); renderList(); updateBadges(); }
    };
})();
