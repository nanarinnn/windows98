// EP09 view: a generic smartphone is the whole play space. Left = the phone (status bar, current app, incoming-call /
// video overlays, back/home bar). Right = surroundings (light, sounds, which way the phone points) and the field log.
// The rule document is the 안전 안내 문자 thread itself (same text as the Story window / 9화.txt). Nothing on screen names
// a situation, a flag or a failure code. All ids use the f9- prefix; the Story PDA (#mobile-phone-view, phone-*) is
// never read or written.
window.FieldEP09UI = (() => {
    const data = FieldEP09Data;
    const T = data.tuning;
    const $ = id => document.getElementById(id);
    const esc = v => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    let sig = '', lastSound = '', audio = null, ghostSeen = false;

    function mount(root) {
        sig = ''; lastSound = ''; ghostSeen = false;
        try { const A = window.AudioContext || window.webkitAudioContext; if (A) { audio = audio || new A(); audio.resume().catch(() => {}); } } catch (error) { audio = null; }
        root.innerHTML = `<div class="field-hud"><strong id="f9-clock"></strong><span id="f9-battery-hud"></span><span id="f9-rescue"></span></div>
            <div class="field-grid f9-grid"><section class="f9-wrap">
              <div class="f9-phone" id="f9-phone">
                <div class="f9-status"><span id="f9-time"></span><span id="f9-icons"></span><span id="f9-battery"></span></div>
                <div class="f9-screen" id="f9-screen"></div>
                <div class="f9-overlay" id="f9-overlay" hidden></div>
                <div class="f9-nav"><button type="button" id="f9-back" data-act="back">◀</button><button type="button" id="f9-home" data-act="home">●</button><button type="button" id="f9-quick-light" data-act="light">🔦</button></div>
              </div></section>
            <aside>
              <h3>주변</h3><p id="f9-env" class="f9-env"></p>
              <p class="field-help">휴대전화를 향하는 방향</p><div class="f9-face" id="f9-face"></div>
              <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre>
              <p class="field-help">안전 안내 문자는 문자 앱에서 다시 볼 수 있습니다. 응시는 누르고 유지합니다. 연결 종료 시 현재 기록은 중단됩니다.</p>
            </aside></div><div id="field-outcome"></div>`;
        for (const [dir, label] of Object.entries(data.dirs)) {
            const b = document.createElement('button'); b.type = 'button'; b.id = 'f9-face-' + dir; b.dataset.act = 'face'; b.dataset.val = dir; b.textContent = label;
            $('f9-face').append(b);
        }
        const phone = $('f9-phone'), wrap = root.querySelector('.f9-grid');   // fresh per mount: #field-content itself is reused, so never listen on it
        wrap.addEventListener('click', event => {
            const el = event.target.closest('[data-act]');
            if (!el || el.disabled || !wrap.contains(el)) return;
            const act = el.dataset.act;
            let val = el.dataset.val;
            if (el.dataset.json) val = JSON.parse(el.dataset.json);
            if (act === 'keypad') { const input = $('f9-dial'); input.value = (input.value + val).slice(0, 20); return FieldCore.action('dialInput', input.value); }
            if (act === 'dialClear') { $('f9-dial').value = ''; return FieldCore.action('dialInput', ''); }
            if (act === 'call' && val === undefined) val = $('f9-dial').value;
            if (act === 'reply') { const input = $('f9-reply'); val = { thread: val, text: input.value }; input.value = ''; }
            if (act === 'ghost') { ghostSeen = true; sig = ''; return render(FieldCore.get()); }
            FieldCore.action(act, val);
        });
        wrap.addEventListener('input', event => { if (event.target.id === 'f9-dial') FieldCore.action('dialInput', event.target.value); });
        wrap.addEventListener('keydown', event => { if (event.target.id === 'f9-reply' && event.key === 'Enter') { event.preventDefault(); $('f9-reply-send')?.click(); } });
        // Stare = press and hold (pointer or Space/Enter). No camera or eye tracking.
        let down = false;
        const hold = on => { if (down === on) return; down = on; FieldCore.action('stare', on); };
        phone.addEventListener('pointerdown', event => { const el = event.target.closest('[data-hold]'); if (!el || event.button !== 0) return; try { el.setPointerCapture(event.pointerId); } catch (error) { /* synthetic */ } hold(true); });
        for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) phone.addEventListener(type, event => { if (event.target.closest?.('[data-hold]')) hold(false); });
        phone.addEventListener('keydown', event => { if (event.target.closest('[data-hold]') && [' ', 'Enter'].includes(event.key)) { event.preventDefault(); hold(true); } });
        phone.addEventListener('keyup', event => { if (event.target.closest('[data-hold]') && [' ', 'Enter'].includes(event.key)) { event.preventDefault(); hold(false); } });
        phone.addEventListener('focusout', event => { if (event.target.closest?.('[data-hold]')) hold(false); });
    }

    const b = (label, act, val, id, extra = '') => `<button type="button" id="${id}" data-act="${act}"${val !== undefined && val !== null ? ` data-val="${esc(val)}"` : ''} ${extra}>${label}</button>`;
    const bj = (label, act, obj, id, extra = '') => `<button type="button" id="${id}" data-act="${act}" data-json='${esc(JSON.stringify(obj))}' ${extra}>${label}</button>`;
    const unread = d => Object.values(d.threads).reduce((n, t) => n + t.unread, 0);
    // Presentation-only drift as the night goes on: contact names and timestamps slip. Answers never depend on it.
    const name = (d, n) => d.stageNo >= 10 && n === d.jThread ? n.split('').join('​') + ' ' : n;
    const stamp = (d, at) => d.stageNo >= 8 && at && at.endsWith('7') ? '--:--' : at;

    function home(d) {
        const ghost = d.stageNo >= 6 && !ghostSeen ? `<button type="button" class="f9-banner" id="f9-ghost" data-act="ghost">새 알림 1개</button>` : '';
        const ghostDone = ghostSeen && d.stageNo >= 6 ? '<p class="f9-dim">알림이 없습니다.</p>' : '';
        const apps = d.apps.map(a => {
            const badge = a.id === 'messages' && unread(d) ? `<i class="f9-badge">${unread(d)}</i>` : '';
            return `<button type="button" class="f9-app" id="f9-app-${a.id}" data-act="open" data-val="${a.id}"><span class="f9-icon">${a.icon}</span>${esc(a.name)}${badge}</button>`;
        }).join('');
        return `${ghost}${ghostDone}<div class="f9-apps">${apps}</div>`;
    }

    function phoneApp(d) {
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', '#'].map(k => b(k, 'keypad', k, 'f9-key-' + (k === '-' ? 'dash' : k === '#' ? 'hash' : k))).join('');
        const contacts = data.contacts.map((c, i) => `<li>${esc(name(d, c.name))} <span class="f9-dim">${c.number}</span> ${b('통화', 'call', c.number, 'f9-call-contact-' + i)}</li>`).join('');
        const recents = d.calls.slice(0, 8).map((c, i) => `<li>${c.dir === 'missed' ? '부재중' : '발신'} ${esc(c.number)} <span class="f9-dim">${stamp(d, c.at)}</span> ${b('다시 걸기', 'call', c.number, 'f9-recall-' + i)}</li>`).join('');
        return `<h4>전화</h4><input id="f9-dial" inputmode="tel" autocomplete="off" aria-label="전화번호" value="${esc(d.dial)}">
            <div class="f9-keypad">${keys}</div><div class="f9-row">${b('통화', 'call', undefined, 'f9-call')}${b('지우기', 'dialClear', undefined, 'f9-dial-clear')}</div>
            <h5>최근 기록</h5><ul class="f9-list">${recents || '<li class="f9-dim">기록 없음</li>'}</ul><h5>연락처</h5><ul class="f9-list">${contacts}</ul>`;
    }

    function messages(d) {
        const rows = d.threadOrder.map(id => {
            const t = d.threads[id], last = t.msgs.at(-1);
            const preview = last.doc ? '본 안내 문자를 반드시 숙지하여 주십시오.' : last.text.slice(0, 26);
            return `<button type="button" class="f9-thread" id="f9-thread-${id}" data-act="thread" data-val="${id}"><b>${esc(name(d, t.name))}</b>${t.unread ? ` <i class="f9-badge">${t.unread}</i>` : ''}<br><span class="f9-dim">${esc(preview)}</span></button>`;
        }).join('');
        return `<h4>문자</h4>${rows}`;
    }

    function thread(d) {
        const t = d.threads[d.arg]; if (!t) return '';
        const rules = document.querySelector(data.reportSelector);
        const body = t.msgs.map((m, i) => {
            if (m.doc) return `<pre class="f9-doc field-rules" id="f9-rules">${esc(rules ? rules.value.trim() : '안전 안내 문자 연결 불가')}</pre>`;
            let extra = '';
            if (m.pay) extra = b('즉시 납부', 'payOpen', undefined, 'f9-pay-open-' + i);
            if (m.location) extra = b('위치 보내기', 'sendLocation', d.arg, 'f9-send-location');
            if (m.photo) extra = `<div class="f9-photo f9-photo-${m.n}" aria-label="전송된 사진">[사진] ${data.dirs[m.photo]}에서 찍힌 나</div>`;
            return `<div class="f9-msg${m.mine ? ' f9-mine' : ''}">${esc(m.text)}${extra}<span class="f9-dim"> ${stamp(d, m.at)}</span></div>`;
        }).join('');
        return `<h4>${esc(name(d, t.name))}</h4><div class="f9-msgs">${body}</div>
            <div class="f9-row"><input id="f9-reply" autocomplete="off" aria-label="답장 입력" placeholder="${d.arg === 'safety' ? '안내 문자에 입력' : '메시지'}">${b('보내기', 'reply', d.arg, 'f9-reply-send')}</div>`;
    }

    function pay(d) {
        const e = d.ev && d.ev.kind === 'C' ? d.ev : null;
        if (!e) return `<h4>요금 납부</h4><p class="f9-dim">납부할 요금이 없습니다.</p>`;
        return `<h4>요금 납부</h4><p>미납 금액 <b>${e.amount.toLocaleString()}원</b></p><p>납부 기한 <b id="f9-pay-left"></b></p>${b('결제', 'pay', undefined, 'f9-pay')}`;
    }

    function settings(d) {
        if (d.app === 'settings') return `<h4>설정</h4>${b('앱', 'go', 'settingsApps', 'f9-settings-apps')}<p class="f9-dim">네트워크 · 디스플레이 · 배터리</p>`;
        if (d.app === 'settingsApps') return `<h4>앱</h4>` + d.apps.map(a => `<button type="button" class="f9-thread" id="f9-appinfo-${a.id}" data-act="appInfo" data-val="${a.id}">${a.icon} ${esc(a.name)}</button>`).join('');
        const a = d.apps.find(x => x.id === d.arg); if (!a) return '';
        const perms = data.perms.map((p, i) => bj(`${p}: ${a.perms[p] ? '허용됨' : '해제됨'}`, 'perm', { app: a.id, perm: p }, 'f9-perm-' + i, a.strange && !a.perms[p] ? 'disabled' : '')).join('');
        return `<h4>${a.icon} ${esc(a.name)}</h4><p class="f9-dim">권한</p><div class="f9-col">${perms}</div>${b('앱 삭제', 'uninstall', a.id, 'f9-uninstall')}`;
    }

    function viewfinder(d) {
        const e = d.ev;
        if (d.dark) return d.entity && d.light.on && d.facing === d.entity.dir && T.reach[d.light.level] >= d.entity.dist
            ? '빛이 닿은 바닥에 무언가 웅크린 채 멈춰 있다.' : d.light.on ? '손전등 빛 너머는 어둡다.' : '아무것도 보이지 않는다.';
        if (d.cam.lens === 'front') return '화면에 내 얼굴이 보인다.';
        return e && e.kind === 'H' ? '방 안. 이상한 것은 보이지 않는다.' : '방 안.';
    }

    function camera(d) {
        const c = d.cam;
        const modes = b('사진', 'camMode', 'photo', 'f9-mode-photo', `aria-pressed="${c.mode === 'photo'}"`) + b('동영상', 'camMode', 'video', 'f9-mode-video', `aria-pressed="${c.mode === 'video'}"`);
        const lens = b('후면', 'lens', 'rear', 'f9-lens-rear', `aria-pressed="${c.lens === 'rear'}"`) + b('전면(셀카)', 'lens', 'front', 'f9-lens-front', `aria-pressed="${c.lens === 'front'}"`);
        const zoom = [1, 2, 4].map(z => b(z + 'x', 'zoom', z, 'f9-zoom-' + z, `aria-pressed="${c.zoom === z}"`)).join('');
        const go = c.mode === 'photo' ? b('● 촬영', 'shutter', undefined, 'f9-shutter') : b(c.rec ? '■ 녹화 정지' : '● 녹화 시작', 'record', undefined, 'f9-record');
        return `<h4>카메라</h4><div class="f9-view${d.dark ? ' f9-dark' : ''}"><span id="f9-viewfinder">${esc(viewfinder(d))}</span>
            <span class="f9-dim" id="f9-cam-info">${c.lens === 'front' ? '전면' : '후면'} · ${data.dirs[d.facing]} · ${c.zoom}x</span><b id="f9-rec-time"></b></div>
            <div class="f9-row">${modes}</div><div class="f9-row">${lens}</div><div class="f9-row">${zoom}</div><div class="f9-row">${go}</div>`;
    }

    function gallery(d, kind) {
        const list = d.items.filter(i => !kind || i.kind === kind);
        const cells = list.map(i => `<div class="f9-cell${i.iFile ? ' f9-suspect' : ''}">${b(`${i.kind === 'video' ? '🎞️' : '🖼️'} ${i.label}<br><span class="f9-dim">${stamp(d, i.at)}</span>`, 'openItem', i.id, 'f9-item-' + i.id)}${kind ? '' : b('삭제', 'deleteItem', i.id, 'f9-del-' + i.id)}</div>`).join('');
        return `<h4>${kind ? '동영상' : '사진'}</h4><div class="f9-gallery">${cells || '<p class="f9-dim">항목 없음</p>'}</div>`;
    }

    function viewer(d) {
        const i = d.items.find(x => x.id === d.arg); if (!i) return '';
        return `<h4>${i.label}</h4><div class="f9-view">${i.fixed ? '사진 구석에 무언가가 멈춘 채 찍혀 있다.' : '평범한 사진이다.'}</div>${b('삭제', 'deleteItem', i.id, 'f9-del-' + i.id)}`;
    }

    function flashlight(d) {
        const levels = [1, 2, 3].map(l => b('강도 ' + l, 'lightLevel', l, 'f9-level-' + l, `aria-pressed="${d.light.level === l}"`)).join('');
        return `<h4>손전등</h4>${b(d.light.on ? '끄기' : '켜기', 'light', undefined, 'f9-light', `aria-pressed="${d.light.on}"`)}<div class="f9-row">${levels}</div>
            <p class="f9-dim">강도가 높을수록 빛이 멀리 닿고 배터리가 빨리 닳는다.</p>`;
    }

    function screen(d) {
        switch (d.app) {
            case 'home': return home(d);
            case 'phone': return phoneApp(d);
            case 'messages': return messages(d);
            case 'thread': return thread(d);
            case 'pay': return pay(d);
            case 'settings': case 'settingsApps': case 'appInfo': return settings(d);
            case 'camera': return camera(d);
            case 'photos': return gallery(d, '');
            case 'video': return gallery(d, 'video');
            case 'viewer': return viewer(d);
            case 'flashlight': return flashlight(d);
            case 'memo': return '<h4>메모</h4><p class="f9-dim">메모 없음</p>';
            case 'clock': return `<h4>시계</h4><p id="f9-big-clock" class="f9-big"></p>`;
        }
        return '';
    }

    function overlay(d) {
        const e = d.ev;
        if (d.overlay === 'videoCall') return `<p class="f9-caller">영상 통화</p><div class="f9-vc"><video id="f9-vc-video" src="${data.video.b}" autoplay loop muted playsinline></video></div>
            <button type="button" class="f9-stare" id="f9-stare" data-hold="1">남자의 눈을 응시한다 · 누르고 유지</button>
            <div class="f9-row f9-callbtns">${b('수신', 'answer', undefined, 'f9-answer')}${b('거절', 'reject', undefined, 'f9-reject')}</div>`;
        if (d.overlay === 'screamCall') return `<p class="f9-caller">알 수 없음</p><p class="f9-big" id="f9-scream"></p>
            <div class="f9-row f9-callbtns">${b('수신', 'answer', undefined, 'f9-answer')}${b('수신 거절', 'reject', undefined, 'f9-reject')}</div>`;
        if (d.overlay === 'call' && e && e.kind === 'A') return `<p class="f9-caller">${esc(e.number)}</p><p id="f9-call-state">${e.phase === 'answered' ? '통화 중' : '발신 중…'}</p>
            <div class="f9-row f9-callbtns">${b('"여보세요?"', 'speak', undefined, 'f9-speak')}${b('통화 종료', 'hangup', undefined, 'f9-hangup')}</div>`;
        if (d.overlay === 'call' && e && e.kind === 'K') {
            if (e.phase === 'ringing') return `<p class="f9-caller">${data.hqNumber}</p><p>전화가 온다.</p><div class="f9-row f9-callbtns">${b('수신', 'answer', undefined, 'f9-answer')}${b('거절', 'reject', undefined, 'f9-reject')}</div>`;
            return `<p class="f9-caller">${data.hqNumber}</p><p>"요원입니다. 지금 계신 위치를 말씀해 주십시오."</p>
                <div class="f9-col">${b('현재 위치를 말한다', 'tellLocation', undefined, 'f9-tell-location')}${b('위치 공유를 누른다', 'shareLocation', undefined, 'f9-share-location')}${b('아무 말 없이 통화를 끊는다', 'hangup', undefined, 'f9-hangup')}</div>`;
        }
        if (d.overlay === 'autoVideo' && e && e.kind === 'J') return `<p class="f9-caller">동영상 재생 중</p><div class="f9-vc f9-jvid"><span id="f9-j-line"></span></div>
            <div class="f9-col">${b('전화하기', 'jCall', undefined, 'f9-j-call')}${b('답장하기', 'jReply', undefined, 'f9-j-reply')}${b('말하는 곳으로 간다', 'jMove', undefined, 'f9-j-move')}${b('위치 보내기', 'jLocation', undefined, 'f9-j-location')}${b('영상을 닫는다', 'jClose', undefined, 'f9-j-close')}</div>`;
        return '';
    }

    function env(d) {
        const e = d.ev, parts = [];
        parts.push(d.dark ? '불이 꺼진 방. 조명이 하나도 없다.' : '방 안. 휴대전화 화면만 밝다.');
        if (d.light.on) parts.push(`손전등 ON (강도 ${d.light.level}) — ${data.dirs[d.facing]}을 비추는 중.`);
        if (d.entity) {
            const near = d.entity.dist >= 5 ? '멀리서' : d.entity.dist >= 3 ? '가까이에서' : '바로 근처에서';
            parts.push(`${data.dirs[d.entity.dir]} ${near} 무언가 기어오는 소리.`);
        }
        if (e && e.kind === 'I') parts.push('찰칵. 찰칵. 셔터 소리가 계속 들린다.');
        if (e && e.kind === 'D') parts.push(e.phase === 'scream' ? '휴대전화에서 비명이 울린다.' : '……');
        return parts.join('\n');
    }

    function sound(d) {
        const e = d.ev; if (!audio || audio.state !== 'running' || !e) return;
        const key = e.kind === 'D' ? `D${e.n}${e.phase}` : e.kind === 'I' ? `I${Math.floor(e.shutterT * 10) > 15 ? d.items.length : ''}` : '';
        if (!key || key === lastSound) return; lastSound = key;
        if (e.kind === 'D' && e.phase !== 'scream') return;
        try {
            const len = e.kind === 'D' ? T.screamLen : 0.06, buf = audio.createBuffer(1, Math.floor(audio.sampleRate * len), audio.sampleRate), ch = buf.getChannelData(0);
            for (let i = 0; i < ch.length; i++) ch[i] = (Math.random() * 2 - 1) * (e.kind === 'D' ? 0.12 * Math.sin(i / 9) : 0.3) * (1 - i / ch.length);
            const src = audio.createBufferSource(); src.buffer = buf; src.connect(audio.destination); src.start();
        } catch (error) { /* sound is optional; text always carries the signal */ }
    }

    function volatile(s) {
        const d = s.data, e = d.ev;
        const glitch = d.battery < 30 && Math.floor(s.elapsed * 2) % 9 === 0;
        $('f9-time').textContent = d.stageNo >= 8 && Math.floor(s.elapsed) % 13 === 0 ? '--:--' : d.clock;
        $('f9-battery').textContent = glitch ? '▒▒%' : `${Math.ceil(d.battery)}%`;
        $('f9-battery').classList.toggle('f9-low', d.battery < 15);
        $('f9-icons').textContent = `${d.light.on ? '🔦 ' : ''}${d.cam.rec ? '● REC ' : ''}▂▄▆`;
        $('f9-clock').textContent = `${d.clock}`;
        $('f9-battery-hud').textContent = `배터리 ${glitch ? '??' : Math.ceil(d.battery)}%`;
        $('f9-rescue').textContent = d.rescue === 'inProgress' ? '[구조 작업 진행 중] [위치 확인 완료]' : d.rescue === 'arrived' ? '구출 완료' : '관리 대상자';
        $('f9-env').textContent = env(d);
        const left = $('f9-pay-left');
        if (left && e && e.kind === 'C') { const v = Math.max(0, Math.ceil(e.t * 180 / T.billLimit)); left.textContent = `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`; }
        const rec = $('f9-rec-time'); if (rec) rec.textContent = d.cam.rec ? ` ● ${FieldCore.mission('EP09').fmtRec(d.cam.rec.t)}` : '';
        const big = $('f9-big-clock'); if (big) big.textContent = d.clock;
        const scream = $('f9-scream'); if (scream && e && e.kind === 'D') scream.textContent = e.phase === 'scream' ? (e.n === 5 ? '아아아아악—!! (익숙한 목소리)' : '아아아악—!!') : '……';
        const jl = $('f9-j-line'); if (jl && e && e.kind === 'J') jl.textContent = data.jRequests[e.req].text(e.who);
        for (const dir of Object.keys(data.dirs)) $('f9-face-' + dir)?.setAttribute('aria-pressed', String(d.facing === dir));
        $('f9-quick-light').setAttribute('aria-pressed', String(d.light.on));
    }

    function render(s) {
        if (!s || !$('f9-screen')) return;
        const d = s.data, e = d.ev;
        const evSig = e ? [e.kind, e.phase, e.n, e.req, e.open, e.paid, e.kind === 'G' ? e.wasLit : 0] : null;
        const next = JSON.stringify([d.app, d.arg, d.overlay, evSig, d.threadOrder, Object.values(d.threads).map(t => [t.msgs.length, t.unread]),
            d.items.map(i => i.id), d.apps.map(a => [a.id, Object.values(a.perms)]), d.light, d.facing, d.dark, d.entity && d.entity.dist,
            [d.cam.mode, d.cam.lens, d.cam.zoom, !!d.cam.rec], d.calls.length, d.rescue, d.stageNo, s.status, ghostSeen]);
        if (next !== sig) {
            sig = next;
            const keepReply = $('f9-reply')?.value || '';
            $('f9-screen').innerHTML = screen(d);
            if ($('f9-reply') && keepReply) $('f9-reply').value = keepReply;
            const ov = overlay(d), box = $('f9-overlay');
            if (box.dataset.sig !== JSON.stringify([d.overlay, evSig])) { box.dataset.sig = JSON.stringify([d.overlay, evSig]); box.innerHTML = ov; }
            box.hidden = !ov;
            $('f9-screen').classList.toggle('f9-dark', d.dark);
            $('f9-phone').classList.toggle('f9-glitch', d.stageNo >= 9 || d.battery < 15);
            if (s.status !== 'active') { const v = $('f9-vc-video'); if (v) v.pause(); }
        }
        volatile(s);
        sound(d);
    }

    return { mount, render };
})();
