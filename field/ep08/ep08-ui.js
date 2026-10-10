// EP08 view: one continuous water-park run. HUD = clock / location / wristband state only. Middle = the place you are in
// (video + description, the crowd after the wave, the slide tunnel, the settlement printout) with an announcement/whistle
// strip on top when a second hazard runs. Actions are things you can physically do here; correct and wrong ones sit side
// by side and nothing names an event, a rule or a step order. Right = park map (only adjacent areas are walkable),
// the electronic wristband (assignments only when they matter, emergency-call button) and the rule document.
window.FieldEP08UI = (() => {
    const data = FieldEP08Data;
    const $ = id => document.getElementById(id);
    let sig = '', lastVideo = '';

    function mount(root) {
        sig = ''; lastVideo = '';
        root.innerHTML = `<div class="field-hud"><strong id="f8-clock"></strong><span id="f8-zone"></span><span id="f8-band-hud"></span></div>
            <div class="field-grid"><section class="field-observation">
            <div class="field-camera f8-scene" id="f8-scene"><video id="f8-video" muted loop playsinline></video><div class="f8-tint"></div><div class="field-scanlines"></div>
              <div id="f8-text"></div><div id="f8-alert" hidden></div><div id="f8-crowd" hidden></div>
              <div id="f8-tunnel" hidden><i></i><i></i><i></i><i></i><b id="f8-count-view"></b></div>
              <div id="f8-panel" hidden></div></div>
            <div class="field-controls" id="f8-actions"></div>
            <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre></section>
            <aside>
              <h3>시설 지도</h3><div id="f8-map" class="f8-map"></div>
              <h3>전자 손목 밴드</h3><div id="f8-band"></div>
              <h3>이용 안내문</h3><div id="field-tools"></div>
            </aside></div><div id="field-outcome"></div>`;
        const pre = document.createElement('pre'); pre.className = 'field-rules';
        const source = document.querySelector(data.reportSelector);   // single source: same text as the Story window / 8화.txt
        pre.textContent = source ? source.value : '안내문 연결 불가';
        $('field-tools').append(pre);
        for (const [id, label] of Object.entries(data.zones)) {
            const b = btn(label, 'move', id, 'f8-move-' + id);
            const [r, c] = data.layout[id]; b.style.gridRow = r; b.style.gridColumn = c;
            $('f8-map').append(b);
        }
    }

    function btn(label, name, value, id) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id;
        el.addEventListener('click', () => FieldCore.action(name, value)); return el;
    }
    const whistleOf = d => (d.overlay && d.overlay.kind === 'whistle') ? d.overlay : (d.scene && d.scene.kind === 'whistle') ? d.scene : null;

    function describe(s) {
        const d = s.data, e = d.scene, zone = data.zones[d.zone];
        if (!e) {
            if (d.core.closing) return `${zone}. 음악이 꺼진 워터파크. 출구 쪽 불빛만 켜져 있다.`;
            if (d.zone === 'spa') return data.text.spaZone;
            if (d.zone === 'food') return data.text.foodZone;
            if (d.zone === 'sunbed') return data.text.sunbedZone(d.band.sunbed);
            if (d.zone === 'slide') return data.text.slideQueue;
            return d.clock >= data.clock.late ? `${zone}. 사람들이 물 쪽으로 천천히 걸어간다.` : `${zone}. 물놀이 소리와 여름 광고 음악.`;
        }
        switch (e.kind) {
            case 'locker':
                if (e.phase === 'band') return '입장 게이트를 지나 탈의실 입구. 손에 전자 손목 밴드가 들려 있다.';
                if (e.phase === 'store') return data.text.lockerZone;
                if (e.phase === 'calm') return '탈의실. 사물함을 잠갔다. 조용하다.';
                return d.breath ? `탈의실. 숨을 참고 있다. ${e.n}번 사물함 문이 열려 있다.` : `탈의실. 아무도 없는 ${e.n}번 사물함 문이 열려 있다.`;
            case 'report': return '안내 데스크. 직원이 이쪽을 본다.';
            case 'wave':
                if (e.phase === 'ride') return '파도풀. 파도가 몰아친다.';
                return e.phase === 'still' ? '파도풀. 발밑의 물이 잔잔하다. 다음 파도는 아직이다.' : '파도풀. 파도가 물러갔다. 모두 물에서 일어선다.';
            case 'slide':
                if (e.phase === 'queue') return data.text.slideQueue;
                if (e.phase === 'blackout') return '';
                return e.phase === 'stopped' ? '슬라이드 안. 벽에 팔을 버틴 채 멈춰 있다. 아래에서 물소리가 올라온다.' : '슬라이드 안. 물살이 몸을 끌어내린다.';
            case 'aloneChild': return `${zone}. 혼자 있는 아이가 손을 내밀고 올려다본다.`;
            case 'bandFloat': return `${zone}. 풀린 손목 밴드가 물 위에 떠 있다.`;
            case 'whistle': return e.phase === 'empty' ? `${zone}. 가장 가까운 안전 요원대가 비어 있다.` : `${zone}. 호루라기 소리.`;
            case 'character': return `${zone}. 캐릭터가 혼자 서 있다. 인솔 직원이 없다. 큰 얼굴이 이쪽을 향해 있다.`;
            case 'bath': return e.phase === 'bell' ? '온천 스파. 안내종이 울린다.' : (e.thirst ? '온천 스파. 목이 마르다. 탕 가장자리에 생수병이 있다.' : '온천 스파. 김이 오른다.');
            case 'food': return e.phase === 'ask' ? '푸드코트. 직원이 테이블 옆에 서 있다.' : (e.extra ? `푸드코트. 주문한 음식 옆에 ${data.unordered}.` : '푸드코트. 주문한 음식.');
            case 'sunbed': return e.lure ? `선베드. 바로 앞에 빈 선베드. 밴드 표기 ${d.band.sunbed}은 저쪽 끝이다.` : `선베드. 밴드 표기 ${d.band.sunbed}은 저쪽 끝이다.`;
            case 'closing': return e.phase === 'broadcast' ? '음악이 멈춘다.' : '폐장 후에도 풀 안에 사람들이 남아 있다.';
            case 'settle': return e.phase === 'door' ? '출구. 자동문이 열려 있다.' : '출구. 정산기.';
            default: return `${zone}.`;
        }
    }

    function actions(s) {
        const d = s.data, e = d.scene, list = [];
        const add = (...args) => list.push(btn(...args));
        const w = whistleOf(d);
        if (d.overlay && d.overlay.kind === 'nameBroadcast') add('대답한다', 'answer', null, 'f8-answer');
        if (w) {
            if (w.phase === 'blow') { add('그 자리에서 멈춘다', 'freeze', null, 'f8-freeze'); add('하던 대로 계속 움직인다', 'keepSwimming', null, 'f8-keep-swim'); }
            else if (w.phase === 'frozen') add('가장 가까운 안전 요원대를 본다', 'checkTower', null, 'f8-check-tower');
            else {
                add(e && e.kind === 'character' ? '돌아서서 물 밖으로 나간다' : '물 밖으로 나온다', 'leaveWater', null, 'f8-leave-water');
                add('검은 반바지 차림의 요원에게 도움을 청한다', 'askBlack', null, 'f8-ask-black');
                add('물속에서 기다린다', 'stayWater', null, 'f8-stay-water');
            }
        }
        if (!e) {
            if (d.zone === 'spa') add('탕에 들어간다', 'enterBath', null, 'f8-enter-bath');
            if (d.zone === 'food') data.menu.forEach((m, i) => add(`${m.name} 주문 (${m.price.toLocaleString()}원)`, 'order', i, 'f8-order-' + i));
            if (d.zone === 'sunbed') add('선베드에서 쉬어 간다', 'rest', null, 'f8-rest');
        } else switch (e.kind) {
            case 'locker':
                if (e.phase === 'band') add('전자 손목 밴드를 찬다', 'wearBand', null, 'f8-wear-band');
                if (e.phase === 'store') for (const n of [d.band.locker, ...d.otherLockers].sort((a, b) => a - b)) add(`${n}번 사물함`, 'openLocker', n, 'f8-locker-' + n);
                if (e.phase === 'open') {
                    // Tap once to stop breathing; the gauge shows how long the held breath lasts, then walk out.
                    if (!d.breath) add('숨을 멈춘다', 'breath', true, 'f8-breath');
                    else {
                        const gauge = document.createElement('div'); gauge.className = 'f8-gauge'; gauge.id = 'f8-breath-gauge';
                        gauge.innerHTML = '<span>숨</span><i><b></b></i>'; list.push(gauge);
                        add('탈의실 밖으로 나간다', 'move', 'desk', 'f8-leave-locker');
                    }
                }
                break;
            case 'report':
                add('탈의실 사물함이 저절로 열렸다고 신고한다', 'report', null, 'f8-report');
                add('별일 아니라며 지나간다', 'pass', null, 'f8-pass');
                break;
            case 'wave':
                if (e.phase === 'receded') add('시선을 떨군다', 'avert', null, 'f8-avert');
                if (e.phase !== 'ride') {
                    add('그 사람을 쳐다본다', 'meetEyes', null, 'f8-meet-eyes');
                    add('손을 흔든다', 'waveHand', null, 'f8-wave-hand');
                    add('물 밖으로 나간다', 'leavePool', null, 'f8-leave-pool');
                }
                break;
            case 'slide':
                if (e.phase === 'queue') { add('출발한다', 'ride', null, 'f8-ride'); break; }
                add('곡선을 센다', 'count', null, 'f8-count');
                add('몸을 웅크린다', 'tuck', null, 'f8-tuck');
                add('벽면에 몸을 붙인다', 'wall', null, 'f8-wall');
                add('눈을 감는다', 'eyesShut', null, 'f8-eyes-shut');
                add('양팔을 벌린다', 'arms', null, 'f8-arms');
                add('멈춘다', 'stop', null, 'f8-stop');
                add('속도를 늦춘다', 'slow', null, 'f8-slow');
                break;
            case 'aloneChild':
                add('손을 잡아 준다', 'giveHand', null, 'f8-give-hand');
                add('"엄마는 어디 계시니?"', 'askParent', null, 'f8-ask-parent');
                add('"오늘 수술받는 날이 아니었니?"', 'sayLine', null, 'f8-say-line');
                add('안내 데스크로 데려간다', 'leadDesk', null, 'f8-lead-desk');
                break;
            case 'bandFloat':
                add('밴드를 건져서 다시 찬다', 'grabBand', null, 'f8-grab-band');
                add('힘껏 안전 요원을 부른다', 'callLifeguard', null, 'f8-call-lifeguard');
                break;
            case 'character':
                add('다가가 본다', 'approach', null, 'f8-approach');
                add('같이 사진을 찍는다', 'photoMascot', null, 'f8-photo-mascot');
                add('돌아서서 자리를 뜬다', 'runAway', null, 'f8-run-away');
                add(data.water.includes(d.zone) ? '캐릭터를 마주 본 채 인파 쪽으로 뒷걸음질 친다' : '등을 보이지 않고 인파 쪽으로 물러난다', 'backAway', null, 'f8-back-away');
                break;
            case 'bath':
                add('생수를 마신다', 'drink', null, 'f8-drink');
                add('탕에서 나온다', 'exitBath', null, 'f8-exit-bath');
                break;
            case 'food':
                if (e.phase === 'served') {
                    if (e.extra) {
                        add('"이건 주문하지 않았는데요."', 'notOrdered', null, 'f8-not-ordered');
                        add('주문하지 않은 건 남긴다', 'leaveFood', null, 'f8-leave-food');
                        add('전부 먹는다', 'eatAll', null, 'f8-eat-all');
                    } else add('먹는다', 'eat', null, 'f8-eat');
                } else {
                    add('"다음 주 화요일이요."', 'answerDate', null, 'f8-answer-date');
                    add('"수술은 안 받는데요?"', 'answerOther', null, 'f8-answer-other');
                    add('"오늘은 아닙니다."', 'notToday', null, 'f8-not-today');
                    add('"글쎄요, 잘 모르겠네요."', 'answerUnsure', null, 'f8-answer-unsure');
                }
                break;
            case 'sunbed':
                if (e.lure) {
                    add('바로 앞 빈 선베드에 눕는다', 'nearBed', 'a', 'f8-near-bed');
                    add('수건만 놓인 선베드에 앉는다', 'nearBed', 'b', 'f8-towel-bed');
                }
                add(`${d.band.sunbed} 선베드까지 걸어간다`, 'ownBed', null, 'f8-own-bed');
                add('쉬지 않고 일어난다', 'standUp', null, 'f8-stand-up');
                break;
            case 'closing':
                if (e.phase === 'stay') { add('조금 더 놀고 간다', 'playMore', null, 'f8-play-more'); add('"아니요, 괜찮습니다." 정중히 거절한다', 'refuse', null, 'f8-refuse'); }
                if (e.phase === 'blocked') add('뿌리치고 빠져나간다', 'shove', null, 'f8-shove');
                break;
            case 'settle':
                if (e.phase === 'statement') {
                    add('결제', 'pay', null, 'f8-pay'); add('이의 제기', 'dispute', null, 'f8-dispute');
                    add('환불 요청', 'refund', null, 'f8-refund'); add('직원 호출', 'callStaff', null, 'f8-call-staff');
                } else if (e.phase === 'staff') {
                    add('"이 내역은 쓰지 않았어요."', 'staffDispute', null, 'f8-staff-dispute');
                    add('"아닙니다. 그대로 결제하겠습니다."', 'staffPay', null, 'f8-staff-pay');
                } else if (e.phase === 'paid') add('손목 밴드를 반납한다', 'returnBand', null, 'f8-return-band');
                else if (e.phase === 'door') add('밖으로 나간다', 'goOut', null, 'f8-go-out');
                break;
        }
        $('f8-actions').replaceChildren(...list);
    }

    function band(s) {
        const d = s.data, root = $('f8-band'); root.replaceChildren();
        const p = document.createElement('p'); p.className = 'field-help';
        const lines = [];
        if (!d.band.attached) lines.push('반납 완료');
        else {
            if (d.zone === 'locker') lines.push(`배정 사물함 ${d.band.locker}번`);
            if (d.zone === 'sunbed') lines.push(`배정 선베드 ${d.band.sunbed}`);
            if (d.scene && d.scene.kind === 'settle') lines.push(`정산 ${d.charges.length}건`);
            if (!lines.length) lines.push('사물함 개폐 · 시설 내 결제');
        }
        p.textContent = lines.join(' · '); root.append(p);
        if (d.band.attached) {
            root.append(btn('긴급 전화 버튼', 'emergency', null, 'f8-emergency'));
            if (d.band.loose) { root.append(btn('밴드를 조인다', 'tighten', null, 'f8-tighten')); root.append(btn('손목을 몸쪽으로 붙인다', 'wristIn', null, 'f8-wrist-in')); }
            root.append(btn('밴드를 푼다', 'removeBand', null, 'f8-remove-band'));
        }
    }

    function scene(s) {
        const d = s.data, e = d.scene, root = $('f8-scene');
        root.className = `field-camera f8-scene f8-z-${d.zone}${d.clock >= data.clock.late ? ' f8-late' : ''}${d.core.closingStarted ? ' f8-closed' : ''}`;
        $('f8-text').textContent = describe(s);
        const o = d.overlay || (e && e.kind === 'whistle' ? e : null), alert = $('f8-alert');
        if (o) { alert.hidden = false; alert.textContent = o.kind === 'nameBroadcast' ? data.text.nameBroadcast : '삐익— 호루라기'; }
        else alert.hidden = true;
        const crowd = $('f8-crowd');
        if (e && e.kind === 'wave' && e.phase !== 'ride') {
            const people = data.crowdWet.slice(); people.splice(e.dry % (people.length + 1), 0, data.crowdDry);
            crowd.hidden = false; crowd.textContent = people.join(' / ');
        } else crowd.hidden = true;
        const tunnel = $('f8-tunnel');
        if (e && e.kind === 'slide' && e.phase !== 'queue') {
            tunnel.hidden = false;
            tunnel.className = e.phase === 'blackout' ? 'f8-dark' : e.phase === 'stopped' ? 'f8-stopped' : (e.curve % 2 ? 'f8-swerve-l' : 'f8-swerve-r');
            $('f8-count-view').textContent = e.count ? String(e.count) : '';
        } else tunnel.hidden = true;
        const panel = $('f8-panel');
        if (e && e.kind === 'settle') {
            const rows = d.charges.map(c => `${c.label.padEnd(16, ' ')} ${c.price.toLocaleString().padStart(8, ' ')}`);
            const sum = FieldCore.mission('EP08').total(d);
            panel.hidden = false;
            panel.textContent = `유성 워터파크 이용 정산\n${'-'.repeat(28)}\n${rows.join('\n')}\n${'-'.repeat(28)}\n${'TOTAL'.padEnd(16, ' ')} ${sum.toLocaleString().padStart(8, ' ')}${e.phase === 'paid' || e.phase === 'door' ? '\n결제 승인' : ''}`;
        } else panel.hidden = true;
    }

    function video(s) {
        const el = $('f8-video'); if (!el) return;
        const e = s.data.scene, k = e && e.kind;
        const src = k === 'slide' ? data.video.slide : k === 'food' ? data.video.food : k === 'character' ? data.video.mascot : k === 'settle' ? data.video.exit : data.video.idle;
        if (src !== lastVideo) { lastVideo = src; el.src = src; el.play().catch(() => {}); }
        if (s.status !== 'active') el.pause();
    }

    function render(s) {
        if (!s || !$('f8-clock')) return;
        const d = s.data, M = FieldCore.mission('EP08');
        $('f8-clock').textContent = M.hhmm(d.clock);
        $('f8-zone').textContent = data.zones[d.zone];
        $('f8-band-hud').textContent = !d.band.attached ? 'BAND: RETURNED' : d.band.loose ? 'BAND: LOOSE' : d.band.issued > 1 ? 'BAND: REISSUED' : 'BAND: ACTIVE';
        for (const id of Object.keys(data.zones)) {
            const b = $('f8-move-' + id); if (!b) continue;
            b.setAttribute('aria-pressed', String(id === d.zone));
            b.disabled = s.status !== 'active' || !(id === d.zone || data.adjacent[d.zone].includes(id));
        }
        scene(s);
        const strip = (k, v) => (['t', 'el', 'held', 'from', 'ovT', 'floatT'].includes(k) ? undefined : v);
        const next = JSON.stringify([d.zone, JSON.stringify(d.scene, strip), JSON.stringify(d.overlay, strip), JSON.stringify(d.band, strip), d.breath, d.charges.length, d.clock >= data.clock.late, s.status]);
        if (next !== sig) { sig = next; actions(s); band(s); }
        const gauge = $('f8-breath-gauge');
        if (gauge && d.scene && d.scene.kind === 'locker') gauge.querySelector('b').style.width = `${Math.max(0, 1 - (d.scene.held || 0) / data.tuning.breathMax) * 100}%`;
        video(s);
    }

    return { mount, render };
})();
