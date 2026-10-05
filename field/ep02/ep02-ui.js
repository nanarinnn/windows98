// EP02 view. Reuses the Field shell classes (.field-hud/.field-grid/.field-camera/.field-controls/.field-tabs/#field-log).
// Design rule: the UI never names a future car's event and never offers the "answer" up front. The HUD shows only the
// car, the station and whether the train is moving; every action button is situational and appears only after the
// player has observed the matching situation (the rule document is the player's source of truth).
window.FieldEP02UI = (() => {
    const data = FieldEP02Data;
    const T = data.tuning;
    const $ = id => document.getElementById(id);
    let tab = 'status', sig = '', lastVideo = '';

    function mount(root) {
        sig = ''; tab = 'status'; lastVideo = '';
        root.innerHTML = `<div class="field-hud"><strong id="f2-car"></strong><span id="f2-station"></span><span id="f2-train"></span></div>
            <div class="field-grid"><section class="field-observation">
            <div class="f2-strip" id="f2-strip"></div>
            <div class="field-camera f2-scene" id="f2-scene"><video id="f2-video" muted loop playsinline></video><div class="field-scanlines"></div>
            <span class="field-feed-label">LINE 2 · INNER · SINSEOL-DONG BOUND</span><div id="f2-text"></div></div>
            <div class="field-controls" id="f2-actions"></div>
            <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre></section>
            <aside><div class="field-tabs"><button id="f2-tab-status" type="button">상태</button><button id="f2-tab-map" type="button">노선도</button><button id="f2-tab-rules" type="button">수칙 문서</button></div>
            <div id="field-tools"></div>
            <p class="field-help">수칙 열람 중에도 열차는 계속 움직입니다. 연결 종료 시 현재 현장은 중단됩니다.</p></aside></div><div id="field-outcome"></div>`;
        const strip = $('f2-strip');
        for (let n = data.cars; n >= 0; n--) {
            const cell = document.createElement('span'); cell.id = `f2-car-${n}`; cell.textContent = n === 0 ? '기관실' : String(n);
            strip.append(cell);
        }
        for (const name of ['status', 'map', 'rules']) $('f2-tab-' + name).onclick = () => { tab = name; panel(null, true); };
        panel(null, true);
    }

    function btn(label, name, value, id, opts = {}) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id;
        if (opts.disabled) el.disabled = true;
        el.addEventListener('click', () => FieldCore.action(name, value)); return el;
    }

    // Situational actions only. Nothing about a car that has not been entered is offered.
    function actions(s) {
        const d = s.data, x = d.sys, car = d.carIndex, row = $('f2-actions');
        const list = [];
        const add = (...args) => list.push(btn(...args));
        if (d.eyesClosed) {
            add('눈을 뜬다', 'eyes', false, 'f2-eyes');
            if (d.crouching) add('자리에서 일어선다', 'crouch', false, 'f2-crouch');
        } else {
            if (d.crouching) {
                add('자리에서 일어선다', 'crouch', false, 'f2-crouch');
                if (d.voidStationActive) add('눈을 감는다', 'eyes', true, 'f2-eyes');
            } else if (d.voidStationActive) add('좌석 사이로 웅크린다', 'crouch', true, 'f2-crouch');
            if (car > 1) add(car === 6 ? '조용히 지나간다' : '앞쪽 객차로 이동', 'forward', null, 'f2-forward');
            add(car === 6 ? '조심스럽게 살핀다' : '주변을 살핀다', 'look', null, 'f2-look');
            add('소지품을 확인한다', 'inventory', null, 'f2-inventory');
            if (car === 6 && !d.shoesOff) add('신발을 벗는다', 'shoes', null, 'f2-shoes');
            if (car === 5 && x.girl === 'idle') add('시선을 거둔다', 'lookaway', null, 'f2-lookaway');
            if (car === 5 && x.girl === 'asked') add('노선도를 본다', 'map', null, 'f2-map'), add('노선도를 가리킨다', 'point', null, 'f2-point'), add('대답한다', 'speak', null, 'f2-speak'), add('뒤로 물러난다', 'stepback', null, 'f2-stepback');
            if (car === 5 && x.girl === 'rps') for (const hand of ['scissors', 'rock', 'paper']) add(data.rps.names[hand], 'rps', hand, `f2-rps-${hand}`);
            if (car === 3) {
                add('가만히 기다린다', 'wait', null, 'f2-wait');
                if (!x.flash) {
                    add('더듬어 본다', 'grope', null, 'f2-grope');
                    add('휴대폰 라이트를 켠다', 'phone', true, 'f2-phone');
                } else {
                    const targets = [...data.searchTargets, ...(x.mode === 'special' ? data.specialTargets : [])];
                    for (const t of targets) add(`${t.label} 확인`, 'search', t.id, `f2-search-${t.id}`, { disabled: x.searched.includes(t.id) || d.engineCardFound });
                }
                if (x.clownSeen && !d.clownPaid && d.hasPill) add('오른손 전두엽의 일부와 빨간 알약을 지불한다', 'pay', null, 'f2-pay');
            }
            if (d.hasPill && (x.c1 || (x.pillKnown && car === 3))) add('빨간 알약을 삼킨다', 'pill', null, 'f2-pill');
            if (car === 2) { if (!d.undressed) add('옷을 벗는다', 'undress', null, 'f2-undress'); add('진입 통로의 기름을 바른다', 'oil', null, 'f2-oil', { disabled: d.oiled }); }
            if (car === 1) add('승객들을 밀치고 나아간다', 'push', null, 'f2-push', { disabled: x.crowdDone }), add('기관실 문에 카드를 댄다', 'card', null, 'f2-card');
            if (car === 0) add('현실 재인식 버튼을 누른다', 'recognize', null, 'f2-recognize', { disabled: d.realityButtonPressed }), add('창문 앞으로 다가간다', 'window', null, 'f2-window', { disabled: x.windowReady }), add('창문으로 몸을 던진다', 'jump', null, 'f2-jump');
        }
        row.replaceChildren(...list);
    }

    // Observation prose only: no event titles, no hidden state.
    function describe(s) {
        const d = s.data, x = d.sys, car = d.carIndex;
        if (d.voidStationActive) {
            const held = x.voidHolding ? `\n대기 ${Math.min(180, Math.floor(x.holdAge / T.voidHold * 180))}초 / 180초` : '';
            return `노선도에 없는 역에 정차했다. 안내방송만이 흘러나온다.${held}`;
        }
        if (d.eyesClosed) return '눈을 감고 있다. 아무것도 보이지 않는다.';
        if (car === 3) {
            if (!x.flash) return '아무것도 보이지 않는다. 완전한 암흑이다.';
            const targets = [...data.searchTargets, ...(x.mode === 'special' ? data.specialTargets : [])];
            let text = `${data.flashScene}\n보이는 것: ${targets.map(t => t.label).join(' / ')}`;
            if (x.clownSeen && !d.clownPaid) text += '\n웃는 광대 가면을 착용한 남성이 서 있다.';
            if (x.c1) text += '\n차량 상부에서 무언가가 내려오려 한다.';
            return text;
        }
        if (car === 0) {
            const left = x.remaining ? `${x.remaining.length}개` : '-';
            return `노선 상태: ${d.trainMoving ? '주행 중 (역과 역 사이)' : `정차 중 — ${d.currentStation}역`}\n다음 역: ${d.nextStation} / 신설동까지 남은 역: ${left}\n${d.realityButtonPressed ? `현실 재인식 유지: ${Math.max(0, x.recogLeft).toFixed(1)}초` : '현실 재인식 버튼 · 창문'}`;
        }
        let text = data.carText[car].view;
        if (car === 5 && x.girl === 'rps') text += `\n${data.rps.hints[Math.min(x.rps, data.rps.hints.length - 1)]}`;
        if (car === 5 && x.girl === 'asked') text += '\n아이가 대답을 기다린다.';
        if (car === 1 && !x.crowdDone) text += `\n밀치고 나아가는 중: ${x.pushes}/${T.pushCount}`;
        if (d.drunkAwake) text += '\n뒤쪽에서 느리지만 꾸준히 따라오는 기척이 있다.';
        return text;
    }

    // Only what the player can realistically know: where they are, the train, and what they actually carry.
    function panel(s, force) {
        const root = $('field-tools'); if (!root) return;
        for (const name of ['status', 'map', 'rules']) $('f2-tab-' + name)?.setAttribute('aria-pressed', String(name === tab));
        if (tab === 'status') {
            let pre = $('f2-status');
            if (!pre) { root.replaceChildren(); pre = document.createElement('pre'); pre.id = 'f2-status'; pre.className = 'f2-status'; root.append(pre); }
            if (!s) return;
            const d = s.data, x = d.sys;
            const carried = [d.engineCardFound ? '기관실 출입 카드' : '', x.pillKnown && d.hasPill ? '빨간 알약 (안내문과 함께 구비)' : ''].filter(Boolean);
            pre.textContent = [
                `위치: ${d.carIndex === 0 ? '기관실' : `${d.carIndex}번 객차`}`,
                `열차: ${d.trainMoving ? '이동 중' : '정차 중'}`,
                `소지품: ${carried.length ? carried.join(', ') : '확인한 것 없음'}`
            ].join('\n');
        } else if (force) {
            root.replaceChildren();
            const pre = document.createElement('pre'); pre.className = 'field-rules';
            if (tab === 'map') pre.textContent = data.routeMap;
            else { // Same single source as the Story window: 2화.txt text embedded in #darkwebReportWindowEP2.
                const source = document.querySelector(data.reportSelector);
                pre.textContent = source ? source.value : '수칙 문서 연결 불가';
            }
            root.append(pre);
        }
    }

    function video(s) {
        const el = $('f2-video'); if (!el) return;
        const d = s.data, x = d.sys;
        const src = data.carText[d.carIndex].video;
        if (src !== lastVideo) { lastVideo = src; el.src = src; el.play().catch(() => {}); }
        if (s.status !== 'active') el.pause();
        const hidden = d.eyesClosed || (d.carIndex === 3 && !x.flash) || d.voidStationActive;
        el.style.visibility = hidden ? 'hidden' : 'visible';
    }

    function render(s) {
        if (!s || !$('f2-car')) return;
        const d = s.data, x = d.sys;
        $('f2-car').textContent = d.carIndex === 0 ? '기관실' : `${d.carIndex}번 객차`;
        $('f2-station').textContent = d.voidStationActive ? '현재 역: ■■■' : d.currentStation ? `현재 역: ${d.currentStation}` : `다음 역: ${d.nextStation}`;
        const train = $('f2-train'); train.textContent = `열차: ${d.trainMoving ? '이동 중' : '정차 중'}`; train.className = d.trainMoving ? '' : 'f2-stopped';
        for (let n = 0; n <= data.cars; n++) $(`f2-car-${n}`)?.classList.toggle('active', n === d.carIndex);
        const scene = $('f2-scene'), dark = d.eyesClosed || d.voidStationActive || (d.carIndex === 3 && !x.flash);
        scene.classList.toggle('f2-dark', dark); scene.classList.toggle('f2-flash', d.carIndex === 3 && x.flash && !d.eyesClosed);
        $('f2-text').textContent = describe(s);
        const next = JSON.stringify([d.carIndex, d.trainMoving, d.shoesOff, d.crouching, d.eyesClosed, d.undressed, d.oiled, x.girl, x.crowdDone, d.engineCardFound,
            d.realityButtonPressed, x.windowReady, x.searched.join(','), x.flash, x.mode === 'special', x.clownSeen, d.clownPaid, d.hasPill, !!x.c1, x.pillKnown, d.voidStationActive, s.status]);
        if (next !== sig) { sig = next; actions(s); }
        panel(s, false); video(s);
    }

    return { mount, render };
})();
