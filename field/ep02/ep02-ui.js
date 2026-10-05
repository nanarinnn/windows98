// EP02 view. Reuses the Field shell classes (.field-hud/.field-grid/.field-camera/.field-controls/.field-tabs/#field-log)
// so it looks like the EP01 Field window; only the train strip and status chips are new.
window.FieldEP02UI = (() => {
    const data = FieldEP02Data;
    const T = data.tuning;
    const $ = id => document.getElementById(id);
    let tab = 'status', sig = '', helpers = null;

    function mount(root, h) {
        helpers = h; sig = ''; tab = 'status';
        root.innerHTML = `<div class="field-hud"><strong id="f2-car"></strong><span id="f2-station"></span><span id="f2-train"></span></div>
            <div class="f2-chips" id="f2-chips"></div>
            <div class="field-grid"><section class="field-observation">
            <div class="f2-strip" id="f2-strip"></div>
            <div class="field-camera f2-scene" id="f2-scene"><span class="field-feed-label">LINE 2 · INNER · SINSEOL-DONG BOUND</span><div id="f2-text"></div></div>
            <div class="field-controls" id="f2-actions"></div><div class="field-controls" id="f2-event"></div>
            <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre></section>
            <aside><div class="field-tabs"><button id="f2-tab-status" type="button">상태</button><button id="f2-tab-map" type="button">노선도</button><button id="f2-tab-rules" type="button">수칙 문서</button></div>
            <div id="field-tools"></div>
            <p class="field-help">열차가 역과 역 사이를 주행하는 동안에만 객차 간 이동이 가능합니다. 수칙 열람 중에도 열차는 계속 움직입니다. 연결 종료 시 현재 현장은 중단됩니다.</p></aside></div><div id="field-outcome"></div>`;
        const strip = $('f2-strip');
        for (let n = data.cars; n >= 0; n--) {
            const cell = document.createElement('span'); cell.id = `f2-car-${n}`;
            cell.textContent = n === 0 ? '기관실' : String(n);
            if (n === data.cars) cell.title = '후미'; if (n === 1) cell.title = '선두';
            strip.append(cell);
        }
        for (const name of ['status', 'map', 'rules']) $('f2-tab-' + name).onclick = () => { tab = name; panel(null, true); };
        panel(null, true);
    }

    function btn(label, name, value, id, opts = {}) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id;
        if (opts.disabled) el.disabled = true;
        if (opts.pressed !== undefined) el.setAttribute('aria-pressed', String(opts.pressed));
        el.addEventListener('click', () => FieldCore.action(name, value)); return el;
    }

    function actions(s) {
        const d = s.data, x = d.sys, car = d.carIndex;
        const row = $('f2-actions'), event = $('f2-event');
        row.replaceChildren(); event.replaceChildren();
        if (car > 0) row.append(btn(`앞칸으로 이동 (${car === 1 ? '기관실 방향' : `${car - 1}번`})`, 'forward', null, 'f2-forward'));
        row.append(btn('신발 벗기', 'shoes', null, 'f2-shoes', { disabled: d.shoesOff }));
        row.append(btn(d.crouching ? '일어서기' : '웅크리기', 'crouch', !d.crouching, 'f2-crouch', { pressed: d.crouching }));
        row.append(btn(d.eyesClosed ? '눈 뜨기' : '눈 감기', 'eyes', !d.eyesClosed, 'f2-eyes', { pressed: d.eyesClosed }));
        row.append(btn(d.artificialLight ? '휴대폰 라이트 끄기' : '휴대폰 라이트 켜기', 'phone', !d.artificialLight, 'f2-phone', { pressed: d.artificialLight }));
        if (car > 0 && car <= 2) row.append(btn('옷 벗기', 'undress', null, 'f2-undress', { disabled: d.undressed }));
        if (car === 2) event.append(btn('진입 통로의 기름 바르기', 'oil', null, 'f2-oil', { disabled: d.oiled }));
        if (car === 5 && x.girl === 'idle') event.append(btn('시선 거두기', 'lookaway', null, 'f2-lookaway'));
        if (car === 5 && x.girl === 'asked') {
            event.append(btn('노선도 보기', 'map', null, 'f2-map'), btn('노선도를 가리키기', 'point', null, 'f2-point'),
                btn('말하기', 'speak', null, 'f2-speak'), btn('뒤로 물러나기', 'stepback', null, 'f2-stepback'));
        }
        if (car === 5 && x.girl === 'rps') for (const hand of ['scissors', 'rock', 'paper']) event.append(btn(data.rps.names[hand], 'rps', hand, `f2-rps-${hand}`));
        if (car === 3) for (const t of data.searchTargets) event.append(btn(`수색: ${t.label}`, 'search', t.id, `f2-search-${t.id}`, { disabled: x.searched.includes(t.id) || d.engineCardFound }));
        if (car === 1) event.append(btn('승객들을 밀치고 나아가기', 'push', null, 'f2-push', { disabled: x.crowdDone }), btn('기관실 출입 카드 사용', 'card', null, 'f2-card'));
        if (car === 0) event.append(btn('현실 재인식 버튼', 'recognize', null, 'f2-recognize', { disabled: d.realityButtonPressed }),
            btn('창문 앞으로 다가가기', 'window', null, 'f2-window', { disabled: x.windowReady }), btn('창문으로 투신', 'jump', null, 'f2-jump'));
    }

    function describe(s) {
        const d = s.data, x = d.sys;
        if (d.voidStationActive) {
            const held = x.voidHolding ? `\n대기 ${Math.min(180, Math.floor(x.holdAge / T.voidHold * 180))}초 / 180초` : '';
            return `[■■■역] 노선도에 없는 역 / 열차 정차${held}`;
        }
        if (d.eyesClosed) return '[눈을 감고 있다] 시야 차단';
        if (d.carIndex === 3) {
            if (!x.flash) return '[암흑] 아무것도 보이지 않는다.';
            return `${data.flashScene}\n· ${data.searchTargets.map(t => t.label).join('\n· ')}`;
        }
        if (d.carIndex === 0) {
            const left = x.remaining ? `${x.remaining.length}개` : '-';
            return `[기관실] 노선 상태: ${d.trainMoving ? '주행 중 (역과 역 사이)' : `정차 중 — ${d.currentStation}역`}\n다음 역: ${d.nextStation} / 신설동까지 남은 역: ${left}\n${d.realityButtonPressed ? `현실 재인식 유지: ${Math.max(0, x.recogLeft).toFixed(1)}초` : '현실 재인식 버튼 · 창문'}`;
        }
        let text = data.carText[d.carIndex].scene;
        if (d.carIndex === 5 && x.girl === 'rps') text += `\n${data.rps.hints[Math.min(x.rps, data.rps.hints.length - 1)]}`;
        if (d.carIndex === 5 && x.girl === 'asked') text += '\n아이가 대답을 기다린다.';
        if (d.carIndex === 1 && !x.crowdDone) text += `\n밀치고 나아가는 중: ${x.pushes}/${T.pushCount}`;
        if (d.drunkAwake) text += `\n취객이 추적 중 (거리 ${x.drunkGap})`;
        return text;
    }

    function panel(s, force) {
        const root = $('field-tools'); if (!root) return;
        for (const name of ['status', 'map', 'rules']) $('f2-tab-' + name)?.setAttribute('aria-pressed', String(name === tab));
        if (tab === 'status') {
            let pre = $('f2-status');
            if (!pre) { root.replaceChildren(); pre = document.createElement('pre'); pre.id = 'f2-status'; pre.className = 'f2-status'; root.append(pre); }
            if (!s) return;
            const d = s.data, x = d.sys;
            pre.textContent = [
                `신발: ${d.shoesOff ? '벗음' : '신음'}`, `자세: ${d.crouching ? '웅크림' : '서 있음'}`, `눈: ${d.eyesClosed ? '감음' : '뜸'}`,
                `휴대폰 라이트: ${d.artificialLight ? '켜짐' : '꺼짐'}`, `옷: ${d.undressed ? '탈의' : '착용'}`, `기름: ${d.oiled ? '바름' : '바르지 않음'}`,
                `기관실 출입 카드: ${d.engineCardFound ? '확보' : '미확보'}`,
                d.drunkAwake ? `취객 추적: 거리 ${x.drunkGap}` : '취객 추적: 없음'
            ].join('\n');
        } else if (force) {
            root.replaceChildren();
            const pre = document.createElement('pre'); pre.className = 'field-rules'; pre.textContent = tab === 'map' ? data.routeMap : data.rulesText; root.append(pre);
        }
    }

    function render(s) {
        if (!s || !$('f2-car')) return;
        const d = s.data, x = d.sys;
        $('f2-car').textContent = d.carIndex === 0 ? '기관실' : `${d.carIndex}번 객차 / ${data.cars}`;
        const remaining = x.remaining ? ` · 남은 역 ${x.remaining.length}` : '';
        $('f2-station').textContent = d.voidStationActive ? '현재 역: ■■■ (노선도에 없음)' : d.currentStation ? `현재 역: ${d.currentStation}${remaining}` : `다음 역: ${d.nextStation}${remaining}`;
        const train = $('f2-train'); train.textContent = `열차: ${d.trainMoving ? '이동 중' : '정차 중'}`; train.className = d.trainMoving ? '' : 'f2-stopped';
        $('f2-chips').textContent = [`신발 ${d.shoesOff ? '벗음' : '신음'}`, `웅크리기 ${d.crouching ? 'ON' : 'OFF'}`, `눈 ${d.eyesClosed ? '감음' : '뜸'}`,
            `카드 ${d.engineCardFound ? '확보' : '없음'}`, `기름 ${d.oiled ? '바름' : '없음'}`, ...(d.drunkAwake ? [`취객 ${x.drunkGap}`] : [])].join('  ·  ');
        for (let n = 0; n <= data.cars; n++) $(`f2-car-${n}`)?.classList.toggle('active', n === d.carIndex);
        const scene = $('f2-scene'), dark = d.carIndex === 3 && !x.flash && !d.eyesClosed;
        scene.classList.toggle('f2-dark', dark || d.eyesClosed); scene.classList.toggle('f2-flash', d.carIndex === 3 && x.flash && !d.eyesClosed);
        $('f2-text').textContent = describe(s);
        const next = JSON.stringify([d.carIndex, d.trainMoving, d.shoesOff, d.crouching, d.eyesClosed, d.artificialLight, d.undressed, d.oiled, x.girl, x.crowdDone,
            d.engineCardFound, d.realityButtonPressed, x.windowReady, x.searched.join(','), s.status]);
        if (next !== sig) { sig = next; actions(s); }
        panel(s, false);
    }

    return { mount, render };
})();
