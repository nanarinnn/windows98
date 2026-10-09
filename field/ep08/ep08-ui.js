// EP08 view: water-park day. Top = band clock / current zone / wristband state. Middle = facility scene + immediate
// actions (correct and incorrect options side by side; nothing is labeled with an event name or flag). Right = park map
// (12 zones), electronic wristband (assignments, next itinerary stop, payments, emergency-call button) and the rule
// document read from the Story window.
window.FieldEP08UI = (() => {
    const data = FieldEP08Data;
    const $ = id => document.getElementById(id);
    let sig = '', lastVideo = '';

    function mount(root) {
        sig = ''; lastVideo = '';
        root.innerHTML = `<div class="field-hud"><strong id="f8-clock"></strong><span id="f8-zone"></span><span id="f8-band-hud"></span></div>
            <div class="field-grid"><section class="field-observation">
            <div class="field-camera f8-scene" id="f8-scene"><video id="f8-video" muted loop playsinline></video><div class="field-scanlines"></div>
              <div id="f8-text"></div><div id="f8-panel" hidden></div></div>
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
        for (const [id, label] of Object.entries(data.zones)) $('f8-map').append(btn(label, 'move', id, 'f8-move-' + id));
    }

    function btn(label, name, value, id) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id;
        el.addEventListener('click', () => FieldCore.action(name, value)); return el;
    }

    const clock = d => { const m = 600 + data.stages[Math.min(d.stage, data.stages.length - 1)].at; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

    function describe(s) {
        const d = s.data, e = d.ev, zone = data.zones[d.zone];
        if (!e) return `${zone}. 사람들이 오간다.`;
        switch (e.kind) {
            case 'lockerOpen': return e.phase === 'open' ? `탈의실. ${e.n}번 사물함 문이 열려 있다.` : `탈의실. 숨을 참고 있다. ${e.n}번 사물함 문이 열려 있다.`;
            case 'lostChild': return '키즈존. 아이가 울며 주위를 두리번거린다.';
            case 'aloneChild': return '키즈존. 혼자 있는 아이가 손을 내밀고 기다린다.';
            case 'wave': return e.phase === 'wave' ? '파도풀. 파도가 몰아친다.' : '파도풀. 파도가 물러갔다.';
            case 'unwet': return '파도풀. 모두 젖어 있다. 한 사람만 물기 하나 없이 서 있다.';
            case 'whistle': return e.phase === 'empty' ? '파도풀. 가장 가까운 안전 요원대가 비어 있다.' : '파도풀. 후루라기 소리.';
            case 'float': return '파도풀. 풀린 손목 밴드가 물 위에 떠 있다.';
            case 'bath': return e.phase === 'bell' ? '온천 스파. 안내종이 울린다.' : '온천 스파. 김이 오른다.';
            case 'ride': return `워터 슬라이드. 미끄러져 내려가는 중. 내가 센 곡선: ${e.count}${e.stopped ? ' / 멈춰 있다' : ''}`;
            case 'mascot': return '캐릭터 포토존. 캐릭터가 혼자 서 있다. 인솔 직원이 없다.';
            case 'stay': case 'blocked': return '파도풀. 폐장 후에도 풀 안에 사람들이 남아 있다.';
            case 'statement': return '출구. 손목 밴드 정산 내역.';
            default: return `${zone}.`;
        }
    }

    function panel(s) {
        const d = s.data, el = $('f8-panel');
        if (d.ev && d.ev.kind === 'statement') {
            const lines = d.band.purchases.map(p => `${p.label.padEnd(14, ' ')} ${p.price.toLocaleString()}원`);
            el.hidden = false; el.textContent = `[정산 내역]\n${lines.join('\n')}\n합계 ${FieldCore.mission('EP08').total(d).toLocaleString()}원${d.ev.paid ? '  — 결제 완료' : ''}`; return;
        }
        el.hidden = true;
    }

    function actions(s) {
        const d = s.data, e = d.ev, list = [];
        const add = (...args) => list.push(btn(...args));
        if (e) switch (e.kind) {
            case 'entry': add('전자 손목 밴드를 착용한다', 'wearBand', null, 'f8-wear-band'); break;
            case 'lockerUse':
                for (const n of [d.band.locker, ...d.otherLockers].sort((a, b) => a - b)) add(`${n}번 사물함을 연다`, 'openLocker', n, 'f8-locker-' + n);
                break;
            case 'lockerOpen':
                if (e.phase === 'open') add('숨을 멈춘다', 'holdBreath', null, 'f8-hold-breath');
                add('열린 사물함 안을 들여다본다', 'lookLocker', null, 'f8-look-locker');
                break;
            case 'report': add('안내 데스크에 접수한다', 'reportDesk', null, 'f8-report-desk'); break;
            case 'lostChild': add('아이 손을 잡고 데려간다', 'holdHand', null, 'f8-hold-hand'); break;
            case 'aloneChild':
                add('손을 내민다', 'giveHand', null, 'f8-give-hand');
                add('"오늘 수술받는 날이 아니었니?"', 'sayLine', null, 'f8-say-line');
                add('"엄마는 어디 계시니?"', 'askParent', null, 'f8-ask-parent');
                add('안내 데스크로 데려간다', 'leadToDesk', null, 'f8-lead-desk');
                break;
            case 'wave': if (e.phase === 'after') add('주위를 살펴본다', 'lookAround', null, 'f8-look-around'); break;
            case 'loose':
                add('손목을 몸쪽으로 붙인다', 'wristIn', null, 'f8-wrist-in');
                add('밴드를 조인다', 'tighten', null, 'f8-tighten');
                break;
            case 'unwet':
                if (e.phase === 'seen') add('시선을 떨구고 그 자리에서 움직이지 않는다', 'avert', null, 'f8-avert');
                add('그 사람을 똑바로 본다', 'meetEyes', null, 'f8-meet-eyes');
                add('다가가 말을 건다', 'talkUnwet', null, 'f8-talk-unwet');
                break;
            case 'whistle':
                if (e.phase === 'blow') { add('즉시 동작을 멈춘다', 'freeze', null, 'f8-freeze'); add('계속 헤엄친다', 'keepSwimming', null, 'f8-keep-swim'); }
                else if (e.phase === 'frozen') add('가장 가까운 안전 요원대를 확인한다', 'checkTower', null, 'f8-check-tower');
                else {
                    add('즉시 물 밖으로 나온다', 'leaveWater', null, 'f8-leave-water');
                    add('검은 반바지 차림의 안전 요원에게 도움을 청한다', 'askBlack', null, 'f8-ask-black');
                    add('물속에서 기다린다', 'stayWater', null, 'f8-stay-water');
                }
                break;
            case 'float':
                add('힘껏 안전 요원을 부른다', 'callLifeguard', null, 'f8-call-lifeguard');
                add('밴드를 주워 다시 찬다', 'grabBand', null, 'f8-grab-band');
                break;
            case 'sunbed': {
                const beds = [d.band.sunbed, ...d.otherBeds].sort();
                const flavor = ['(그늘, 오래 비어 있음)', '(수건만 놓여 있음)'];
                let i = 0;
                for (const b of beds) add(`${b} 선베드를 이용한다 ${b === d.band.sunbed ? '(파라솔 아래)' : flavor[i++]}`, 'useBed', b, 'f8-bed-' + b);
                break;
            }
            case 'broadcast': add('대답한다', 'answer', null, 'f8-answer'); break;
            case 'spaWait': add('탕에 들어간다', 'enterBath', null, 'f8-enter-bath'); break;
            case 'bath':
                add('물을 마신다', 'drink', null, 'f8-drink');
                if (d.thirst) add('참는다', 'endure', null, 'f8-endure');
                add('탕에서 나온다', 'exitBath', null, 'f8-exit-bath');
                break;
            case 'slideWait': add('슬라이드를 탄다', 'ride', null, 'f8-ride'); break;
            case 'ride':
                add('곡선을 센다', 'count', null, 'f8-count');
                add('양팔을 벌린다', 'arms', null, 'f8-arms');
                add('벽면에 밀착한다', 'wall', null, 'f8-wall');
                add('속도를 낮춘다', 'slow', null, 'f8-slow');
                add('멈춘다', 'stop', null, 'f8-stop');
                break;
            case 'injury':
                add('정중하게 거절한다', 'decline', null, 'f8-decline');
                add('따라간다', 'follow', null, 'f8-follow');
                break;
            case 'order': data.menu.forEach((m, i) => add(`${m.name} 주문 (${m.price.toLocaleString()}원)`, 'order', i, 'f8-order-' + i)); break;
            case 'unordered':
                add('남기지 않고 전부 먹는다', 'eatAll', null, 'f8-eat-all');
                add('주문하지 않은 메뉴는 남긴다', 'leaveFood', null, 'f8-leave-food');
                add('주문하지 않았다며 돌려보낸다', 'returnFood', null, 'f8-return-food');
                break;
            case 'ask':
                add('"오늘은 아닙니다."', 'notToday', null, 'f8-not-today');
                add('"다음 주 화요일입니다."', 'answerDate', null, 'f8-answer-date');
                add('"수술 받을 일 없습니다."', 'answerOther', null, 'f8-answer-other');
                break;
            case 'photoNormal':
                add(`캐릭터와 사진을 찍는다 (${data.photoPrice.toLocaleString()}원)`, 'takePhoto', null, 'f8-take-photo');
                add('사진은 찍지 않는다', 'skipPhoto', null, 'f8-skip-photo');
                break;
            case 'mascot':
                add('등을 보이지 않고 인파 쪽으로 물러난다', 'backAway', null, 'f8-back-away');
                add('다가가 본다', 'approach', null, 'f8-approach-mascot');
                add('사진을 찍으러 간다', 'photoMascot', null, 'f8-photo-mascot');
                add('돌아서서 뛴다', 'runAway', null, 'f8-run-away');
                break;
            case 'stay':
                add('정중하게 거절한다', 'refuse', null, 'f8-refuse');
                add('조금 더 놀고 간다', 'playMore', null, 'f8-play-more');
                break;
            case 'blocked': add('뿌리치고 빠져나간다', 'shove', null, 'f8-shove'); break;
            case 'statement':
                if (!e.paid) {
                    add('표시된 금액을 그대로 결제한다', 'pay', null, 'f8-pay');
                    add('이용하지 않은 내역에 이의를 제기한다', 'dispute', null, 'f8-dispute');
                    add('환불을 요구한다', 'refund', null, 'f8-refund');
                } else add('손목 밴드를 반납한다', 'returnBand', null, 'f8-return-band');
                break;
        }
        $('f8-actions').replaceChildren(...list);
    }

    function band(s) {
        const d = s.data, root = $('f8-band'); root.replaceChildren();
        const p = document.createElement('p'); p.className = 'field-help';
        const next = d.stage < data.stages.length ? data.zones[data.stages[d.stage].zone] : '-';
        p.textContent = d.band.attached
            ? `사물함 ${d.band.locker}번 · 선베드 ${d.band.sunbed} · 결제 ${d.band.purchases.length}건 / 다음 이용 안내: ${next}`
            : '밴드 미착용 / 입구에서 지급';
        root.append(p);
        if (d.band.attached) {
            root.append(btn('긴급 전화 버튼', 'emergency', null, 'f8-emergency'));
            root.append(btn('밴드를 푼다', 'removeBand', null, 'f8-remove-band'));
        }
    }

    function video(s) {
        const el = $('f8-video'); if (!el) return;
        const d = s.data, k = d.ev && d.ev.kind;
        const src = k === 'ride' || k === 'slideWait' ? data.video.slide
            : ['order', 'unordered', 'ask'].includes(k) ? data.video.food
            : k === 'mascot' ? data.video.mascot
            : k === 'statement' ? data.video.exit
            : data.video.idle;
        if (src !== lastVideo) { lastVideo = src; el.src = src; el.play().catch(() => {}); }
        if (s.status !== 'active') el.pause();
    }

    function render(s) {
        if (!s || !$('f8-clock')) return;
        const d = s.data;
        $('f8-clock').textContent = `${clock(d)} → 18:00 폐장`;
        $('f8-zone').textContent = `현재 위치: ${data.zones[d.zone]}`;
        $('f8-band-hud').textContent = d.band.attached ? `손목 밴드 착용 (${d.band.issued > 1 ? '재지급' : '정상'})` : '손목 밴드 미착용';
        $('f8-text').textContent = describe(s);
        panel(s);
        for (const id of Object.keys(data.zones)) { const b = $('f8-move-' + id); if (b) b.setAttribute('aria-pressed', String(id === d.zone)); }
        const e = d.ev;
        const next = JSON.stringify([d.stage, d.zone, e && JSON.stringify(e, (k, v) => (k === 't' || k === 'elapsed') ? undefined : v), d.thirst, d.band.attached, d.band.issued, d.band.purchases.length, s.status]);
        if (next !== sig) { sig = next; actions(s); band(s); }
        video(s);
    }

    return { mount, render };
})();
