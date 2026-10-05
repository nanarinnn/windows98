// Shared headquarters shell; episode-specific controls are described below.
window.FieldUI = (() => {
    let win, content, video, audio, activeMission = 'EP01', lastVideo = '', lastInventory = '', lastEvent = '', logLength = 0;
    const $ = id => document.getElementById(id);
    const mission = () => FieldCore.mission(activeMission);
    const button = (label, action, value, id) => {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label;
        if (id) el.id = id;
        el.addEventListener('click', () => FieldCore.action(action, value)); return el;
    };
    function focus() { win.style.zIndex = ++highestZIndex; updateDarkWebTaskbar(); }
    function open() {
        win.style.display = 'flex'; focus();
        if (!FieldCore.get()) catalog();
    }
    function close() {
        if (!FieldCore.get() && win.style.display === 'none') return;
        FieldCore.disconnect(); if (video) video.pause();
        win.style.display = 'none'; updateDarkWebTaskbar();
    }
    function armAudio() {
        try {
            const Audio = window.AudioContext || window.webkitAudioContext;
            if (Audio) { audio = audio || new Audio(); audio.resume().catch(() => {}); }
        } catch (error) { /* Text signal always remains available. */ }
    }
    function crackle() {
        if (!audio || audio.state !== 'running') return;
        const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * .25), audio.sampleRate);
        const samples = buffer.getChannelData(0);
        for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples.length, 3) * .15;
        const source = audio.createBufferSource(); source.buffer = buffer; source.connect(audio.destination); source.start();
    }
    function catalog() {
        content.replaceChildren();
        const title = document.createElement('h2'); title.textContent = '현장 관측 시스템'; content.append(title);
        const intro = document.createElement('p'); intro.textContent = '야간 연결 대기 / 근무 기록은 본 장치에 보관됩니다.'; content.append(intro);
        const save = FieldSave.get();
        for (let n = 1; n <= 10; n++) {
            const id = `EP${String(n).padStart(2, '0')}`;
            const row = document.createElement('div'); row.className = 'field-case';
            const label = document.createElement('span'); label.textContent = `[EP.${String(n).padStart(2, '0')}] ${EPISODE_TITLES[n]}`;
            row.append(label);
            const btn = document.createElement('button'); btn.id = `field-dispatch-${id}`;
            const available = FieldCore.available(id); const unlocked = FieldSave.unlocked(id);
            btn.textContent = !unlocked ? '연결 제한' : available ? '파견 가능' : '연결 준비 중';
            btn.disabled = !unlocked || !available;
            btn.onclick = () => { armAudio(); shell(id); FieldCore.dispatch(id); };
            row.append(btn); content.append(row);
            const record = document.createElement('small'); record.textContent = `${save.cleared.includes(id) ? '생환 기록 있음' : '생환 기록 없음'} / 연결 소실 ${save.deaths[id] || 0}회`; content.append(record);
        }
        if (FieldSave.devUnlock) { const dev = document.createElement('p'); dev.textContent = '[개발 모드] localhost에서는 모든 에피소드가 개방됩니다. 저장 기록에는 영향이 없습니다.'; content.append(dev); }
        const note = document.createElement('p'); note.textContent = '근무 기록은 이 브라우저에 별도 저장됩니다. 사건수사노트의 [기록] 탭에서 세이브 코드로 함께 옮길 수 있습니다.'; content.append(note);
        if (FieldSave.storageError()) { const warn = document.createElement('p'); warn.textContent = '기록 저장소를 사용할 수 없습니다. 브라우저 저장 권한을 확인하십시오.'; content.append(warn); }
    }
    function hold(el, action) {
        let down = false;
        const start = () => { if (down) return; down = true; FieldCore.action(action, true); };
        const stop = () => { if (!down) return; down = false; FieldCore.action(action, false); };
        el.addEventListener('pointerdown', event => { if (event.button !== 0) return; el.setPointerCapture(event.pointerId); start(); });
        el.addEventListener('pointerup', stop); el.addEventListener('pointercancel', stop); el.addEventListener('lostpointercapture', stop);
        el.addEventListener('keydown', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); start(); } });
        el.addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); stop(); } });
        el.addEventListener('blur', stop);
    }
    function shell(id = 'EP01') {
        activeMission = id;
        lastVideo = lastInventory = lastEvent = ''; logLength = 0;
        // Missions may bring their own view (EP02); the window, log and outcome handling stay shared.
        if (mission().ui) { video = null; content.replaceChildren(); mission().ui.mount(content, {}); return; }
        content.innerHTML = `<div class="field-hud"><strong id="field-clock"></strong><span id="field-location"></span><span id="field-status"></span></div>
            <div class="field-grid"><section class="field-observation"><div class="field-camera">
            <video id="field-video" autoplay loop muted playsinline></video><div class="field-scanlines"></div>
            <span class="field-feed-label">${mission().data.feedLabel}</span><div id="field-scene"></div><div id="field-eyelids">시야 차단</div></div>
            <div class="field-controls" id="field-body"></div><div id="field-contact" class="field-controls"></div>
            <div class="field-inventory"><label for="field-item">손에 든 물건</label><select id="field-item"></select><button id="field-use" type="button">선택한 물건 사용 / 건네기</button></div>
            <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre></section>
            <aside><div class="field-tabs"><button id="field-tab-map">순찰 지도</button><button id="field-tab-equipment">장비함</button><button id="field-tab-phone">통신</button><button id="field-tab-rules">수칙 문서</button></div>
            <div id="field-tools"></div><p id="field-patrol-record"></p><p id="field-weather"></p>
            <p class="field-help">눈 감기 / 뒤로 이동은 누르고 유지합니다. 수칙 열람 중에도 근무 시간은 흐릅니다. 연결 종료 시 현재 근무는 중단됩니다.</p></aside></div><div id="field-outcome"></div>`;
        video = $('field-video');
        const body = $('field-body');
        body.append(button('조명 OFF', 'light', null, 'field-light'));
        const eyes = document.createElement('button'); eyes.textContent = '두 눈 감기 · 누르고 유지'; eyes.id = 'field-eyes'; hold(eyes, 'eyes'); body.append(eyes);
        body.append(button('왼쪽 눈 깜빡', 'blink', 'left', 'field-blink-left'), button('오른쪽 눈 깜빡', 'blink', 'right', 'field-blink-right'));
        const back = document.createElement('button'); back.textContent = '뒤로 이동 · 누르고 유지'; back.id = 'field-back'; hold(back, 'back'); body.append(back);
        body.append(button('시선 전환', 'look', null, 'field-look'));
        $('field-item').onchange = event => FieldCore.action('select', event.target.value);
        $('field-use').onclick = () => FieldCore.action('use');
        for (const tab of ['map', 'equipment', 'phone', 'rules']) $('field-tab-' + tab).onclick = () => tools(tab);
        tools('map');
    }
    function tools(tab) {
        const s = FieldCore.get();
        if (s && mission().breaksGaze?.(s)) {
            FieldCore.action('look'); return;
        }
        const root = $('field-tools'); if (!root) return; root.replaceChildren();
        for (const name of ['map', 'equipment', 'phone', 'rules']) $('field-tab-' + name)?.setAttribute('aria-pressed', String(name === tab));
        if (tab === 'map') {
            const title = document.createElement('h3'); title.textContent = '순찰 경로 / 현재 위치'; root.append(title);
            for (const [id, label] of Object.entries(mission().data.locations)) root.append(button(label, 'move', id, 'field-move-' + id));
            root.append(button('파고 / 기상 확인', 'weather', null, 'field-check-weather'), button('선박 출현 여부 관측', 'patrol', null, 'field-patrol'));
        } else if (tab === 'equipment') {
            root.append(button('장비·조명 작동 점검', 'equipment', null, 'field-equipment-check'), ...mission().data.equipment.map(id => button(`${mission().data.items[id]} 수령`, 'take', id, 'field-take-' + id)));
            const hint = document.createElement('p'); hint.textContent = '장비 수령은 대기소에서만 가능합니다. 근무복 오른쪽 가슴 주머니에는 10,000원권 세 장이 준비되어 있습니다.'; root.append(hint);
        } else if (tab === 'phone') {
            root.append(button('내선 1번', 'phone', '1', 'field-phone-1'), button('내선 0번', 'phone', '0', 'field-phone-0'), button('통화 종료', 'hangup', null, 'field-hangup'), button('선박 출현 여부 보고', 'report', null, 'field-report'));
            const hint = document.createElement('p'); hint.textContent = '내선 1번 연결 불가 시 0번. 성명을 먼저 말하면 끊고 1분 이상 대기 후 다시 연결.'; root.append(hint);
        } else {
            // Reuse canonical-synced existing report; no fetch or duplicate source.
            const source = document.querySelector(mission().data.reportSelector);
            const report = document.createElement('pre'); report.className = 'field-rules'; report.textContent = source ? source.value : '수칙 문서 연결 불가'; root.append(report);
        }
    }
    function contact(s) {
        const e = s.data.event;
        const signature = e ? `${e.type}:${e.stage}` : '';
        if (signature === lastEvent) return; lastEvent = signature;
        const root = $('field-contact'); root.replaceChildren();
        if (signature === 'F:sound') crackle();
        if (!e) return;
        for (const [label, name, value] of mission().contacts(s)) root.append(button(label, name, value, 'field-contact-' + name));
    }

    function renderLog(s) {
        const log = $('field-log'); if (!log) return;
        if (logLength !== s.logs.length || log.dataset.last !== s.logs.at(-1)?.message) {
            const stamp = mission().stamp || (entry => FieldCore.time(entry.minute));
            logLength = s.logs.length; log.textContent = s.logs.map(entry => `[${stamp(entry)}] ${entry.message}`).join('\n');
            log.dataset.last = s.logs.at(-1)?.message || ''; log.scrollTop = log.scrollHeight;
        }
    }
    function render(s) {
        if (!s) return;
        if (mission().ui) { mission().ui.render(s); renderLog(s); settle(s); return; }
        if (!$('field-clock')) return;
        $('field-clock').textContent = `근무 ${FieldCore.time(s.minute)} / 06:00`;
        $('field-location').textContent = mission().data.locations[s.data.location];
        $('field-status').textContent = s.status === 'active' ? '관측 연결 유지' : s.status === 'dead' ? '연결 소실' : '생환';
        $('field-light').textContent = `조명 ${s.controls.light ? 'ON → OFF' : 'OFF → ON'}`;
        $('field-light').setAttribute('aria-pressed', String(s.controls.light));
        $('field-eyes').setAttribute('aria-pressed', String(s.controls.eyes));
        $('field-eyelids').style.display = s.controls.eyes ? 'grid' : 'none';
        $('field-scene').textContent = mission().scene(s);
        $('field-weather').textContent = s.data.weatherChecked ? `파고 ${s.data.wave}m / ${s.data.wave >= 1.5 ? '해안선 접근 제한' : '약풍'}` : '파고 / 기상 미확인';
        $('field-patrol-record').textContent = `매시각 순찰 보고: ${Object.keys(s.patrols).length}/8 · 장비 ${s.data.equipmentChecked ? '점검 완료' : '미점검'}`;
        if (s.data.video !== lastVideo) {
            lastVideo = s.data.video; video.src = lastVideo;
            video.play().catch(() => { const scene = $('field-scene'); if (scene) scene.dataset.feed = '영상 신호 불가 / 관측 기록 유지'; });
        }
        const inv = JSON.stringify(s.inventory);
        if (inv !== lastInventory) {
            lastInventory = inv; const select = $('field-item'); select.replaceChildren();
            const empty = document.createElement('option'); empty.value = ''; empty.textContent = '손에 든 물건 없음'; select.append(empty);
            for (const id of Object.keys(s.inventory)) { const option = document.createElement('option'); option.value = id; option.textContent = mission().data.items[id]; select.append(option); }
        }
        $('field-item').value = s.selected;
        renderLog(s);
        contact(s);
        settle(s);
    }
    function settle(s) {
        const outcome = $('field-outcome');
        if (s.status !== 'active' && !outcome.children.length) {
            video?.pause();
            const text = document.createElement('p'); text.textContent = s.status === 'dead' ? s.reason : (mission().data.clearText || '생환 기록 저장 / EP.02 연결 권한 갱신. 다음 현장은 연결 준비 중입니다.'); outcome.append(text);
            if (FieldSave.storageError()) { const warn = document.createElement('p'); warn.textContent = '기록 저장 실패. 이 브라우저에서는 새 근무 기록이 보존되지 않습니다.'; outcome.append(warn); }
            const retry = document.createElement('button'); retry.textContent = '재파견'; retry.id = 'field-retry'; retry.onclick = () => { shell(s.id); FieldCore.dispatch(s.id); };
            const list = document.createElement('button'); list.textContent = '관측 목록'; list.id = 'field-list'; list.onclick = () => { FieldCore.disconnect(); catalog(); };
            outcome.append(retry, list);
            content.querySelectorAll('.field-grid button, .field-grid select').forEach(el => { el.disabled = true; });
        }
    }
    window.addEventListener('load', () => {
        win = $('fieldWindow'); content = $('field-content');
        darkWebWindowsList.push({ id: 'fieldWindow', title: '▥ 현장 관측 시스템' });
        win.addEventListener('pointerdown', focus);
        $('field-close').onclick = close; $('field-open').onclick = open;
        $('field-open').onkeydown = event => { if (['Enter', ' '].includes(event.key)) { event.preventDefault(); open(); } };
        FieldCore.onChange(render);
        // Existing disconnect/Story overlays retain their behavior; stop our own session.
        const observer = new MutationObserver(() => {
            if ($('darkweb-overlay').style.display === 'none' || $('bsod-overlay').style.display === 'block') close();
            else if (win.style.display === 'none') FieldCore.release();
        });
        for (const el of [win, $('darkweb-overlay'), $('bsod-overlay')]) observer.observe(el, { attributes: true, attributeFilter: ['style'] });
    });
    return { open, close };
})();
