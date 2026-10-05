// EP03 view. Reuses the Field shell classes. Same design rule as EP02: the HUD shows only DAY / time / place; no internal
// booleans, no future events, no answer buttons up front. Actions are situational; the status tab lists only what the
// player has actually checked (last seen values, which can be stale).
window.FieldEP03UI = (() => {
    const data = FieldEP03Data;
    const T = data.tuning;
    const $ = id => document.getElementById(id);
    const fmt = m => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
    const placeName = { room: '병실', corridor: '복도', lounge: '병동 휴게실', visit: '1층 면회실' };
    let tab = 'status', sig = '', lastVideo = '', last = null;

    function mount(root) {
        sig = ''; tab = 'status'; lastVideo = '';
        root.innerHTML = `<div class="field-hud"><strong id="f3-day"></strong><span id="f3-time"></span><span id="f3-place"></span></div>
            <div class="field-grid"><section class="field-observation">
            <div class="field-camera f2-scene" id="f3-scene"><video id="f3-video" muted loop playsinline></video><div class="field-scanlines"></div>
            <span class="field-feed-label">BERRY HAPPY GENERAL HOSPITAL</span><div id="f3-text"></div></div>
            <div class="field-controls" id="f3-actions"></div>
            <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre></section>
            <aside><div class="field-tabs"><button id="f3-tab-status" type="button">확인한 정보</button><button id="f3-tab-rules" type="button">수칙 문서</button></div>
            <div id="field-tools"></div>
            <p class="field-help">수칙 열람 중에도 시간은 흐릅니다. 연결을 종료해도 입원 기록은 이 브라우저에 보관되며 다음 파견에서 이어집니다.</p></aside></div><div id="field-outcome"></div>`;
        for (const name of ['status', 'rules']) $('f3-tab-' + name).onclick = () => { tab = name; panel(last, true); };
        panel(null, true);
    }

    function btn(label, name, value, id, opts = {}) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id;
        if (opts.disabled) el.disabled = true;
        el.addEventListener('click', () => FieldCore.action(name, value)); return el;
    }

    // Situational actions only.
    function actions(s) {
        const d = s.data, x = d.sys, vn = x.visitNow, list = [];
        const add = (...args) => list.push(btn(...args));
        if (x.nurse === 'meal') add('배탈을 호소한다', 'complain', null, 'f3-complain'), add('특제 치료식을 받아 먹는다', 'eat', null, 'f3-eat');
        if (x.rounds === 'ask') {
            add('“조금씩 나아지고 있습니다.”라고 답한다', 'answer', 'better', 'f3-answer-better');
            add('“아픕니다.”라고 답한다', 'answer', 'pain', 'f3-answer-pain');
            add('“다 나았습니다.”라고 답한다', 'answer', 'cured', 'f3-answer-cured');
        }
        if (x.night === 'sound' || x.night === 'asleep') {
            add(d.eyesClosed ? '눈을 뜬다' : '눈을 감는다', 'eyes', !d.eyesClosed, 'f3-eyes');
            if (d.eyesClosed) add(d.breathing ? '숨소리를 멈춘다' : '규칙적인 숨소리를 낸다', 'breathe', !d.breathing, 'f3-breathe');
        }
        if (x.night === 'spoke') add('10만원권 한 장을 건넨다', 'payNurse', null, 'f3-pay-nurse');
        if (d.loc === 'room') {
            add('주변을 살핀다', 'look', null, 'f3-look');
            add('오른손 팔목을 확인한다', 'wrist', null, 'f3-wrist');
            add('병실 문 옆 차트를 확인한다', 'chart', null, 'f3-chart');
            add('서랍을 확인한다', 'drawer', null, 'f3-drawer');
            if (d.roomLooked) {
                add('설사약을 복용한다', 'laxative', null, 'f3-laxative', { disabled: d.tookLaxative });
                for (const part of data.parts) add(`마취제를 ${part}에 주입한다`, 'inject', part, `f3-inject-${data.parts.indexOf(part)}`);
                add('빨간 알약을 복용한다', 'redpill', null, 'f3-redpill', { disabled: d.tookRedPill });
                add('침상 옆 호출벨을 누른다', 'bell', null, 'f3-bell', { disabled: !!d.emergencyAt });
            }
            if (d.juice === 'bed') add('침대 위의 음료를 집는다', 'takeDrink', null, 'f3-take-drink');
            if (d.juice === 'held') add('음료를 마신다', 'drink', null, 'f3-drink');
            if (d.juice === 'drunk' && !d.stomach) add('복통을 호소한다', 'stomach', null, 'f3-stomach');
            add('병실 밖으로 나간다', 'out', null, 'f3-out');
        } else if (d.loc === 'corridor') {
            add('병동 휴게실로 간다', 'goLounge', null, 'f3-go-lounge');
            if (vn && vn.stage === 'notice') add('1층 면회실로 간다', 'goVisit', null, 'f3-go-visit');
            add('병실로 돌아간다', 'back', null, 'f3-back');
        } else if (d.loc === 'lounge') {
            add('주변을 살핀다', 'look', null, 'f3-look');
            add('자판기를 살핀다', 'machine', null, 'f3-machine');
            if (x.vend && !x.selected && x.inserted < 2) add('10만원권을 투입한다', 'insert', null, 'f3-insert');
            if (x.vend && !x.selected && x.inserted >= 2) {
                for (let r = 1; r <= data.vending.rows; r++) for (let c = 1; c <= data.vending.cols; c++) add(`${r}줄 ${c}번째 칸을 선택한다`, 'cell', `${r}-${c}`, `f3-cell-${r}-${c}`);
            }
            if (x.selected) add('상품 반출구에 손을 넣는다', 'outlet', null, 'f3-outlet');
            add('병실로 돌아간다', 'back', null, 'f3-back');
        } else if (d.loc === 'visit' && vn) {
            add('상대의 말을 듣는다', 'listen', null, 'f3-listen');
            add('탁자 아래를 살핀다', 'under', null, 'f3-under');
            if (vn.under) add('면회 종료 버튼을 누른다', 'endVisit', null, 'f3-end-visit');
            if (vn.heard) add('정보를 말한다', 'tell', null, 'f3-tell');
            if (vn.heard) add('면회자의 지시에 따른다', 'follow', null, 'f3-follow');
            add('면회실을 나간다', 'back', null, 'f3-back');
        }
        if (d.leak) add('본부에 보고한다', 'report', null, 'f3-report');
        $('f3-actions').replaceChildren(...list);
    }

    // Observation prose only.
    function describe(s) {
        const d = s.data, x = d.sys, vn = x.visitNow;
        let text = data.places[d.loc].view;
        if (d.loc === 'room' && d.clock >= T.lightsOut && d.clock < T.dayEnd) text += '\n병동의 불이 꺼져 있다.';
        if (x.nurse === 'meal') text += '\n간호사 개체가 특제 치료식을 들고 서 있다.';
        if (x.rounds === 'ask') text += '\n개체 의사가 병상 곁에 서서 상태를 묻고 있다.';
        if (x.night === 'sound') text += '\n복도에서 이동 침대의 바퀴 소리가 병실 앞에 멈춰 있다.';
        if (x.night === 'spoke') text += '\n간호사가 곁에 서 있다.';
        if (d.loc === 'lounge' && x.vend) {
            const rows = [];
            for (let r = 1; r <= data.vending.rows; r++) rows.push(`${r}줄: ` + Array.from({ length: data.vending.cols }, (_, i) => (r === data.vending.targetRow && i + 1 === data.vending.targetCol ? data.vending.targetName : '음료')).join(' · '));
            text += `\n${rows.join('\n')}`;
            if (x.inserted) text += `\n투입된 10만원권: ${x.inserted}장`;
        }
        if (d.loc === 'visit' && vn) text += '\n탁자 맞은편에 면회자가 앉아 있다.';
        if (s.status === 'cleared') text += '\n보호자와 함께 병원을 나선다.';
        return text;
    }

    function panel(s, force) {
        const root = $('field-tools'); if (!root) return;
        for (const name of ['status', 'rules']) $('f3-tab-' + name)?.setAttribute('aria-pressed', String(name === tab));
        if (tab === 'status') {
            let pre = $('f3-status');
            if (!pre) { root.replaceChildren(); pre = document.createElement('pre'); pre.id = 'f3-status'; pre.className = 'f2-status'; root.append(pre); }
            if (!s) return;
            const d = s.data, p = d.profile;
            pre.textContent = [
                `인식표: ${d.seenBand ? `${data.bandNames[d.band]}${d.seenPart ? ` (표기 부위: ${d.part})` : ''}` : '확인하지 않음'}`,
                `차트: ${d.seenSurgeryDay ? `수술 예정일 DAY ${d.seenSurgeryDay} ${fmt(d.seenSurgeryTime)} (${d.seenAt} 확인)` : '확인하지 않음'}`,
                `서랍: ${d.seenMoney >= 0 ? `10만원권 ${d.seenMoney}장 (확인 당시)` : '확인하지 않음'}`,
                '',
                `나: ${p.age} / ${p.job} / ${p.home} / 가족 ${p.family}`
            ].join('\n');
        } else if (force) {
            root.replaceChildren();
            const pre = document.createElement('pre'); pre.className = 'field-rules';
            const source = document.querySelector(data.reportSelector); // single source: same text as the Story window / 3화.txt
            pre.textContent = source ? source.value : '수칙 문서 연결 불가';
            root.append(pre);
        }
    }

    function video(s) {
        const el = $('f3-video'); if (!el) return;
        const x = s.data.sys;
        const src = s.status === 'cleared' ? 'movies/ep3_event_rescue.mp4'
            : x.nurse === 'meal' ? 'movies/ep3_event_meal.mp4'
            : x.rounds === 'ask' ? 'movies/ep3_event_doctor.mp4'
            : x.night === 'sound' || x.night === 'asleep' || x.night === 'spoke' ? 'movies/ep3_event_night.mp4' : 'movies/ep3_idle.mp4';
        if (src !== lastVideo) { lastVideo = src; el.src = src; el.play().catch(() => {}); }
        if (s.status === 'dead') el.pause();
    }

    function render(s) {
        if (!s || !$('f3-day')) return;
        last = s;
        const d = s.data, x = d.sys;
        $('f3-day').textContent = `DAY ${d.day}`;
        $('f3-time').textContent = fmt(d.clock);
        $('f3-place').textContent = placeName[d.loc];
        const scene = $('f3-scene');
        scene.classList.toggle('f2-dark', d.loc === 'room' && d.clock >= T.lightsOut && d.clock < T.dayEnd);
        $('f3-text').textContent = describe(s);
        const next = JSON.stringify([d.loc, x.nurse, x.rounds, x.night, d.eyesClosed, d.breathing, d.roomLooked, d.tookLaxative, d.tookRedPill, d.juice, d.stomach, !!d.emergencyAt,
            x.vend, x.inserted, x.selected, x.visitNow ? [x.visitNow.kind === 'real' ? 'r' : 'f', x.visitNow.stage, x.visitNow.heard, x.visitNow.under] : 0, d.leak, s.status]);
        if (next !== sig) { sig = next; actions(s); }
        panel(s, false); video(s);
    }

    return { mount, render };
})();
