// EP07 view: night-shift convenience-store counter. Top = in-game clock / auto-door chime-vs-exit count / mirror
// hint. Middle = store scene + current customer. Bottom = POS and the immediate reaction buttons (correct and
// incorrect options sit side by side; nothing is labeled with an event name or flag). Right = HQ line, disposal
// tools (SNS-0719) and the '알바지옥' app (only meaningful once 06:00 arrives).
window.FieldEP07UI = (() => {
    const data = FieldEP07Data;
    const $ = id => document.getElementById(id);
    let sig = '', lastVideo = '';

    function mount(root) {
        sig = ''; lastVideo = '';
        root.innerHTML = `<div class="field-hud"><strong id="f7-clock"></strong><span id="f7-door"></span><span id="f7-mirror"></span></div>
            <div class="field-grid"><section class="field-observation">
            <div class="field-camera f7-store" id="f7-store"><video id="f7-video" muted loop playsinline></video><div class="field-scanlines"></div>
              <div id="f7-text"></div><div id="f7-pos" hidden></div></div>
            <div class="field-controls" id="f7-actions"></div>
            <pre id="field-log" role="log" aria-label="현장 통신 기록"></pre></section>
            <aside>
              <h3>본부 연락</h3><div id="f7-hq"></div>
              <h3>폐기 도구</h3><div id="f7-disposal"></div>
              <h3>알바지옥</h3><div id="f7-app"></div>
              <h3>수칙 문서</h3><div id="field-tools"></div>
            </aside></div><div id="field-outcome"></div>`;
        const pre = document.createElement('pre'); pre.className = 'field-rules';
        const source = document.querySelector(data.reportSelector);   // single source: same text as the Story window / 7화.txt
        pre.textContent = source ? source.value : '수칙 문서 연결 불가';
        $('field-tools').append(pre);
        $('f7-hq').append(btn('본부에 연락한다 (0050-0200)', 'hqCall', null, 'f7-hq-call'));
    }

    function btn(label, name, value, id) {
        const el = document.createElement('button'); el.type = 'button'; el.textContent = label; el.id = id;
        el.addEventListener('click', () => FieldCore.action(name, value)); return el;
    }

    function describe(s) {
        const d = s.data;
        if (d.visit === 'F') return '진열대 앞이다.';
        if (d.visit === 'G') return '계산대 안쪽이다. 창밖이 밝지 않다.';
        if (d.customerPresent) return '손님이 계산대 앞에 서 있다.';
        return '매장 안이 비어 있다.';
    }

    const mirrorDone = d => d.mirrorState === 'clear' || d.mirrorState === 'away';

    function pos(s) {
        const d = s.data, el = $('f7-pos');
        if (!mirrorDone(d)) { el.hidden = true; return; }   // nothing is scanned before the mirror check
        if ((d.visit === 'N' || d.visit === 'A') && d.customerPresent) { el.hidden = false; el.textContent = `상품명: ${d.nItem}`; return; }
        if (d.visit === 'D' && d.dTier) { el.hidden = false; el.textContent = `상품명: [ 코드만 표시 ]  /  가격: ${d.dTier.price.toLocaleString()}원`; return; }
        el.hidden = true;
    }

    function actions(s) {
        const d = s.data, list = [];
        const add = (...args) => list.push(btn(...args));
        if (d.customerPresent && d.mirrorState === '') {
            add('결제기 화면을 보는 척 거울을 확인한다', 'mirrorCheck', null, 'f7-mirror-check');
        } else if (d.visit === 'A' && d.mirrorState === 'corridor') {
            add('시선을 거둔다', 'mirrorAway', null, 'f7-mirror-away');
        } else if (d.visit === 'N') {
            add('결제를 진행한다', 'payNormal', null, 'f7-pay-normal');
        } else if (d.visit === 'A') {
            add('결제를 진행한다', 'payA', null, 'f7-pay-a');
        } else if (d.visit === 'B') {
            if (!d.idRevealed) { add('신분증을 확인한다', 'idCheck', null, 'f7-id-check'); add('사진과 실물이 다르다며 판매를 거절한다', 'idRefuse', null, 'f7-id-refuse'); }
            else {
                add('받았을 때와 같은 손짓과 속도로 돌려준다', 'idReturnSame', null, 'f7-id-same');
                add('놀라며 뒷걸음질 친다', 'idReturnStartled', null, 'f7-id-startled');
                add('빠르게 던지듯 돌려준다', 'idReturnWrongSpeed', null, 'f7-id-wrong-speed');
            }
        } else if (d.visit === 'C') {
            add('가격표를 가리킨다', 'cPointPrice', null, 'f7-c-price');
            add('화면을 가리킨다', 'cPointScreen', null, 'f7-c-screen');
            add('입으로 대답한다', 'cAnswerAloud', null, 'f7-c-answer');
        } else if (d.visit === 'G') {
            add('매장 밖으로 나간다', 'goOutside', null, 'f7-go-outside');
        }
        if (d.customerPresent) add('손님에게 먼저 말을 건다', 'speakFirst', null, 'f7-speak-first');
        if (!d.doorLocked) add('자동문을 잠근다', 'lockDoor', null, 'f7-lock-door');
        add('계산대를 비우고 화장실에 다녀온다', 'leaveCounter', null, 'f7-leave-counter');
        $('f7-actions').replaceChildren(...list);
    }

    function disposal(s) {
        const root = $('f7-disposal'); root.replaceChildren();
        const d = s.data;
        root.append(btn('회수 집게(SNS-0719)로 집는다', 'fTongs', null, 'f7-f-tongs'));
        root.append(btn('동봉된 회수 용기에 담는다', 'fContained', null, 'f7-f-contained'));
        root.append(btn('맨손으로 치운다', 'fBarehand', null, 'f7-f-barehand'));
        root.append(btn('폐기 등록한다', 'fReregister', null, 'f7-f-reregister'));
        const hint = document.createElement('p'); hint.className = 'field-help';
        hint.textContent = d.visit === 'F' ? `상태: ${d.fStage === '' ? '미처리' : d.fStage === 'tongs' ? '집게로 집음' : d.fStage === 'contained' ? '용기에 담음' : '보고 완료'}` : '해당 상황이 아니면 효과가 없다.';
        root.append(hint);
    }

    function appPanel(s) {
        const root = $('f7-app'); root.replaceChildren();
        const d = s.data;
        if (d.visit !== 'G') { const p = document.createElement('p'); p.className = 'field-help'; p.textContent = '근무 종료 시각에 필요합니다.'; root.append(p); return; }
        if (!d.appOpen) { root.append(btn('알바지옥 앱을 연다', 'openApp', null, 'f7-app-open')); return; }
        root.append(btn('근무 종료', 'pressEnd', null, 'f7-app-end'));
        const p = document.createElement('p'); p.className = 'field-help'; p.textContent = `누른 횟수: ${d.gPresses}`; root.append(p);
    }

    function video(s) {
        const el = $('f7-video'); if (!el) return;
        const d = s.data;
        const src = d.visit === 'A' && d.mirrorState === 'corridor' ? data.video.mirror
            : d.visit === 'B' && d.idRevealed ? data.video.id
            : d.visit === 'D' && mirrorDone(d) ? data.video.barcode
            : d.visit === 'G' ? data.video.dawn
            : data.video.idle;
        if (src !== lastVideo) { lastVideo = src; el.src = src; el.play().catch(() => {}); }
        if (s.status === 'dead') el.pause();
    }

    function render(s) {
        if (!s || !$('f7-clock')) return;
        const d = s.data;
        const total = data.queue.length + 1;
        const idx = Math.min(total, Math.max(0, d.queueIdx + 1));
        $('f7-clock').textContent = `${FieldCore.time(Math.round((idx / total) * 480))} → 06:00`;
        $('f7-door').textContent = (d.chimes === d.exits ? `자동문 정상 (${d.chimes}/${d.exits})` : `자동문 알림음 불일치 (${d.chimes}/${d.exits})`) + (d.doorLocked ? ' · 잠김' : '');
        $('f7-mirror').textContent = d.visit === 'A' && d.mirrorState === 'corridor' ? '거울 확인 중' : '방범거울 정상';
        $('f7-text').textContent = describe(s);
        pos(s);
        const next = JSON.stringify([d.visit, d.mirrorState, d.idRevealed, d.dTier && d.dTier.price, d.dReported, d.ePhase, d.fStage, d.appOpen, d.gPresses, d.customerPresent, d.doorLocked, s.status]);
        if (next !== sig) { sig = next; actions(s); disposal(s); appPanel(s); }
        video(s);
    }

    return { mount, render };
})();
